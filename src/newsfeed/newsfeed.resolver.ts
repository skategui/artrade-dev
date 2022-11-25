import { Args, Query, Resolver } from '@nestjs/graphql';
import { OptionalCurrentUserId } from '../auth/decorators/current-user-id.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { AppLogger } from '../logging/logging.service';
import { Nft } from '../nft/nft.model';
import { UserId } from '../user/model/user.model';
import { NewsfeedQueryArgs } from './dto/newsfeed.input';
import { NewsfeedOutput } from './dto/newsfeed.output';
import { NftFeedFilter } from './dto/nft-feed.args';
import { NewsfeedService } from './newsfeed.service';

@Resolver()
export class NewsfeedResolver {
  constructor(private logger: AppLogger, private newsfeedService: NewsfeedService) {
    this.logger.setContext(this.constructor.name);
  }

  /* ================= QUERY =============== */
  @Public()
  @Query(() => NewsfeedOutput)
  async newsfeed(@Args() { filter, page }: NewsfeedQueryArgs): Promise<NewsfeedOutput> {
    this.logger.verbose('newsfeed');
    return {
      items: await this.newsfeedService.get(filter, page),
    };
  }

  @Public()
  @Query(() => [Nft])
  async nftFeed(
    @Args({ type: () => NftFeedFilter, nullable: true }) filter: NftFeedFilter = {},
    @Args('page', { nullable: true, type: () => Number }) pageIndex = 0,
    @OptionalCurrentUserId() userId?: UserId,
  ): Promise<Nft[]> {
    return await this.newsfeedService.getNftFeed(
      { ...filter, fitPreferencesOfUserId: userId },
      pageIndex,
    );
  }
}
