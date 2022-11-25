import { Context, Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { DataLoaderContextKey, getOrCreateDataloader } from '../helpers/get-or-create-dataloader';
import { AppLogger } from '../logging/logging.service';
import { User } from '../user/model/user.model';
import { UserService } from '../user/user.service';
import { NftTypeOfSaleUpdatedHistoryRecord } from './model/nft-history-record.model';
import { NftHistoryService } from './nft-history.service';

@Resolver(() => NftTypeOfSaleUpdatedHistoryRecord)
export class NftTypeOfSaleUpdatedHistoryRecordResolver {
  constructor(
    private logger: AppLogger,
    private historyService: NftHistoryService,
    private userService: UserService,
  ) {
    this.logger.setContext(this.constructor.name);
  }

  /* ==================== RESOLVE FIELD ==================== */
  @ResolveField(() => User)
  async owner(
    @Parent() record: NftTypeOfSaleUpdatedHistoryRecord,
    @Context() context: object,
  ): Promise<User> {
    const dataloader = getOrCreateDataloader(
      context,
      DataLoaderContextKey.UserById,
      this.userService.createDataloaderById(),
    );
    return await dataloader.load(record.ownerId);
  }
}
