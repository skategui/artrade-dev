import { NftSale } from '../nft/nft-sale';
import { Nft, NftId } from '../nft/nft.model';
import { UserId } from '../user/model/user.model';

export class NftCreatedEvent {
  static symbol = Symbol(NftCreatedEvent.name);
  nft: Nft;
}

export class NftPriceUpdatedEvent {
  static symbol = Symbol(NftPriceUpdatedEvent.name);

  nftId: NftId;
  price: number;
  ownerId: UserId;
}

// TODO Emit this event when an NFT sale is changed
export class NftPriceSaleChangedEvent {
  static symbol = Symbol(NftPriceSaleChangedEvent.name);
  nftId: NftId;
  sale: NftSale;
}

// TODO Emit this event when an NFT is sold
export class NftSoldEvent {
  static symbol = Symbol(NftSoldEvent.name);
  nftId: NftId;
  newOwnerId: UserId;
}

// TODO Emit this event when an NFT is bookmarked
export class NftBookmarkedEvent {
  static symbol = Symbol(NftBookmarkedEvent.name);
  nftId: NftId;
  userId: UserId;
}

// TODO Emit this event when an NFT is unbookmarked
export class NftUnbookmarkedEvent {
  static symbol = Symbol(NftUnbookmarkedEvent.name);
  nftId: NftId;
  userId: UserId;
}
