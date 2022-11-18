import { NftId } from '../nft/nft.model';

export class FetchNFTImageBlockchainEvent {
  static symbol = Symbol(FetchNFTImageBlockchainEvent.name);
  nftId: NftId;
  mintAddress: string;
}
