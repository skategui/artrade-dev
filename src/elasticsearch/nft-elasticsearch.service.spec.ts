import EsMock from '@elastic/elasticsearch-mock';
import {
  BulkResponse,
  IndicesCreateResponse,
  IndicesDeleteResponse,
  IndicesRefreshResponse,
  QueryDslQueryContainer,
  SearchResponse,
  WriteResponseBase,
} from '@elastic/elasticsearch/lib/api/types';
import { ElasticsearchModule as EsModule, ElasticsearchService } from '@nestjs/elasticsearch';
import { Test, TestingModule } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { range } from 'lodash';
import { Long } from 'mongodb';
import { AppLogger } from '../logging/logging.service';
import { NftSaleKind } from '../nft/nft-sale';
import { Nft } from '../nft/nft.model';
import { NftService } from '../nft/nft.service';
import { NftHistoryService } from '../nfthistory/nft-history.service';
import { mongoDocMock } from '../test/helpers/mongo-doc-mock';
import { SilentLogger } from '../test/helpers/silent-logger.service';
import { UserService } from '../user/user.service';
import { esModule as realEsModule } from './elasticsearch.module';
import {
  getElasticsearchNftSearchQuery,
  NftElasticsearchService,
} from './nft-elasticsearch.service';

const esMock = new EsMock();
const mockEsModule = EsModule.register({
  node: 'http://fake-node',
  Connection: esMock.getConnection(),
});

// const useEsMock = false; // Use to test with real ES.
const useEsMock = true; // Use to test with mock ES.

describe('NftElasticsearchService', () => {
  let service: NftElasticsearchService;
  let testingModule: TestingModule;
  const nftServiceMock = mock<NftService>();
  const nftHistoryServiceMock = mock<NftHistoryService>();
  const userServiceMock = mock<UserService>();
  beforeAll(async () => {
    testingModule = await Test.createTestingModule({
      imports: [useEsMock ? mockEsModule : realEsModule],
      providers: [
        {
          provide: AppLogger,
          useClass: useEsMock ? SilentLogger : AppLogger,
        },
      ],
    }).compile();
    service = new NftElasticsearchService(
      await testingModule.resolve(AppLogger),
      nftServiceMock,
      testingModule.get(ElasticsearchService),
      nftHistoryServiceMock,
      userServiceMock,
    );
  });

  const generateNft = (): Nft =>
    mongoDocMock<Nft>({
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
    });
  const mockCreateIndex = () => {
    esMock.add(
      {
        method: 'PUT',
        path: `/${service.esIndexName}`,
      },
      (): IndicesCreateResponse => ({
        acknowledged: true,
        shards_acknowledged: true,
        index: 'artrade_nfts',
      }),
    );
  };
  const mockDeleteIndex = () => {
    esMock.add(
      {
        method: 'DELETE',
        path: `/${service.esIndexName}`,
      },
      (): IndicesDeleteResponse => ({
        acknowledged: true,
      }),
    );
  };
  const mockRefreshIndex = () => {
    esMock.add(
      {
        method: 'GET',
        path: `/${service.esIndexName}/_refresh`,
      },
      (): IndicesRefreshResponse => ({
        _shards: { total: 2, successful: 1, failed: 0 },
      }),
    );
  };

  describe('createIndex', () => {
    it('should create an artrade_nfts index', async () => {
      mockCreateIndex();
      expect(await service.createIndex()).toMatchObject({
        acknowledged: true,
        shards_acknowledged: true,
        index: 'artrade_nfts',
      });
    });
  });

  describe('indexNftDoc', () => {
    it('should index an NFT document', async () => {
      const nft = generateNft();
      esMock.add(
        {
          method: 'PUT',
          path: `/${service.esIndexName}/_doc/${nft._id}`,
        },
        (): WriteResponseBase => ({
          _index: 'artrade_nfts',
          _id: nft._id,
          _version: 1,
          result: 'created',
          _shards: { total: 2, successful: 1, failed: 0 },
          _seq_no: 1,
          _primary_term: 1,
        }),
      );

      expect(
        await service.indexNftDoc({
          nft,
          bookmarkedByUserIds: [],
          recentBuyerIds: [],
          viewerIds: [],
        }),
      ).toMatchObject({
        _id: nft._id,
      });
    });
  });

  describe('deleteAndReindexAll', () => {
    it('should delete and reindex all NFT document', async () => {
      nftServiceMock.count.mockResolvedValue(50);
      mockCreateIndex();
      mockDeleteIndex();
      mockRefreshIndex();
      esMock.add(
        {
          method: 'POST',
          path: `/_bulk`,
        },
        (): BulkResponse => ({
          took: 12,
          errors: false,
          items: [
            /* items */
          ],
        }),
      );

      nftServiceMock.getMany.mockImplementation(async (filter, pagination) =>
        pagination!.skip === 0 ? range(pagination!.limit!).map(() => generateNft()) : [],
      );
      nftHistoryServiceMock.getMany.mockResolvedValue([]);
      userServiceMock.getMany.mockResolvedValue([]);
      await service.deleteAndReindexAll();
      expect(nftServiceMock.getMany).toBeCalled();
    });
  });

  describe('get', () => {
    it('should make a paginated search query', async () => {
      const nfts = range(3).map(() => generateNft());
      const nftIds = nfts.map((nft) => nft._id);
      nftServiceMock.getMany.mockResolvedValue(nfts);
      esMock.add(
        { method: 'POST', path: `/${service.esIndexName}/_search` },
        (): SearchResponse => ({
          took: 10,
          timed_out: false,
          _shards: {} as any,
          hits: { hits: nftIds.map((nftId) => ({ _index: service.esIndexName, _id: nftId })) },
        }),
      );
      const foundNfts = await service.get({}, { skip: 100, limit: 50 });
      expect(foundNfts).toEqual(
        expect.arrayContaining(nftIds.map((nftId) => expect.objectContaining({ _id: nftId }))),
      );
      expect(nftServiceMock.getMany).toBeCalledWith({ ids: nftIds });
    });
  });

  describe('getElasticsearchNftSearchQuery', () => {
    const tests: [
      Parameters<typeof getElasticsearchNftSearchQuery>,
      QueryDslQueryContainer | undefined,
    ][] = [
      [[{}, {}], { bool: { filter: [{ match_all: {} }], minimum_should_match: 0 } }],
      [
        [{ saleKinds: [NftSaleKind.Auction] }, {}],
        {
          bool: {
            filter: [{ bool: { must: [{ terms: { saleKind: [NftSaleKind.Auction] } }] } }],
            minimum_should_match: 0,
          },
        },
      ],
      [
        [{ titleOrDescription: 'hello there' }, {}],
        {
          bool: {
            must: [
              {
                bool: {
                  should: [
                    {
                      bool: {
                        should: { match: { titleNgram: { query: 'hello there' } } },
                        boost: 1,
                      },
                    },
                    { bool: { should: { match: { descriptionNgram: { query: 'hello there' } } } } },
                  ],
                },
              },
            ],
            minimum_should_match: 0,
          },
        },
      ],
      [
        [
          {
            titleOrDescription: 'hello there',
            saleKinds: [NftSaleKind.Auction, NftSaleKind.FixedPrice],
            maxPrice: new Long(100),
            minPrice: new Long(10),
            requiredTagIds: ['tag1', 'tag2', 'tag3'],
            recentBuyerIds: ['user1', 'user2'],
            bookmarkedByUserIds: ['user3', 'user4'],
            viewerIds: ['user5', 'user6'],
            favoredTagIds: ['tag5', 'tag6', 'tag7'],
            creatorIds: ['user5', 'user6'],
            collectionIds: ['collection1', 'collection2'],
          },
        ],
        {
          bool: {
            filter: [
              {
                bool: {
                  must: [
                    { terms: { saleKind: [NftSaleKind.Auction, NftSaleKind.FixedPrice] } },
                    { range: { price: { gte: '10', lte: '100' } } },
                    { term: { tagIds: 'tag1' } },
                    { term: { tagIds: 'tag2' } },
                    { term: { tagIds: 'tag3' } },
                  ],
                },
              },
            ],
            must: [
              {
                bool: {
                  should: [
                    {
                      bool: {
                        should: { match: { titleNgram: { query: 'hello there' } } },
                        boost: 1,
                      },
                    },
                    { bool: { should: { match: { descriptionNgram: { query: 'hello there' } } } } },
                  ],
                },
              },
            ],
            should: [
              {
                bool: {
                  should: [
                    { term: { recentBuyerIds: 'user1' } },
                    { term: { recentBuyerIds: 'user2' } },
                  ],
                  boost: 0.1,
                },
              },
              {
                bool: {
                  should: [
                    { term: { bookmarkedByUserIds: 'user3' } },
                    { term: { bookmarkedByUserIds: 'user4' } },
                  ],
                  boost: 0.08,
                },
              },
              { term: { viewerIds: 'user5' } },
              { term: { viewerIds: 'user6' } },
              { term: { tagIds: 'tag5' } },
              { term: { tagIds: 'tag6' } },
              { term: { tagIds: 'tag7' } },
              { term: { creatorId: 'user5' } },
              { term: { creatorId: 'user6' } },
              { term: { collectionId: 'collection1' } },
              { term: { collectionId: 'collection2' } },
            ],
            minimum_should_match: 0,
          },
        },
      ],
    ];
    it('should provide expected output', () => {
      for (const [args, expectedOutput] of tests) {
        // console.log('expectedOutput', JSON.stringify(expectedOutput));
        expect(getElasticsearchNftSearchQuery(...args).function_score?.query).toEqual(
          expectedOutput,
        );
      }
    });
  });
});
