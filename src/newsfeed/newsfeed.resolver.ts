import { Args, Query, Resolver } from '@nestjs/graphql';
import { Public } from '../auth/decorators/public.decorator';
import { AppLogger } from '../logging/logging.service';
import { NewsfeedQueryArgs } from './dto/newsfeed.input';
import { NewsfeedOutput } from './dto/newsfeed.output';
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
}
