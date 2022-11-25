import { Test, TestingModule } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { range } from 'lodash';
import { Long } from 'mongodb';
import { NftCollection } from '../collections/nft-collection.model';
import { NftCollectionService } from '../collections/nft-collection.service';
import { NftElasticsearchService } from '../elasticsearch/nft-elasticsearch.service';
import { NftSaleKind } from '../nft/nft-sale';
import { Nft } from '../nft/nft.model';
import { NftService } from '../nft/nft.service';
import { NftHistoryService } from '../nfthistory/nft-history.service';
import { nftDocMock, nftHistoryRecordDocMock, userDocMock } from '../test/entity-mocks';
import { mongoDocMock } from '../test/helpers/mongo-doc-mock';
import { SilentLogger } from '../test/helpers/silent-logger.service';
import { User } from '../user/model/user.model';
import { UserService } from '../user/user.service';
import { NewsItemKind } from './news-item.model';
import { NewsfeedService } from './newsfeed.service';

describe('NewsfeedService', () => {
  let service: NewsfeedService;
  let testingModule: TestingModule;
  const nftServiceMock = mock<NftService>();
  const collectionServiceMock = mock<NftCollectionService>();
  const userServiceMock = mock<UserService>();
  const nftElasticsearchServiceMock = mock<NftElasticsearchService>();
  const nftHistoryServiceMock = mock<NftHistoryService>();

  beforeAll(async () => {
    testingModule = await Test.createTestingModule({
      providers: [SilentLogger],
    }).compile();
    service = new NewsfeedService(
      testingModule.get(SilentLogger),
      nftServiceMock,
      collectionServiceMock,
      userServiceMock,
      nftElasticsearchServiceMock,
      nftHistoryServiceMock,
    );
  });

  describe('get', () => {
    it('should get page', async () => {
      userServiceMock.getMany.mockResolvedValue(
        range(4).map((i) => mongoDocMock<User>({ email: `user${i}` } as User)),
      );
      nftServiceMock.getMany.mockResolvedValue(
        range(10).map((i) => mongoDocMock<Nft>({ title: `nft${i}` } as Nft)),
      );
      collectionServiceMock.getMany.mockResolvedValue(
        range(6).map((i) => mongoDocMock<NftCollection>({ title: `coll${i}` } as NftCollection)),
      );
      const items = await service.get(undefined, 0);
      expect(items).toHaveLength(20);
      expect(items).toEqual(
        expect.arrayContaining([
          ...range(4).map((i) =>
            expect.objectContaining({
              kind: NewsItemKind.Profile,
              profile: expect.objectContaining({ email: `user${i}` }),
            }),
          ),
          ...range(10).map((i) =>
            expect.objectContaining({
              kind: NewsItemKind.Nft,
              nft: expect.objectContaining({ title: `nft${i}` }),
            }),
          ),
          ...range(6).map((i) =>
            expect.objectContaining({
              kind: NewsItemKind.Collection,
              collection: expect.objectContaining({ title: `coll${i}` }),
            }),
          ),
        ]),
      );
    });
  });

  describe('getNftFeed', () => {
    it('returns correct result', async () => {
      nftElasticsearchServiceMock.get.mockResolvedValue([]);
      userServiceMock.getByIdOrThrow.mockResolvedValue(
        userDocMock({
          _id: 'thisUser',
          bookmarks: [{ nftId: 'bookmarkedNft1', addedAt: new Date() }],
        }),
      );
      userServiceMock.getMany.mockResolvedValue([
        userDocMock({ _id: 'followedUser1' }),
        userDocMock({ _id: 'followedUser2' }),
      ]);
      nftHistoryServiceMock.getMany.mockResolvedValue([
        nftHistoryRecordDocMock({ nftId: 'nftBoughtInPast1', buyerId: 'thisUser' }),
      ]);
      nftServiceMock.getMany.mockResolvedValue([
        nftDocMock({
          _id: 'bookmarkedNft1',
          tagIds: ['tag3', 'tag4'],
          creatorId: 'creator1',
          collectionId: 'collection1',
        }),
        nftDocMock({
          _id: 'nftBoughtInPast2',
          tagIds: ['tag4', 'tag5'],
          creatorId: 'creator2',
          collectionId: 'collection2',
        }),
      ]);
      await service.getNftFeed(
        {
          titleOrDescription: 'foobar',
          saleKinds: [NftSaleKind.Auction, NftSaleKind.FixedPrice],
          maxPrice: new Long(1000),
          minPrice: new Long(100),
          tagIds: ['tag1', 'tag2'],
          fitPreferencesOfUserId: 'user1',
        },
        2,
      );
      expect(nftElasticsearchServiceMock.get).toBeCalledWith(
        {
          titleOrDescription: 'foobar',
          saleKinds: [NftSaleKind.Auction, NftSaleKind.FixedPrice],
          maxPrice: new Long(1000),
          minPrice: new Long(100),
          requiredTagIds: ['tag1', 'tag2'],
          recentBuyerIds: ['followedUser1', 'followedUser2'],
          bookmarkedByUserIds: ['followedUser1', 'followedUser2'],
          viewerIds: ['followedUser1', 'followedUser2'],
          favoredTagIds: ['tag3', 'tag4', 'tag5'],
          creatorIds: ['creator1', 'creator2'],
          collectionIds: ['collection1', 'collection2'],
        },
        {
          skip: 40,
          limit: 20,
        },
      );
    });
  });
});
