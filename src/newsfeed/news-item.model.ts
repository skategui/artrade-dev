import { Field, InterfaceType, ObjectType, registerEnumType } from '@nestjs/graphql';
import { NftCollection } from '../collections/nft-collection.model';
import { Nft } from '../nft/nft.model';
import { User } from '../user/model/user.model';

export enum NewsItemKind {
  Profile = 'Profile',
  Collection = 'Collection',
  Nft = 'Nft',
}

registerEnumType(NewsItemKind, { name: 'NewsItemKind' });

const resolveType = (value: NewsItem) => {
  switch (value.kind) {
    case NewsItemKind.Profile:
      return ProfileNewsItem;
    case NewsItemKind.Collection:
      return CollectionNewsItem;
    case NewsItemKind.Nft:
      return NftNewsItem;
    default:
      throw Error(`Unknown NewsItemKind ${value.kind}`);
  }
};

@InterfaceType({ resolveType })
export abstract class NewsItem {
  @Field(() => NewsItemKind)
  kind: NewsItemKind;
}

@ObjectType({ implements: NewsItem })
export class ProfileNewsItem extends NewsItem {
  kind = NewsItemKind.Profile as const;

  @Field(() => User)
  profile: User;
}

@ObjectType({ implements: NewsItem })
export class CollectionNewsItem extends NewsItem {
  kind = NewsItemKind.Collection as const;

  @Field(() => NftCollection)
  collection: NftCollection;
}

@ObjectType({ implements: NewsItem })
export class NftNewsItem extends NewsItem {
  kind = NewsItemKind.Nft as const;

  @Field(() => Nft)
  nft: Nft;
}
