import { Injectable } from '@nestjs/common';
import createShuffle from 'fast-shuffle';
import { uniq } from 'lodash';
import { NftCollectionId } from '../collections/nft-collection.model';
import { NftCollectionService } from '../collections/nft-collection.service';
import { NftElasticsearchService } from '../elasticsearch/nft-elasticsearch.service';
import { AppLogger } from '../logging/logging.service';
import { NftSaleKind } from '../nft/nft-sale';
import { LamportAmount, Nft } from '../nft/nft.model';
import { NftService } from '../nft/nft.service';
import { NftHistoryService } from '../nfthistory/nft-history.service';
import { TagId } from '../tag/tag.model';
import { UserId } from '../user/model/user.model';
import { UserService } from '../user/user.service';
import {
  CollectionNewsItem,
  NewsItem,
  NewsItemKind,
  NftNewsItem,
  ProfileNewsItem,
} from './news-item.model';

const PROFILE_COUNT_PER_PAGE = 4;
const NFT_COUNT_PER_PAGE = 10;
const COLLECTION_COUNT_PER_PAGE = 6;

@Injectable()
export class NewsfeedService {
  constructor(
    private logger: AppLogger,
    private readonly nftService: NftService,
    private readonly collectionService: NftCollectionService,
    private readonly userService: UserService,
    private readonly nftElasticsearchService: NftElasticsearchService,
    private readonly nftHistoryService: NftHistoryService,
  ) {
    this.logger.setContext(this.constructor.name);
  }

  async get(filter?: NewsItemFilter, pageIndex = 0): Promise<NewsItem[]> {
    // for now, only get data from the DB and send it
    const profiles = await this.userService.getMany(
      {},
      {
        skip: pageIndex * PROFILE_COUNT_PER_PAGE,
        limit: PROFILE_COUNT_PER_PAGE,
        sort: { lastActivity: -1 },
      },
    );
    const nfts = await this.nftService.getMany(
      {},
      {
        skip: pageIndex * NFT_COUNT_PER_PAGE,
        limit: NFT_COUNT_PER_PAGE,
        sort: { createdAt: -1 },
      },
    );
    const collections = await this.collectionService.getMany(
      {},
      {
        skip: pageIndex * COLLECTION_COUNT_PER_PAGE,
        limit: COLLECTION_COUNT_PER_PAGE,
        sort: { createdAt: -1 },
      },
    );

    const newsfeedProfile: ProfileNewsItem[] = profiles.map((profile) => ({
      profile,
      kind: NewsItemKind.Profile,
    }));
    const newsfeedCollection: CollectionNewsItem[] = collections.map((collection) => ({
      collection,
      kind: NewsItemKind.Collection,
    }));
    const newsfeedNft: NftNewsItem[] = nfts.map((nft) => ({
      nft,
      kind: NewsItemKind.Nft,
    }));
    const content: NewsItem[] = [...newsfeedProfile, ...newsfeedCollection, ...newsfeedNft];
    const shuffle = createShuffle(pageIndex);
    return shuffle(content);
  }

  async getNftFeed(filter: GetNftFeedForUserFilter, pageIndex = 0): Promise<Nft[]> {
    const { titleOrDescription, saleKinds, maxPrice, minPrice, tagIds, fitPreferencesOfUserId } =
      filter;
    const nftUserPreferences: NftFeedUserPreferences = fitPreferencesOfUserId
      ? await this.getNftFeedUserPreferences(fitPreferencesOfUserId)
      : {};
    const pageSize = 20;
    return await this.nftElasticsearchService.get(
      {
        titleOrDescription,
        saleKinds,
        maxPrice,
        minPrice,
        requiredTagIds: tagIds,
        ...nftUserPreferences,
      },
      {
        skip: pageIndex * pageSize,
        limit: pageSize,
      },
    );
  }

  private async getNftFeedUserPreferences(userId: UserId): Promise<NftFeedUserPreferences> {
    // TODO Group mongo requests. Aggregation?
    const user = await this.userService.getByIdOrThrow(userId);
    const followedUsers = await this.userService.getMany({ followedByUserId: userId });
    const followedUserIds = followedUsers.map((u) => u._id);
    const boughtNftRecords = await this.nftHistoryService.getMany({ buyerIds: [userId] });
    const relevantNfts = await this.nftService.getMany({
      ids: uniq([
        ...user.bookmarks.map((b) => b.nftId), // Bookmarked NFTs
        ...boughtNftRecords.map((r) => r.nftId), // NFTs bought in the past
      ]),
    });
    const tagIds: TagId[] = uniq([...user.tagsId, ...relevantNfts.flatMap((nft) => nft.tagIds)]);
    const creatorIds = relevantNfts.map((nft) => nft.creatorId);
    const collectionIds = uniq(relevantNfts.map((nft) => nft.collectionId));
    return {
      recentBuyerIds: followedUserIds,
      bookmarkedByUserIds: followedUserIds,
      viewerIds: followedUserIds,
      favoredTagIds: tagIds,
      creatorIds,
      collectionIds,
    };
  }
}

export interface NewsItemFilter {
  tagsIds?: TagId[];
}

interface GetNftFeedForUserFilter {
  titleOrDescription?: string;
  saleKinds?: NftSaleKind[];
  maxPrice?: LamportAmount;
  minPrice?: LamportAmount;
  tagIds?: TagId[];
  fitPreferencesOfUserId?: UserId;
}

interface NftFeedUserPreferences {
  recentBuyerIds?: UserId[];
  bookmarkedByUserIds?: UserId[];
  viewerIds?: UserId[];
  favoredTagIds?: TagId[];
  creatorIds?: UserId[];
  collectionIds?: NftCollectionId[];
}
