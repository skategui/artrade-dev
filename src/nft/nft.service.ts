import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectModel } from '@nestjs/mongoose';
import { UserId } from 'aws-sdk/clients/appstream';
import DataLoader from 'dataloader';
import { keyBy } from 'lodash';
import { FilterQuery, Model } from 'mongoose';
import { BadInputError } from '../helpers/errors/BadInputError';
import { assertAllExisting } from '../helpers/get-or-create-dataloader';
import { MongoPagination, paginateQuery } from '../helpers/pagination/pagination';
import { AppLogger } from '../logging/logging.service';
import { TagService } from '../tag/tag.service';
import { CreateCommonNFTInput } from './dto/create-common-nft-input.dto';
import { CreateNFTAuctionInput } from './dto/create-nft-auction-input.dto';
import { CreateNFTFixedPriceInput } from './dto/create-nft-fixed-price-input.dto';
import { CreateNFTOfferInput } from './dto/create-nft-offer-input.dto';
import { FetchNFTImageBlockchainEvent } from './nft-metadata-event';
import {
  BaseNftSale,
  NftAuctionSale,
  NftFixedPriceSale,
  NftOpenToOfferSale,
  NftSaleKind,
} from './nft-sale';
import { NFT, NftId } from './nft.model';

@Injectable()
export class NftService {
  constructor(
    private logger: AppLogger,
    @InjectModel(NFT.name) private model: Model<NFT>,
    private readonly tagService: TagService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.logger.setContext(this.constructor.name);
  }

  async createFixedPriceNFT(input: CreateNFTFixedPriceInput, userId: UserId): Promise<NFT> {
    const sale: NftFixedPriceSale = {
      priceInSol: input.priceInSol,
      kind: NftSaleKind.FixedPrice,
    };
    return await this.create(input, userId, sale);
  }

  async createAuctionNFT(input: CreateNFTAuctionInput, userId: UserId): Promise<NFT> {
    const sale: NftAuctionSale = {
      startingPriceInSol: input.startingPriceInSol,
      startDate: input.startDate,
      endDate: input.endDate,
      kind: NftSaleKind.Auction,
      bids: [],
    };
    return await this.create(input, userId, sale);
  }

  async createOfferNFT(input: CreateNFTOfferInput, userId: UserId): Promise<NFT> {
    const sale: NftOpenToOfferSale = {
      kind: NftSaleKind.OpenToOffer,
      offers: [],
    };
    return await this.create(input, userId, sale);
  }

  private async create(
    input: CreateCommonNFTInput,
    userId: UserId,
    sale: BaseNftSale,
  ): Promise<NFT> {
    const doc = (
      await this.model.create({
        ...input,
        ...(input.tagIds ? { tags: await this.tagService.validateIdsExist(input.tagIds) } : {}),
        creatorId: userId,
        viewCount: 0,
        sale,
      })
    ).toObject();

    this.logger.debug(doc);

    // will run async task to get the data from the solana blockchain
    const payload: FetchNFTImageBlockchainEvent = {
      nftId: doc._id,
      mintAddress: doc.mintAddress,
    };
    this.eventEmitter.emit(FetchNFTImageBlockchainEvent.symbol, payload);
    return doc;
  }

  async getMany(filter?: NftFilter, pagination?: MongoPagination<NFT>): Promise<NFT[]> {
    this.logger.verbose('getMany');
    const mongoFilter = filterToMongoFilter(filter || {});
    const query = this.model.find(mongoFilter);
    const docs = await paginateQuery<NFT>(query, pagination).lean().exec();
    return docs;
  }

  async exists(CollectionIds: NftId[]): Promise<boolean> {
    const result = await this.model.count({ _id: { $in: CollectionIds } });
    return result === CollectionIds.length;
  }
  createDataloaderById(): DataLoader<NftId, NFT> {
    return new DataLoader<NftId, NFT>(async (nftIds: NftId[]) => {
      const collections = await this.getMany({ nftIds });
      const collectionsById = keyBy(collections, (g) => g._id);
      return assertAllExisting(
        NFT.name,
        nftIds,
        nftIds.map((CollectionId) => collectionsById[CollectionId]),
      );
    });
  }

  async increaseViewCount(nftId: NftId): Promise<void> {
    await this.model.findOneAndUpdate({ _id: nftId }, { $inc: { viewCount: 1 } }).exec();
  }

  async validateIdsExist(nftIds: NftId[]): Promise<NftId[]> {
    const nfts = await this.getMany({ nftIds });
    const nftPerId = keyBy(nfts, (g) => g._id);
    const missing = nftIds.filter((id) => !nftPerId[id]);
    if (missing.length > 0) {
      throw new BadInputError(
        `NFT with id ${missing.map((id) => `"${id}"`).join(', ')} does not exist`,
      );
    }
    return nftIds;
  }

  async updateAsset(nftId: NftId, thumbnail: string): Promise<void> {
    await this.model.findOneAndUpdate({ _id: nftId }, { $set: { thumbnail } }).exec();
  }
}

export interface NftFilter {
  nftIds?: NftId[];
  creatorIds?: UserId[];
  ownerIds?: UserId[];
}

const filterToMongoFilter = (filter: NftFilter): FilterQuery<NFT> => {
  const { nftIds, creatorIds, ownerIds } = filter;
  const query: FilterQuery<NFT> = {};
  if (nftIds) {
    query._id = { $in: nftIds };
  }
  if (creatorIds) {
    query.creatorId = { $in: creatorIds };
  }
  if (ownerIds) {
    query.ownerId = { $in: ownerIds };
  }
  return query;
};
