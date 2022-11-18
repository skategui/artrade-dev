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
import { FetchCollectionImageBlockchainEvent } from './collection-metadata-event';
import { CollectionId, CollectionNFT } from './collection.model';
import { CreateCollectionInput } from './dto/create-collection-input.dto';

@Injectable()
export class CollectionService {
  constructor(
    private logger: AppLogger,
    @InjectModel(CollectionNFT.name) private model: Model<CollectionNFT>,
    private readonly tagService: TagService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.logger.setContext(this.constructor.name);
  }

  async create(input: CreateCollectionInput, userId: UserId): Promise<CollectionNFT> {
    const doc = (
      await this.model.create({
        ...input,
        ...(input.tagIds ? { tagIds: await this.tagService.validateIdsExist(input.tagIds) } : {}),
        creatorId: userId,
        thumbnail: undefined,
      })
    ).toObject();

    // will run async task to get the data from the solana blockchain
    const payload: FetchCollectionImageBlockchainEvent = {
      collectionId: doc._id,
      mintAddress: doc.mintAddress,
    };
    this.eventEmitter.emit(FetchCollectionImageBlockchainEvent.symbol, payload);
    return doc;
  }

  async getMany(
    filter?: CollectionFilter,
    pagination?: MongoPagination<CollectionNFT>,
  ): Promise<CollectionNFT[]> {
    this.logger.verbose('getMany');
    const mongoFilter = filterToMongoFilter(filter || {});
    const query = this.model.find(mongoFilter);
    const docs = await paginateQuery<CollectionNFT>(query, pagination).lean().exec();
    return docs;
  }

  async exists(CollectionIds: CollectionId[]): Promise<boolean> {
    const result = await this.model.count({ _id: { $in: CollectionIds } });
    return result === CollectionIds.length;
  }
  createDataloaderById(): DataLoader<CollectionId, CollectionNFT> {
    return new DataLoader<CollectionId, CollectionNFT>(async (CollectionIds: CollectionId[]) => {
      const collections = await this.getMany({ ids: CollectionIds });
      const collectionsById = keyBy(collections, (g) => g._id);
      return assertAllExisting(
        CollectionNFT.name,
        CollectionIds,
        CollectionIds.map((CollectionId) => collectionsById[CollectionId]),
      );
    });
  }

  async validateIdsExist(CollectionIds: CollectionId[]): Promise<CollectionId[]> {
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

  async updateThumbnail(collectionId: CollectionId, thumbnail: string): Promise<void> {
    await this.model.findOneAndUpdate({ _id: collectionId }, { $set: { thumbnail } }).exec();
  }
}

export interface CollectionFilter {
  ids?: CollectionId[];
  authors?: UserId[];
}

const filterToMongoFilter = (filter: CollectionFilter): FilterQuery<CollectionNFT> => {
  const { ids, authors } = filter;
  const query: FilterQuery<CollectionNFT> = {};
  if (ids) {
    query._id = { $in: ids };
  }
  if (authors) {
    query.author = { $in: authors };
  }
  return query;
};
