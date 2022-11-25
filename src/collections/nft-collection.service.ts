import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectModel } from '@nestjs/mongoose';
import DataLoader from 'dataloader';
import { keyBy } from 'lodash';
import { FilterQuery, Model } from 'mongoose';
import { BadInputError } from '../helpers/errors/BadInputError';
import { assertAllExisting } from '../helpers/get-or-create-dataloader';
import { MongoPagination, paginateQuery } from '../helpers/pagination/pagination';
import { AppLogger } from '../logging/logging.service';
import { TagId } from '../tag/tag.model';
import { TagService } from '../tag/tag.service';
import { UserId } from '../user/model/user.model';
import { FetchNftCollectionImageBlockchainEvent } from './nft-collection-metadata-event';
import { NftCollection, NftCollectionId } from './nft-collection.model';

export interface CreateCollection {
  mintAddress: string;
  tagIds: TagId[];
  title: string;
  description: string;
  creatorId: UserId;
  thumbnail: string;
}

@Injectable()
export class NftCollectionService {
  constructor(
    private logger: AppLogger,
    @InjectModel(NftCollection.name) private model: Model<NftCollection>,
    private readonly tagService: TagService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.logger.setContext(this.constructor.name);
  }

  async create(input: CreateCollection): Promise<NftCollection> {
    const doc = (
      await this.model.create({
        ...input,
        ...(input.tagIds ? { tagIds: await this.tagService.validateIdsExist(input.tagIds) } : {}),
      })
    ).toObject();

    // will run async task to get the data from the solana blockchain
    const payload: FetchNftCollectionImageBlockchainEvent = {
      collectionId: doc._id,
      mintAddress: doc.mintAddress,
    };
    this.eventEmitter.emit(FetchNftCollectionImageBlockchainEvent.symbol, payload);
    return doc;
  }

  async getMany(
    filter?: NftCollectionFilter,
    pagination?: MongoPagination<NftCollection>,
  ): Promise<NftCollection[]> {
    this.logger.verbose('getMany');
    const mongoFilter = nftCollectionFilterToMongoFilter(filter || {});
    const query = this.model.find(mongoFilter);
    const docs = await paginateQuery<NftCollection>(query, pagination).lean().exec();
    return docs;
  }

  async exists(CollectionIds: NftCollectionId[]): Promise<boolean> {
    const result = await this.model.count({ _id: { $in: CollectionIds } });
    return result === CollectionIds.length;
  }

  createDataloaderById(): DataLoader<NftCollectionId, NftCollection> {
    return new DataLoader<NftCollectionId, NftCollection>(
      async (CollectionIds: NftCollectionId[]) => {
        const collections = await this.getMany({ ids: CollectionIds });
        const collectionsById = keyBy(collections, (g) => g._id);
        return assertAllExisting(
          NftCollection.name,
          CollectionIds,
          CollectionIds.map((CollectionId) => collectionsById[CollectionId]),
        );
      },
    );
  }

  async validateIdsExist(CollectionIds: NftCollectionId[]): Promise<NftCollectionId[]> {
    const collections = await this.getMany({ ids: CollectionIds });
    const collectionPerId = keyBy(collections, (g) => g._id);
    const missing = CollectionIds.filter((id) => !collectionPerId[id]);
    if (missing.length > 0) {
      throw new BadInputError(
        `Collection with id ${missing.map((id) => `"${id}"`).join(', ')} does not exist`,
      );
    }
    return CollectionIds;
  }

  async updateThumbnail(collectionId: NftCollectionId, thumbnail: string): Promise<void> {
    await this.model.findOneAndUpdate({ _id: collectionId }, { $set: { thumbnail } }).exec();
  }
}

export interface NftCollectionFilter {
  ids?: NftCollectionId[];
  creatorIds?: UserId[];
}

export const nftCollectionFilterToMongoFilter = (
  filter: NftCollectionFilter,
): FilterQuery<NftCollection> => {
  const { ids, creatorIds } = filter;
  const query: FilterQuery<NftCollection> = {};
  if (ids) {
    query._id = { $in: ids };
  }
  if (creatorIds) {
    query.creatorId = { $in: creatorIds };
  }
  return query;
};
