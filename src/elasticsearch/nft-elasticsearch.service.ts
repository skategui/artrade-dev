import {
  BulkResponse,
  IndicesCreateRequest,
  IndicesCreateResponse,
  QueryDslBoolQuery,
  QueryDslFunctionScoreQuery,
  QueryDslQueryContainer,
  WriteResponseBase,
} from '@elastic/elasticsearch/lib/api/types';
import { Injectable, Optional } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { OnEvent } from '@nestjs/event-emitter';
import { chain, keyBy, some } from 'lodash';
import { NftCollectionId } from '../collections/nft-collection.model';
import { BatchJobLogger } from '../helpers/batch-job-logger';
import { AppLogger } from '../logging/logging.service';
import { NftCreatedEvent } from '../nft/events/nft-created.event';
import { NftSale, NftSaleKind } from '../nft/nft-sale';
import { LamportAmount, Nft, NftId } from '../nft/nft.model';
import { NftFilter, NftService } from '../nft/nft.service';
import { NftHistoryRecordKind } from '../nfthistory/model/nft-history-record.model';
import { NftHistoryService } from '../nfthistory/nft-history.service';
import { TagId } from '../tag/tag.model';
import { UserId } from '../user/model/user.model';
import { UserService } from '../user/user.service';
import {
  clampDate,
  DateClampPolicy,
  ElasticsearchSearchPagination,
  SearchQueryOptions,
} from './helpers';

const ES_NFT_DEFAULT_INDEX_NAME = 'artrade_nfts';

@Injectable()
export class NftElasticsearchService {
  constructor(
    private logger: AppLogger,
    private readonly nftService: NftService,
    private readonly elasticsearchService: ElasticsearchService,
    private readonly nftHistoryService: NftHistoryService,
    private readonly userService: UserService,
    @Optional() // The index name can be overridden for testing purpose
    public readonly esIndexName = ES_NFT_DEFAULT_INDEX_NAME,
  ) {
    this.logger.setContext(this.constructor.name);
  }

  async get(
    args: NftEsGetArgs = {},
    { skip, limit, ...options }: ElasticsearchSearchPagination & SearchQueryOptions = {},
  ): Promise<Nft[]> {
    // console.log('get filter', filter);
    // console.log('get boostCriteria', boostCriteria);
    // console.log('get limit', limit);
    const query = getElasticsearchNftSearchQuery(args, options);
    // console.log('query', JSON.stringify(query, null, 2));
    const searchRequest = {
      index: this.esIndexName,
      query,
      from: skip,
      size: limit,
      _source_includes: ['_id'],
    };
    // console.log('searchRequest', JSON.stringify(searchRequest, null, 2));
    const esQueryRes = await this.elasticsearchService.search(searchRequest);
    if (options.printScores) {
      for (const hit of esQueryRes.hits.hits) {
        this.logger.log(`HIT id: ${hit._id}\t${hit._score}`);
      }
    }
    const nftIds = esQueryRes.hits.hits.map((hit) => hit._id);
    const nfts = await this.nftService.getMany({ ids: nftIds });
    const nftsById = keyBy(nfts, (nft) => nft._id);
    return chain(nftIds)
      .map((id) => nftsById[id])
      .compact() // Ignore potential NFTs which do not exist anymore.
      .value();
  }

  async createIndex(): Promise<IndicesCreateResponse> {
    return await this.elasticsearchService.indices.create(this.getIndexSettings());
  }

  async indexNftDoc(payload: NftIndexPayload): Promise<WriteResponseBase> {
    return await this.elasticsearchService.index({
      index: this.esIndexName,
      id: payload.nft._id,
      document: getDocumentMapping(payload),
    });
  }

  async bulkIndexNftDocs(payloads: NftIndexPayload[]): Promise<BulkResponse> {
    return await this.elasticsearchService.bulk({
      operations: payloads.flatMap((payload) => [
        {
          index: {
            _index: this.esIndexName,
            _id: payload.nft._id,
          },
        },
        getDocumentMapping(payload),
      ]),
    });
  }

  async deleteAndReindexAll(): Promise<void> {
    // TODO use a proper queue https://docs.nestjs.com/techniques/queues
    // TODO For now we just iterate over all NFTs.
    await this.deleteIndex();
    await this.createIndex();
    const nftFilter: NftFilter = {};
    const batchSize = 50;
    const totalCount = await this.nftService.count(nftFilter);
    const batchJobLogger = new BatchJobLogger(
      'Reindexing NFTs',
      totalCount,
      this.logger.log.bind(this.logger),
    );
    batchJobLogger.logInitial();
    const errors = [];
    for (let batchIndex = 0; ; batchIndex++) {
      const nfts = await this.nftService.getMany(nftFilter, {
        skip: batchIndex * batchSize,
        limit: batchSize,
        sort: { updatedAt: 1 },
      });
      if (nfts.length === 0) {
        break;
      }
      const payloads = await this.createBulkIndexPayloads(nfts);
      // console.log('payloads', payloads);
      const res = await this.bulkIndexNftDocs(payloads);
      if (res.errors) {
        errors.push(...res.items.map((item) => item.index).filter((i) => i?.status !== 201));
      }
      batchJobLogger.logBatch(nfts.length);
    }
    await this.refreshIndex();
    batchJobLogger.logFinal();
    if (errors.length > 0) {
      throw Error(`Some NFT documents failed to index: ${JSON.stringify(errors, null, 2)}`);
    }
  }

  private async createBulkIndexPayloads(nfts: Nft[]): Promise<NftIndexPayload[]> {
    const nftIds = nfts.map((n) => n._id);
    const nftBoughtRecords = await this.nftHistoryService.getMany({
      nftIds,
      kinds: [NftHistoryRecordKind.Sold],
    });
    const nftBoughtRecordsByNftId: Record<NftId, UserId[]> = chain(nftBoughtRecords)
      .groupBy((r) => r.nftId)
      .mapValues((g) =>
        chain(g)
          .orderBy((r) => r.createdAt, 'desc')
          .take(5) // Only take the 5 last buyers for each NFT
          .map((r) => r.buyerId)
          .value(),
      )
      .value();
    const usersWhoBookmarkedNfts = await this.userService.getMany({ bookmarkedNftIds: nftIds });
    const usersWhoBookmarkedNftsByNftId = chain(usersWhoBookmarkedNfts)
      .flatMap((u) => u.bookmarks.map((b) => b.nftId))
      .uniq()
      .transform<Record<NftId, UserId[]>>((acc, nftId) => {
        acc[nftId] = usersWhoBookmarkedNfts
          .filter((u) => some(u.bookmarks, (b) => b.nftId === nftId))
          .map((u) => u._id);
      }, {})
      .value();
    return nfts.map((nft) => ({
      nft,
      recentBuyerIds: nftBoughtRecordsByNftId[nft._id] || [],
      bookmarkedByUserIds: usersWhoBookmarkedNftsByNftId[nft._id] || [],
      viewerIds: [], // TODO Adapt this code when we have the data
    }));
  }

  async deleteIndex(): Promise<void> {
    await this.elasticsearchService.indices.delete({
      index: this.esIndexName,
      ignore_unavailable: true,
    });
  }

  // If you need the data available immediately, you can trigger a refresh.
  // It is usually not necessary, as ES periodically refreshes automatically.
  async refreshIndex(): Promise<void> {
    await this.elasticsearchService.indices.refresh({
      index: this.esIndexName,
    });
  }

  @OnEvent(NftCreatedEvent.symbol)
  async handleNftCreatedEvent(nft: Nft): Promise<void> {
    await this.indexNftDoc({
      nft,
      recentBuyerIds: nft.ownerId ? [nft.ownerId] : [], // TODO ownerId really optional?
      bookmarkedByUserIds: [
        /* NFT was just created, nobody bookmarked it yet */
      ],
      viewerIds: [
        /* NFT was just created, nobody viewed it yet */
      ],
    });
  }

  private getIndexSettings(): IndicesCreateRequest {
    return {
      index: this.esIndexName,
      settings: {
        // https://medium.com/inspiredbrilliance/a-guide-to-perform-fulltext-search-in-elasticsearch-273a2f10d20e
        'index.max_ngram_diff': 5,
        analysis: {
          analyzer: {
            ngram_analyzer: {
              type: 'custom',
              tokenizer: 'ngram_tokenizer',
              filter: ['lowercase', 'asciifolding'],
            },
          },
          tokenizer: {
            ngram_tokenizer: {
              type: 'ngram',
              min_gram: 3,
              max_gram: 5,
              token_chars: ['letter', 'digit'],
            },
          },
        },
      },
      mappings: {
        properties: {
          titleNgram: { type: 'text', analyzer: 'ngram_analyzer' },
          descriptionNgram: { type: 'text', analyzer: 'ngram_analyzer' },
          creatorId: { type: 'keyword' },
          ownerId: { type: 'keyword' },
          recentBuyerIds: { type: 'keyword' },
          bookmarkedByUserIds: { type: 'keyword' },
          viewerIds: { type: 'keyword' },
          collectionId: { type: 'keyword' },
          saleKind: { type: 'keyword' },
          createdAt: { type: 'date' },
          updatedAt: { type: 'date' },
          price: { type: 'double' },
          tagIds: { type: 'keyword' },
        },
      },
    };
  }
}

const getNftPrice = (sale: NftSale): LamportAmount | null => {
  switch (sale.kind) {
    case NftSaleKind.Auction:
      return sale.highestBid || sale.startingPrice;
    case NftSaleKind.FixedPrice:
      return sale.price;
    case NftSaleKind.OpenToOffer:
      return null;
  }
};

const getDocumentMapping = (payload: NftIndexPayload): Record<string, unknown> => {
  const { nft, recentBuyerIds, bookmarkedByUserIds, viewerIds } = payload;
  return {
    titleNgram: nft.title,
    descriptionNgram: nft.description,
    creatorId: nft.creatorId,
    ownerId: nft.ownerId,
    recentBuyerIds,
    bookmarkedByUserIds,
    viewerIds,
    collectionId: nft.collectionId,
    saleKind: nft.sale.kind,
    createdAt: nft.createdAt,
    updatedAt: nft.updatedAt,
    price: getNftPrice(nft.sale)?.toString(),
    tagIds: nft.tagIds,
  };
};

export const getElasticsearchNftSearchQuery = (
  args: NftEsGetArgs,
  { recencyScoreBoostDateClampPolicy, recencyScoreBoostDate }: SearchQueryOptions = {},
): QueryDslQueryContainer => {
  const should = getEsQueryShould(args);
  // console.log('should', JSON.stringify(should, null, 2));
  const must = getEsQueryMust(args);
  // console.log('must', JSON.stringify(must, null, 2));
  const filter = getEsQueryFilter(args);
  // console.log('filter', JSON.stringify(filter, null, 2));
  const bool: QueryDslBoolQuery = {
    filter:
      filter.length > 0
        ? filter
        : must.length > 0
        ? // There is a `must` clause, so it should be sufficient to give some score to docs.
          undefined
        : // There is no `must`, so we still need to match all docs instead of none.
          [{ match_all: {} }],
    ...(should.length > 0 ? { should } : {}),
    ...(must.length > 0 ? { must } : {}),
  };
  // console.log('bool', JSON.stringify(bool, null, 2));
  const query: QueryDslQueryContainer = {
    function_score: {
      ...getFunctionScore(
        clampDate(
          recencyScoreBoostDate || new Date(),
          recencyScoreBoostDateClampPolicy || DateClampPolicy.TruncateToHour,
        ),
      ),
      query: { bool: { ...bool, minimum_should_match: 0 } },
    },
  };
  // console.log('query', JSON.stringify(query, null, 2));
  return query;
};

const getEsQueryFilter = ({
  saleKinds,
  maxPrice,
  minPrice,
  requiredTagIds,
}: NftEsFilterArgs): QueryDslQueryContainer[] => {
  const mustList: QueryDslQueryContainer[] = [];
  const filters: QueryDslQueryContainer[] = [];
  if (saleKinds) {
    mustList.push({ terms: { saleKind: saleKinds } });
  }
  if (maxPrice || minPrice) {
    mustList.push({
      range: {
        price: {
          ...(minPrice ? { gte: minPrice.toString() } : {}),
          ...(maxPrice ? { lte: maxPrice.toString() } : {}),
        },
      },
    });
  }
  if (requiredTagIds) {
    mustList.push(...requiredTagIds.map((tagId) => ({ term: { tagIds: tagId } })));
  }
  if (mustList.length > 0) {
    filters.push({ bool: { must: mustList } });
  }
  return filters;
};

const getEsQueryMust = ({ titleOrDescription }: NftEsMustArgs): QueryDslQueryContainer[] => {
  const mustList: QueryDslQueryContainer[] = [];
  if (titleOrDescription) {
    mustList.push({
      bool: {
        should: [
          {
            bool: {
              should: {
                match: { titleNgram: { query: titleOrDescription } },
              },
              boost: 1,
            },
          },
          { bool: { should: { match: { descriptionNgram: { query: titleOrDescription } } } } },
        ],
      },
    });
  }
  return mustList;
};

const getEsQueryShould = ({
  recentBuyerIds,
  bookmarkedByUserIds,
  viewerIds,
  favoredTagIds: tagIds,
  creatorIds,
  collectionIds,
}: NftEsShouldArgs): QueryDslQueryContainer[] => {
  const shouldList: QueryDslQueryContainer[] = [];
  // TODO Boost bought > bookmarked > viewed
  if (recentBuyerIds) {
    shouldList.push({
      bool: {
        should: recentBuyerIds.map(
          (userId): QueryDslQueryContainer => ({ term: { recentBuyerIds: userId } }),
        ),
        boost: 0.1,
      },
    });
  }
  if (bookmarkedByUserIds) {
    shouldList.push({
      bool: {
        should: bookmarkedByUserIds.map(
          (userId): QueryDslQueryContainer => ({ term: { bookmarkedByUserIds: userId } }),
        ),
        boost: 0.08,
      },
    });
  }
  if (viewerIds) {
    shouldList.push(
      ...viewerIds.map((userId): QueryDslQueryContainer => ({ term: { viewerIds: userId } })),
    );
  }
  if (tagIds) {
    shouldList.push(
      ...tagIds.map((tagId): QueryDslQueryContainer => ({ term: { tagIds: tagId } })),
    );
  }
  if (creatorIds) {
    shouldList.push(
      ...creatorIds.map((userId): QueryDslQueryContainer => ({ term: { creatorId: userId } })),
    );
  }
  if (collectionIds) {
    shouldList.push(
      ...collectionIds.map(
        (userId): QueryDslQueryContainer => ({ term: { collectionId: userId } }),
      ),
    );
  }
  return shouldList;
};

const getFunctionScore = (creationDate: Date): QueryDslFunctionScoreQuery => {
  // https://stackoverflow.com/a/43779461/1541141
  return {
    score_mode: 'sum', // All functions outputs get summed
    boost_mode: 'multiply', // The documents relevance is multiplied with the sum
    functions: [
      {
        weight: 1.0, // The relevancy of all posts is multiplied by at least one.
      },
      {
        weight: 0.5, // Published this month get a boost
        gauss: { createdAt: { origin: creationDate.toISOString(), scale: '31d', decay: 0.5 } },
      },
      {
        weight: 0.25, // Published this year get a boost
        gauss: { createdAt: { origin: creationDate.toISOString(), scale: '356d', decay: 0.5 } },
      },
    ],
  };
};

interface NftEsFilterArgs {
  saleKinds?: NftSaleKind[];
  maxPrice?: LamportAmount;
  minPrice?: LamportAmount;
  requiredTagIds?: TagId[];
}

interface NftEsMustArgs {
  titleOrDescription?: string;
}

interface NftEsShouldArgs {
  recentBuyerIds?: UserId[];
  bookmarkedByUserIds?: UserId[];
  viewerIds?: UserId[];
  favoredTagIds?: TagId[];
  creatorIds?: UserId[];
  collectionIds?: NftCollectionId[];
}

type NftEsGetArgs = NftEsFilterArgs & NftEsMustArgs & NftEsShouldArgs;

type NftEsFieldSourceFields = Pick<
  Nft,
  | '_id'
  | 'tagIds'
  | 'creatorId'
  | 'title'
  | 'description'
  | 'ownerId'
  | 'collectionId'
  | 'sale'
  | 'createdAt'
  | 'updatedAt'
>;

type NftIndexPayload = {
  nft: NftEsFieldSourceFields;
  recentBuyerIds: UserId[];
  bookmarkedByUserIds: UserId[];
  viewerIds: UserId[];
};
