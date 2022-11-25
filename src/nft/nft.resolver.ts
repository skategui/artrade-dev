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
import { CurrentUserId } from '../auth/decorators/current-user-id.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/role.decorator';
import { Role } from '../auth/types';
import { NftCollection } from '../collections/nft-collection.model';
import { NftCollectionService } from '../collections/nft-collection.service';
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
import { CreateNftAuctionInput } from './dto/create-nft-auction-input.dto';
import { CreateNftFixedPriceInput } from './dto/create-nft-fixed-price-input.dto';
import { CreateNftOfferInput } from './dto/create-nft-offer-input.dto';
import { ListNftQueryArgs } from './dto/list-nft-input.dto';
import { NftSaleKind, NftStatus } from './nft-sale';
import { Nft, NftId } from './nft.model';
import { NftService } from './nft.service';

@Resolver(() => Nft)
export class NftResolver {
  constructor(
    private logger: AppLogger,
    private nftService: NftService,
    private tagService: TagService,
    private userService: UserService,
    private collectionService: NftCollectionService,
  ) {
    this.logger.setContext(this.constructor.name);
  }

  /* ================= QUERY =============== */
  @Public()
  @Query(() => [Nft])
  async nfts(@Args() { filter, ...pagination }: ListNftQueryArgs): Promise<Nft[]> {
    this.logger.verbose('nfts');
    return await this.nftService.getMany(
      filter,
      graphqlToMongoPagination(pagination, { defaultLimit: 10, maxLimit: 50 }),
    );
  }

  /* ================= MUTATION =============== */
  @Roles(Role.User)
  @Mutation(() => Nft)
  async createFixedPriceNft(
    @Args('form') input: CreateNftFixedPriceInput,
    @CurrentUserId() currentUserId: UserId,
  ): Promise<Nft> {
    this.logger.verbose('createFixedPriceNft');
    return await this.nftService.createFixedPriceNft({ input, userId: currentUserId });
  }

  @Roles(Role.User)
  @Mutation(() => Nft)
  async createAuctionNft(
    @Args('form') input: CreateNftAuctionInput,
    @CurrentUserId() currentUserId: UserId,
  ): Promise<Nft> {
    this.logger.verbose('createAuctionNft');
    return await this.nftService.createAuctionNft({ input, userId: currentUserId });
  }

  @Roles(Role.User)
  @Mutation(() => Nft)
  async createOfferNft(
    @Args('form') input: CreateNftOfferInput,
    @CurrentUserId() currentUserId: UserId,
  ): Promise<Nft> {
    this.logger.verbose('createOfferNft');
    return await this.nftService.createOfferNft({ input, userId: currentUserId });
  }

  @Roles(Role.User)
  @Mutation(() => Nft, { nullable: true })
  async updateNftFixedPrice(
    @Args('nftId') nftId: NftId,
    @Args({ name: 'price', type: () => Int }) price: number,
  ): Promise<Nft | null> {
    this.logger.verbose('updateNftFixedPrice');
    return await this.nftService.updateNftFixedPrice(nftId, price);
  }

  /* ================= RESOLVE FIELD =============== */

  @ResolveField(() => [Tag])
  async tags(@Parent() nft: Nft, @Context() context: object): Promise<Tag[]> {
    const dataloader = getOrCreateDataloader(
      context,
      DataLoaderContextKey.TagById,
      this.tagService.createDataloaderById(),
    );
    return assertNoneIsError(await dataloader.loadMany(nft.tagIds));
  }

  @ResolveField(() => NftStatus)
  status(@Parent() nft: Nft): NftStatus {
    switch (nft.sale.kind) {
      // auction
      case NftSaleKind.Auction: {
        const now = new Date();
        if (now < nft.sale.startDate) {
          return NftStatus.AuctionFuture;
        }
        if (now > nft.sale.endDate) {
          return NftStatus.AuctionPast;
        }
        return NftStatus.AuctionOnGoing;
      }
      // fixed price
      case NftSaleKind.FixedPrice:
        return NftStatus.FixedPrice;
      // open to offer
      case NftSaleKind.OpenToOffer:
        return nft.sale.offers.length == 0 ? NftStatus.OfferOpen : NftStatus.OfferActive;
    }
  }

  @ResolveField(() => User)
  async creator(@Parent() nft: Nft, @Context() context: object): Promise<User | null> {
    const dataloader = getOrCreateDataloader(
      context,
      DataLoaderContextKey.UserById,
      this.userService.createDataloaderById(),
    );
    return await dataloader.load(nft.creatorId);
  }

  @ResolveField(() => User)
  async owner(@Parent() nft: Nft, @Context() context: object): Promise<User | null> {
    if (!nft.ownerId) return null;
    const dataloader = getOrCreateDataloader(
      context,
      DataLoaderContextKey.UserById,
      this.userService.createDataloaderById(),
    );
    return await dataloader.load(nft.ownerId);
  }

  @ResolveField(() => NftCollection)
  async collection(@Parent() nft: Nft, @Context() context: object): Promise<NftCollection | null> {
    const dataloader = getOrCreateDataloader(
      context,
      DataLoaderContextKey.CollectionById,
      this.collectionService.createDataloaderById(),
    );
    return await dataloader.load(nft.collectionId);
  }
}
