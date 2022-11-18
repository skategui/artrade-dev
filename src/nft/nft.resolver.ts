import { Args, Context, Mutation, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { UserId } from 'aws-sdk/clients/appstream';
import { CurrentUserId } from '../auth/decorators/current-user-id.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/role.decorator';
import { Role } from '../auth/types';
import { CollectionNFT } from '../collections/collection.model';
import { CollectionService } from '../collections/collection.service';
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
import { CreateNFTAuctionInput } from './dto/create-nft-auction-input.dto';
import { CreateNFTFixedPriceInput } from './dto/create-nft-fixed-price-input.dto';
import { CreateNFTOfferInput } from './dto/create-nft-offer-input.dto';
import { ListNftQueryArgs } from './dto/list-nft-input.dto';
import { NftSaleKind, NftStatus } from './nft-sale';
import { NFT } from './nft.model';
import { NftService } from './nft.service';

@Resolver(() => NFT)
export class NftResolver {
  constructor(
    private logger: AppLogger,
    private nftService: NftService,
    private tagService: TagService,
    private userService: UserService,
    private collectionService: CollectionService,
  ) {
    this.logger.setContext(this.constructor.name);
  }

  /* ================= QUERY =============== */
  @Public()
  @Query(() => [NFT])
  async nfts(@Args() { filter, ...pagination }: ListNftQueryArgs): Promise<NFT[]> {
    this.logger.verbose('nfts');
    return await this.nftService.getMany(
      filter,
      graphqlToMongoPagination(pagination, { defaultLimit: 10, maxLimit: 50 }),
    );
  }

  /* ================= MUTATION =============== */
  @Roles(Role.User)
  @Mutation(() => NFT)
  async createFixedPriceNFT(
    @Args('form') input: CreateNFTFixedPriceInput,
    @CurrentUserId() currentUserId: UserId,
  ): Promise<NFT> {
    this.logger.verbose('createFixedPriceNFT');
    return await this.nftService.createFixedPriceNFT(input, currentUserId);
  }

  @Roles(Role.User)
  @Mutation(() => NFT)
  async createAuctionNFT(
    @Args('form') input: CreateNFTAuctionInput,
    @CurrentUserId() currentUserId: UserId,
  ): Promise<NFT> {
    this.logger.verbose('createAuctionNFT');
    return await this.nftService.createAuctionNFT(input, currentUserId);
  }

  @Roles(Role.User)
  @Mutation(() => NFT)
  async createOfferNFT(
    @Args('form') input: CreateNFTOfferInput,
    @CurrentUserId() currentUserId: UserId,
  ): Promise<NFT> {
    this.logger.verbose('createOfferNFT');
    return await this.nftService.createOfferNFT(input, currentUserId);
  }

  /* ================= RESOLVE FIELD =============== */

  @ResolveField(() => [Tag])
  async tags(@Parent() nft: NFT, @Context() context: object): Promise<Tag[]> {
    const dataloader = getOrCreateDataloader(
      context,
      DataLoaderContextKey.TagById,
      this.tagService.createDataloaderById(),
    );
    return assertNoneIsError(await dataloader.loadMany(nft.tagIds));
  }

  @ResolveField(() => NftStatus)
  status(@Parent() nft: NFT): NftStatus {
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
  async creator(@Parent() nft: NFT, @Context() context: object): Promise<User | null> {
    const dataloader = getOrCreateDataloader(
      context,
      DataLoaderContextKey.UserById,
      this.userService.createDataloaderById(),
    );
    return await dataloader.load(nft.creatorId);
  }

  @ResolveField(() => User)
  async owner(@Parent() nft: NFT, @Context() context: object): Promise<User | null> {
    if (!nft.ownerId) return null;
    const dataloader = getOrCreateDataloader(
      context,
      DataLoaderContextKey.UserById,
      this.userService.createDataloaderById(),
    );
    return await dataloader.load(nft.ownerId);
  }

  @ResolveField(() => CollectionNFT)
  async collection(@Parent() nft: NFT, @Context() context: object): Promise<CollectionNFT | null> {
    const dataloader = getOrCreateDataloader(
      context,
      DataLoaderContextKey.CollectionById,
      this.collectionService.createDataloaderById(),
    );
    return await dataloader.load(nft.collectionId);
  }
}
