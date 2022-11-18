import { Args, Context, Mutation, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { UserId } from 'aws-sdk/clients/appstream';
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
import { User } from '../user/model/user.model';
import { UserService } from '../user/user.service';
import { CollectionNFT } from './collection.model';
import { CollectionService } from './collection.service';
import { CreateCollectionInput } from './dto/create-collection-input.dto';
import { ListCollectionQueryArgs } from './dto/list-collections-input.dto';

@Resolver(() => CollectionNFT)
export class CollectionResolver {
  constructor(
    private logger: AppLogger,
    private collectionService: CollectionService,
    private userService: UserService,
    private tagService: TagService,
  ) {
    this.logger.setContext(this.constructor.name);
  }

  /* ================= QUERY =============== */
  @Public()
  @Query(() => [CollectionNFT])
  async collections(
    @Args() { filter, ...pagination }: ListCollectionQueryArgs,
  ): Promise<CollectionNFT[]> {
    this.logger.verbose('collections');
    return await this.collectionService.getMany(
      filter,
      graphqlToMongoPagination(pagination, { defaultLimit: 10, maxLimit: 50 }),
    );
  }

  /* ================= MUTATION =============== */
  @Roles(Role.User)
  @Mutation(() => CollectionNFT)
  async createCollection(
    @Args() input: CreateCollectionInput,
    @CurrentUserId() userId: UserId,
  ): Promise<CollectionNFT> {
    this.logger.verbose('createCollection');
    return await this.collectionService.create(input, userId);
  }

  /* ================= RESOLVE FIELD =============== */

  @ResolveField(() => [Tag])
  async tags(@Parent() collection: CollectionNFT, @Context() context: object): Promise<Tag[]> {
    const dataloader = getOrCreateDataloader(
      context,
      DataLoaderContextKey.TagById,
      this.tagService.createDataloaderById(),
    );
    return assertNoneIsError(await dataloader.loadMany(collection.tagIds));
  }

  @ResolveField(() => User)
  async creator(
    @Parent() collection: CollectionNFT,
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
