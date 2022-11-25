import { Args, Query, Resolver } from '@nestjs/graphql';
import { Public } from '../auth/decorators/public.decorator';
import { graphqlToMongoPagination } from '../helpers/pagination/pagination-args.graphql';
import { AppLogger } from '../logging/logging.service';
import { HistoryQueryArgs } from './dto/history-query.args';
import { BaseNftHistoryRecord, NftHistoryRecord } from './model/nft-history-record.model';
import { NftHistoryService } from './nft-history.service';

@Resolver(() => BaseNftHistoryRecord)
export class NftHistoryResolver {
  constructor(private logger: AppLogger, private historyService: NftHistoryService) {
    this.logger.setContext(this.constructor.name);
  }

  /* ================= QUERY =============== */
  @Public()
  @Query(() => [BaseNftHistoryRecord])
  async nftHistory(
    @Args() { filter, ...pagination }: HistoryQueryArgs,
  ): Promise<NftHistoryRecord[]> {
    this.logger.verbose('nftHistory');
    return await this.historyService.getMany(
      filter,
      graphqlToMongoPagination(pagination, {
        defaultLimit: 10,
        maxLimit: 50,
      }),
    );
  }
}
