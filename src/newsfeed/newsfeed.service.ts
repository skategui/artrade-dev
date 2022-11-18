import { Injectable } from '@nestjs/common';
import createShuffle from 'fast-shuffle';
import { CollectionService } from '../collections/collection.service';
import { AppLogger } from '../logging/logging.service';
import { NftService } from '../nft/nft.service';
import { TagId } from '../tag/tag.model';
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
    private readonly collectionService: CollectionService,
    private readonly userService: UserService,
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
}

export interface NewsItemFilter {
  tagsIds?: TagId[];
}
