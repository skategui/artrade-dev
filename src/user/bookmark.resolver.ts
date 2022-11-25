import { Context, Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { DataLoaderContextKey, getOrCreateDataloader } from '../helpers/get-or-create-dataloader';
import { AppLogger } from '../logging/logging.service';
import { Nft } from '../nft/nft.model';
import { NftService } from '../nft/nft.service';
import { Bookmark } from './model/bookmark.model';
import { UserService } from './user.service';

@Resolver(() => Bookmark)
export class BookmarkResolver {
  constructor(
    private logger: AppLogger,
    private userService: UserService,
    private nftService: NftService,
  ) {
    this.logger.setContext(this.constructor.name);
  }

  @ResolveField(() => Nft)
  async nft(@Parent() bookmark: Bookmark, @Context() context: object): Promise<Nft> {
    const dataloader = getOrCreateDataloader(
      context,
      DataLoaderContextKey.NftById,
      this.nftService.createDataloaderById(),
    );
    return await dataloader.load(bookmark.nftId);
  }
}
