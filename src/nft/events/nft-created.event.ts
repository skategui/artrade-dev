import { Nft } from '../nft.model';

export class NftCreatedEvent {
  static symbol = Symbol(NftCreatedEvent.name);
  nft: Nft;
}
