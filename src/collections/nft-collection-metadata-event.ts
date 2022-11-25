import { NftCollectionId } from './nft-collection.model';

export class FetchNftCollectionImageBlockchainEvent {
  static symbol = Symbol(FetchNftCollectionImageBlockchainEvent.name);
  collectionId: NftCollectionId;
  mintAddress: string;
}
