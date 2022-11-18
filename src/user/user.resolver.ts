import {
  Args,
  Context,
  Int,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { UserInputError } from 'apollo-server-express';
import { setAsAuthorizedDocument } from '../auth/authz/rule-builders/can-read-authorized-documents';
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
import { NFT, NftId } from '../nft/nft.model';
import { NftService } from '../nft/nft.service';
import { Tag } from '../tag/tag.model';
import { TagService } from '../tag/tag.service';
import { CreateUserInput } from './dto/create-user-input.dto';
import { InviteInput } from './dto/invite.input';
import { ListUserQueryArgs } from './dto/list-user-input.dto';
import { UpdateUserInputDto } from './dto/update-user-input.dto';
import { User, UserId } from './model/user.model';
import { UserService } from './user.service';

@Resolver(() => User)
export class UserResolver {
  constructor(
    private logger: AppLogger,
    private userService: UserService,
    private nftService: NftService,
    private tagService: TagService,
  ) {
    this.logger.setContext(this.constructor.name);
  }

  /* ================= QUERY =============== */
  @Roles(Role.User)
  @Query(() => User)
  async me(@CurrentUserId() id: UserId): Promise<User> {
    this.logger.verbose('me');
    const user = await this.userService.getById(id);
    if (!user) {
      throw new UserInputError('User does not exist');
    }
    return user;
  }

  @Public()
  @Query(() => [User])
  async users(@Args() { filter, ...pagination }: ListUserQueryArgs): Promise<User[]> {
    this.logger.verbose('users');
    const user = await this.userService.getMany(
      filter,
      graphqlToMongoPagination(pagination, { defaultLimit: 10, maxLimit: 50 }),
    );
    return user;
  }

  /* ================= MUTATION =============== */
  @Public()
  @Mutation(() => User)
  async signup(@Args() input: CreateUserInput, @Context() context: object): Promise<User> {
    this.logger.verbose('createUser');
    const newUser = await this.userService.create(input);
    setAsAuthorizedDocument(newUser._id, context);
    return newUser;
  }

  @Roles(Role.User)
  @Mutation(() => User)
  async updateMe(
    @Args() input: UpdateUserInputDto,
    @CurrentUserId() id: UserId,
  ): Promise<User | null> {
    this.logger.verbose('updateMe');
    return await this.userService.updateUser(id, input);
  }

  @Roles(Role.User)
  @Mutation(() => User, { nullable: true })
  async addWallet(
    @Args('walletId') walletId: string,
    @CurrentUserId() id: UserId,
  ): Promise<User | null> {
    this.logger.verbose('addWallet');
    return await this.userService.addWallet(id, walletId);
  }

  @Roles(Role.User)
  @Mutation(() => Boolean)
  async follow(
    @Args('creatorIdToFollow') creatorIdToFollow: UserId,
    @CurrentUserId() id: UserId,
  ): Promise<boolean> {
    this.logger.verbose('follow');
    await this.userService.follow(id, creatorIdToFollow);
    return true;
  }

  @Roles(Role.User)
  @Mutation(() => Boolean)
  async unfollow(
    @Args('creatorIdToUnfollow') creatorIdToUnfollow: UserId,
    @CurrentUserId() id: UserId,
  ): Promise<boolean> {
    this.logger.verbose('unfollow');
    await this.userService.unfollow(id, creatorIdToUnfollow);
    return true;
  }

  @Roles(Role.User)
  @Mutation(() => Boolean)
  async addToBookmark(
    @Args('nftId') nftId: NftId,
    @CurrentUserId() myId: UserId,
  ): Promise<boolean> {
    this.logger.verbose('addToBookmark');
    await this.userService.addToBookmark(nftId, myId);
    return true;
  }

  @Roles(Role.User)
  @Mutation(() => Boolean)
  async removeFromBookmark(
    @Args('nftId') nftId: NftId,
    @CurrentUserId() myId: UserId,
  ): Promise<boolean> {
    this.logger.verbose('removeFromBookmark');
    await this.userService.removeFromBookmark(nftId, myId);
    return true;
  }

  @Roles(Role.User)
  @Mutation(() => Boolean)
  async invite(@Args() input: InviteInput, @CurrentUserId() id: UserId): Promise<boolean> {
    this.logger.verbose('invite');
    await this.userService.invite(id, input.emails);
    return true;
  }

  @Roles(Role.User)
  @Mutation(() => Boolean)
  async verifyTwitter(@Args('url') url: string, @CurrentUserId() id: UserId): Promise<boolean> {
    this.logger.verbose('verifyTwitter');
    return await this.userService.verifyTwitter(id, url);
  }

  /* region ==================== RESOLVE FIELD ==================== */
  @ResolveField(() => Int)
  followersCount(@Parent() user: User): number {
    return user.followerIds.length;
  }

  @ResolveField(() => [User])
  async followers(@Parent() user: User, @Context() context: object): Promise<User[]> {
    const dataloader = getOrCreateDataloader(
      context,
      DataLoaderContextKey.UserById,
      this.userService.createDataloaderById(),
    );
    return assertNoneIsError(await dataloader.loadMany(user.followerIds));
  }

  @ResolveField(() => [NFT])
  async bookmarks(@Parent() user: User, @Context() context: object): Promise<NFT[]> {
    const dataloader = getOrCreateDataloader(
      context,
      DataLoaderContextKey.NftById,
      this.nftService.createDataloaderById(),
    );
    return assertNoneIsError(await dataloader.loadMany(user.bookmarkIds));
  }
  /* ================= Resolve fields =============== */
  @ResolveField(() => [Tag])
  async tags(@Parent() user: User, @Context() context: object): Promise<Tag[]> {
    const dataloader = getOrCreateDataloader(
      context,
      DataLoaderContextKey.TagById,
      this.tagService.createDataloaderById(),
    );
    return assertNoneIsError(await dataloader.loadMany(user.tagsId));
  }
}
