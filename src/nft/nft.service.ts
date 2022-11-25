import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectModel } from '@nestjs/mongoose';
import DataLoader from 'dataloader';
import { keyBy } from 'lodash';
import { Condition, FilterQuery, Model } from 'mongoose';
import { enforceType } from '../helpers/enforce-type';
import { BadInputError } from '../helpers/errors/BadInputError';
import { assertAllExisting } from '../helpers/get-or-create-dataloader';
import { MongoPagination, paginateQuery } from '../helpers/pagination/pagination';
import { AppLogger } from '../logging/logging.service';
import { NftCreatedEvent, NftPriceUpdatedEvent } from '../nfthistory/nft-history.event';
import { TagId } from '../tag/tag.model';
import { TagService } from '../tag/tag.service';
import { UserId } from '../user/model/user.model';
import { CreateCommonNftInput } from './dto/create-common-nft-input.dto';
import { CreateNftAuctionInput } from './dto/create-nft-auction-input.dto';
import { CreateNftFixedPriceInput } from './dto/create-nft-fixed-price-input.dto';
import { CreateNftOfferInput } from './dto/create-nft-offer-input.dto';
import { FetchNftImageBlockchainEvent } from './events/fetch-nft-image-blockchain.event';
import {
  BaseNftSale,
  NftAuctionSale,
  NftFixedPriceSale,
  NftOpenToOfferSale,
  NftSaleKind,
} from './nft-sale';
import { LamportAmount, Nft, NftId } from './nft.model';

export interface CreateNftFixedPrice {
  input: CreateNftFixedPriceInput;
  userId: UserId;
}

export interface CreateNftAuction {
  input: CreateNftAuctionInput;
  userId: UserId;
}

export interface CreateNftOffer {
  input: CreateNftOfferInput;
  userId: UserId;
}

@Injectable()
export class NftService {
  constructor(
    private logger: AppLogger,
    @InjectModel(Nft.name) private model: Model<Nft>,
    private readonly tagService: TagService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.logger.setContext(this.constructor.name);
  }

  async getById(id: NftId): Promise<Nft | null> {
    return await this.model.findOne({ _id: id }).lean().exec();
  }

  async getByIdOrThrow(id: NftId): Promise<Nft> {
    const doc = await this.getById(id);
    if (!doc) {
      throw Error(`NFT not found with id ${id}`);
    }
    return doc;
  }

  async createFixedPriceNft(content: CreateNftFixedPrice): Promise<Nft> {
    const sale: NftFixedPriceSale = {
      kind: NftSaleKind.FixedPrice,
      price: content.input.price,
    };
    return await this.create(content.input, content.userId, sale);
  }

  async createAuctionNft(content: CreateNftAuction): Promise<Nft> {
    const sale: NftAuctionSale = {
      startingPrice: content.input.startingPrice,
      startDate: content.input.startDate,
      endDate: content.input.endDate,
      kind: NftSaleKind.Auction,
      bids: [],
    };
    return await this.create(content.input, content.userId, sale);
  }

  async createOfferNft(content: CreateNftOffer): Promise<Nft> {
    const sale: NftOpenToOfferSale = {
      kind: NftSaleKind.OpenToOffer,
      offers: [],
    };
    return await this.create(content.input, content.userId, sale);
  }

  private async create(
    input: CreateCommonNftInput,
    userId: UserId,
    sale: BaseNftSale,
  ): Promise<Nft> {
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
    const payload: FetchNftImageBlockchainEvent = {
      nftId: doc._id,
      mintAddress: doc.mintAddress,
    };
    this.eventEmitter.emit(FetchNftImageBlockchainEvent.symbol, payload);
    this.eventEmitter.emit(NftCreatedEvent.symbol, enforceType<NftCreatedEvent>({ nft: doc }));
    return doc;
  }

  async getMany(filter?: NftFilter, pagination?: MongoPagination<Nft>): Promise<Nft[]> {
    this.logger.verbose('getMany');
    const mongoFilter = nftFilterToMongoFilter(filter || {});
    const query = this.model.find(mongoFilter);
    const docs = await paginateQuery<Nft>(query, pagination).lean().exec();
    return docs;
  }

  async count(filter?: NftFilter): Promise<number> {
    const mongoFilter = nftFilterToMongoFilter(filter || {});
    return await this.model.count(mongoFilter);
  }

  async exists(CollectionIds: NftId[]): Promise<boolean> {
    const result = await this.model.count({ _id: { $in: CollectionIds } });
    return result === CollectionIds.length;
  }

  createDataloaderById(): DataLoader<NftId, Nft> {
    return new DataLoader<NftId, Nft>(async (nftIds: NftId[]) => {
      const collections = await this.getMany({ ids: nftIds });
      const collectionsById = keyBy(collections, (g) => g._id);
      return assertAllExisting(
        Nft.name,
        nftIds,
        nftIds.map((CollectionId) => collectionsById[CollectionId]),
      );
    });
  }

  async increaseViewCount(nftId: NftId): Promise<void> {
    await this.model.findOneAndUpdate({ _id: nftId }, { $inc: { viewCount: 1 } }).exec();
  }

  async validateIdsExist(nftIds: NftId[]): Promise<NftId[]> {
    const nfts = await this.getMany({ ids: nftIds });
    const nftPerId = keyBy(nfts, (g) => g._id);
    const missing = nftIds.filter((id) => !nftPerId[id]);
    if (missing.length > 0) {
      throw new BadInputError(
        `NFT with id ${missing.map((id) => `"${id}"`).join(', ')} does not exist`,
      );
    }
    return nftIds;
  }

  async updateThumbnail(nftId: NftId, thumbnail: string): Promise<void> {
    await this.model.findOneAndUpdate({ _id: nftId }, { $set: { thumbnail } }).exec();
  }

  async updateNftFixedPrice(nftId: NftId, price: number): Promise<Nft> {
    const nft = await this.model
      .findOneAndUpdate(
        { _id: nftId, 'sale.kind': NftSaleKind.FixedPrice },
        { $set: { 'sale.price': price } },
        { new: true },
      )
      .exec();

    if (!nft)
      throw new NotFoundException(`NFT with id \"${nftId}\" with fixed price does not exist`);

    // Add update price activity
    this.eventEmitter.emit(NftPriceUpdatedEvent.symbol, {
      nftId,
      price,
      ownerId: nft.ownerId ?? nft.creatorId,
    });

    return nft;
  }
}

export interface NftFilter {
  ids?: NftId[];
  creatorIds?: UserId[];
  ownerIds?: UserId[];
  saleKinds?: NftSaleKind[];
  tagIds?: TagId[];
  minPrice?: LamportAmount;
  maxPrice?: LamportAmount;
}

export const nftFilterToMongoFilter = (filter: NftFilter): FilterQuery<Nft> => {
  const { ids, creatorIds, ownerIds, saleKinds, tagIds, minPrice, maxPrice } = filter;
  const query: FilterQuery<Nft> = {};
  const andList: Condition<Nft>[] = [];
  if (ids) {
    query._id = { $in: ids };
  }
  if (creatorIds) {
    query.creatorId = { $in: creatorIds };
  }
  if (ownerIds) {
    query.ownerId = { $in: ownerIds };
  }
  if (saleKinds) {
    query['sale.kind'] = { $in: saleKinds };
  }
  if (tagIds) {
    query.tagIds = { $in: tagIds };
  }
  if (minPrice || maxPrice) {
    const condition = {
      ...(minPrice ? { $lte: minPrice } : {}),
      ...(maxPrice ? { $gte: maxPrice } : {}),
    };
    andList.push({
      $or: [
        {
          'sale.kind': NftSaleKind.Auction,
          'sale.startingPriceInSol': condition,
        },
        {
          'sale.kind': NftSaleKind.FixedPrice,
          'sale.priceInSol': condition,
        },
        {
          'sale.kind': NftSaleKind.OpenToOffer,
          'sale.offers': { $last: condition },
        },
      ],
    });
  }
  if (andList.length > 0) {
    query.$and = andList;
  }
  return query;
};
