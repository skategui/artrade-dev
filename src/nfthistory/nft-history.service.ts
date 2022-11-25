import { OnEvent } from '@nestjs/event-emitter';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { MongoPagination, paginateQuery } from '../helpers/pagination/pagination';
import { AppLogger } from '../logging/logging.service';
import { NftId } from '../nft/nft.model';
import { CreatePayload } from '../types/mongo-helpers';
import { UserId } from '../user/model/user.model';
import {
  BaseNftHistoryRecord,
  NftHistoryRecord,
  NftHistoryRecordKind,
  NftHistoryRecordKindToClass,
} from './model/nft-history-record.model';
import { NftCreatedEvent, NftPriceUpdatedEvent } from './nft-history.event';

export class NftHistoryService {
  constructor(
    private readonly logger: AppLogger,
    @InjectModel(BaseNftHistoryRecord.name) private model: Model<BaseNftHistoryRecord>,
  ) {
    this.logger.setContext(this.constructor.name);
  }

  async create<R extends BaseNftHistoryRecord>(
    input: CreatePayload<R>,
  ): Promise<BaseNftHistoryRecord> {
    this.logger.verbose(input);
    return (await this.model.create({ ...input })).toObject();
  }

  async getMany<F extends HistoryFilter | undefined>(
    filter?: F,
    pagination?: MongoPagination<BaseNftHistoryRecord>,
  ): Promise<NarrowFromFilter<F>[]> {
    this.logger.verbose('getMany');
    const mongoFilter = filterToMongoFilter(filter || {});
    const query = this.model.find(mongoFilter);
    const docs = await paginateQuery<BaseNftHistoryRecord>(query, pagination).lean().exec();
    return docs as NarrowFromFilter<F>[];
  }

  @OnEvent(NftCreatedEvent.symbol)
  async handleNftCreatedEvent(payload: NftCreatedEvent): Promise<void> {
    this.logger.verbose('handleNftCreatedEvent');
    await this.create({ nftId: payload.nft._id, kind: NftHistoryRecordKind.Created });
  }

  @OnEvent(NftPriceUpdatedEvent.symbol)
  async handleNftPriceUpdatedEvent(payload: NftPriceUpdatedEvent): Promise<void> {
    this.logger.verbose('handleNftPriceUpdatedEvent');
    await this.create({ ...payload, kind: NftHistoryRecordKind.PriceUpdated });
  }
}

export interface HistoryFilter {
  nftIds?: NftId[];
  buyerIds?: UserId[];
  kinds?: NftHistoryRecordKind[];
}

const filterToMongoFilter = (filter: HistoryFilter): FilterQuery<NftHistoryRecord> => {
  const { nftIds, kinds, buyerIds } = filter;
  const query: FilterQuery<NftHistoryRecord> = {};
  if (nftIds) {
    query.nftId = { $in: nftIds };
  }
  if (kinds) {
    query.kind = { $in: kinds };
  }
  if (buyerIds) {
    query.buyerId = { $in: buyerIds };
  }
  return query;
};

type NarrowFromFilter<F extends HistoryFilter | undefined> = F extends HistoryFilter
  ? F['kinds'] extends NftHistoryRecordKind[]
    ? NftHistoryRecordKindToClass<F['kinds'][number]>
    : NftHistoryRecord
  : NftHistoryRecord;
