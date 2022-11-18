import { CollectionId } from './collection.model';

export class FetchCollectionImageBlockchainEvent {
  static symbol = Symbol(FetchCollectionImageBlockchainEvent.name);
  collectionId: CollectionId;
  mintAddress: string;
}
