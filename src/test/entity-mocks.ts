import { Long } from 'mongodb';
import { NftSaleKind } from '../nft/nft-sale';
import { Nft } from '../nft/nft.model';
import {
  NftHistoryRecord,
  NftHistoryRecordKind,
} from '../nfthistory/model/nft-history-record.model';
import { User } from '../user/model/user.model';
import { mongoDocMock } from './helpers/mongo-doc-mock';

/* Useful entity mocks */

export const nftDocMock = (partialNft: Partial<Nft>): Nft => {
  return mongoDocMock<Nft>({
    mintAddress: '123',
    tagIds: ['tag1', 'tag2'],
    creatorId: 'creatorId',
    title: 'title',
    description: 'description',
    thumbnail: 'thumb.jpg',
    collectionId: 'collectionId',
    license: 'license',
    numberOfEdition: 1,
    royalties: [],
    sale: {
      kind: NftSaleKind.FixedPrice,
      price: new Long('12300000000000000'),
    },
    viewCount: 34,
    ...partialNft,
  });
};

export const userDocMock = (partialUser: Partial<User>): User => {
  return mongoDocMock<User>({
    email: 'user@domain.com',
    nickname: 'nickname',
    lastName: 'lastName',
    firstName: 'firstName',
    password: 'password',
    twitterVerified: true,
    inviteFriends: [],
    isOnboarded: true,
    wallets: [],
    tagsId: [],
    followerIds: [],
    bookmarks: [],
    emailVerified: true,
    ...partialUser,
  });
};

export const nftHistoryRecordDocMock = (
  partialRecord: Partial<NftHistoryRecord>,
): NftHistoryRecord => {
  return mongoDocMock<NftHistoryRecord>({
    nftId: 'nftId',
    kind: NftHistoryRecordKind.Created,
    ...partialRecord,
  });
};
