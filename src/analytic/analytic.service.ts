import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { AppLogger } from '../logging/logging.service';
import { NftId } from '../nft/nft.model';
import { NftService } from '../nft/nft.service';
import { UserId } from '../user/model/user.model';
import { Analytic } from './analytic.model';
import { PushEventInputDto } from './dto/push-event-input.dto';
import { ListEventsPossible } from './types';

export interface AnalyticsVisitorCountFilter {
  eventKeys?: ListEventsPossible[];
  nftIds?: NftId[];
  fromDate?: Date;
  toDate?: Date;
}

@Injectable()
export class AnalyticService {
  constructor(
    private logger: AppLogger,
    @InjectModel(Analytic.name) private model: Model<Analytic>,
    private readonly nftService: NftService,
  ) {
    this.logger.setContext(this.constructor.name);
  }

  async create(input: PushEventInputDto, userId?: UserId): Promise<Analytic> {
    if (input.key === ListEventsPossible.NftScreenShown && input.nftId) {
      this.nftService.increaseViewCount(input.nftId!);
    }
    return (await this.model.create({ ...input, userId })).toObject();
  }

  async getVisitorCount(filter: AnalyticsVisitorCountFilter): Promise<number> {
    const mongoFilter = visitorCountFilterToMongoFilter(filter);
    return await this.model.count(mongoFilter).exec();
  }
}

const visitorCountFilterToMongoFilter = ({
  eventKeys,
  nftIds,
  fromDate,
  toDate,
}: AnalyticsVisitorCountFilter): FilterQuery<Analytic> => {
  return {
    ...(eventKeys ? { key: { $in: eventKeys } } : {}),
    ...(nftIds ? { nftId: { $in: nftIds } } : {}),
    ...(fromDate ? { createdAt: { $gte: fromDate } } : {}),
    ...(toDate ? { createdAt: { $lte: toDate } } : {}),
  };
};
