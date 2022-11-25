import { NftId } from '../nft.model';

export class FetchNftImageBlockchainEvent {
  static symbol = Symbol(FetchNftImageBlockchainEvent.name);
  nftId: NftId;
  mintAddress: string;
}
