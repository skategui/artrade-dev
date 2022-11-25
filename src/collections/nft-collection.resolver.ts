import { Args, Context, Mutation, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { CurrentUserId } from '../auth/decorators/current-user-id.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/role.decorator';
import { Role } from '../auth/types';
import {
  assertNoneIsError,
  DataLoaderContextKey,
  getOrCreateDataloader,
} from '../helpers/get-or-create-dataloader';
import { graphqlToMongoPagination } from '../helpers/pagination/pagination-args.graphql';
import { AppLogger } from '../logging/logging.service';
import { Tag } from '../tag/tag.model';
import { TagService } from '../tag/tag.service';
import { User, UserId } from '../user/model/user.model';
import { UserService } from '../user/user.service';
import { CreateCollectionInput } from './dto/create-collection-input.dto';
import { ListCollectionQueryArgs } from './dto/list-collections-input.dto';
import { NftCollection } from './nft-collection.model';
import { NftCollectionService } from './nft-collection.service';

@Resolver(() => NftCollection)
export class NftCollectionResolver {
  constructor(
    private logger: AppLogger,
    private collectionService: NftCollectionService,
    private userService: UserService,
    private tagService: TagService,
  ) {
    this.logger.setContext(this.constructor.name);
  }

  /* ================= QUERY =============== */
  @Public()
  @Query(() => [NftCollection])
  async collections(
    @Args() { filter, ...pagination }: ListCollectionQueryArgs,
  ): Promise<NftCollection[]> {
    this.logger.verbose('collections');
    return await this.collectionService.getMany(
      filter,
      graphqlToMongoPagination(pagination, { defaultLimit: 10, maxLimit: 50 }),
    );
  }

  /* ================= MUTATION =============== */
  @Roles(Role.User)
  @Mutation(() => NftCollection)
  async createCollection(
    @Args() input: CreateCollectionInput,
    @CurrentUserId() creatorId: UserId,
  ): Promise<NftCollection> {
    this.logger.verbose('createCollection');
    return await this.collectionService.create({ ...input, creatorId });
  }

  /* ================= RESOLVE FIELD =============== */

  @ResolveField(() => [Tag])
  async tags(@Parent() collection: NftCollection, @Context() context: object): Promise<Tag[]> {
    const dataloader = getOrCreateDataloader(
      context,
      DataLoaderContextKey.TagById,
      this.tagService.createDataloaderById(),
    );
    return assertNoneIsError(await dataloader.loadMany(collection.tagIds));
  }

  @ResolveField(() => User)
  async creator(
    @Parent() collection: NftCollection,
    @Context() context: object,
  ): Promise<User | null> {
    const dataloader = getOrCreateDataloader(
      context,
      DataLoaderContextKey.UserById,
      this.userService.createDataloaderById(),
    );
    return await dataloader.load(collection.creatorId);
  }
}
