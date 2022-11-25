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
