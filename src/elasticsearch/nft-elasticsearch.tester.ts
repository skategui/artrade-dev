/* eslint-disable require-await */
import { Injectable } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { chain, intersects, isEqual } from 'lodash';
import moment from 'moment';
import { AppLogger } from '../logging/logging.service';
import { Nft, NftId } from '../nft/nft.model';
import { NftService } from '../nft/nft.service';
import {
  NftHistoryRecord,
  NftHistoryRecordKind,
} from '../nfthistory/model/nft-history-record.model';
import { NftHistoryService } from '../nfthistory/nft-history.service';
import { nftDocMock, nftHistoryRecordDocMock, userDocMock } from '../test/entity-mocks';
import { User } from '../user/model/user.model';
import { UserService } from '../user/user.service';
import { NftElasticsearchService } from './nft-elasticsearch.service';

// This tester must be run by yourself from the GraphQL playground.
// You cannot use Jest for it, because it require a real ES instance.

// Motivation: While NftEsFilter is a binary filter which can be tested
// by comparing the expected ES api query, the NftEsBoostCriteria is far more tricky to test.
// NftEsBoostCriteria only softly adds score for matched criteria, and
// we want to make sure ES is not overpowering some criteria over others.
// This module provides regression tests to ensure that future score tweeking do not
// break spec invariants regarding the impact of each score booster on the expected result order.

const TEST_INDEX_NAME = 'artrade__tests__nfts';

const testDateMoment = moment();
const testDate = testDateMoment.toDate();
const testDateMinusNDays = (daysToSubtract: number): Date =>
  testDateMoment.clone().subtract(daysToSubtract, 'days').toDate();

@Injectable()
export class NftElasticsearchTester {
  private service: NftElasticsearchService;
  private nftServiceMock = {} as NftService;
  private nftHistoryServiceMock = {} as NftHistoryService;
  private userServiceMock = {} as UserService;

  constructor(
    private logger: AppLogger,
    private readonly elasticsearchService: ElasticsearchService,
  ) {
    this.logger.setContext(this.constructor.name);
    this.service = new NftElasticsearchService(
      this.logger,
      this.nftServiceMock,
      this.elasticsearchService,
      this.nftHistoryServiceMock,
      this.userServiceMock,
      TEST_INDEX_NAME,
    );
  }

  async runTests(): Promise<void> {
    await this.runNoDocTest();
    await this.runEmptyFilterTest();
    await this.runTitleOrDescriptionTest();
    await this.runDescriptionPriorityTest();
    await this.runRecentBuyerIdsPriorityTest();
    await this.runBookmarkedByUserIdsPriorityTest();
    await this.runRecentBuyerIdsBookmarkedByUserIdsPriorityTest();
    await this.runFavoriteTagsPriorityTest();
    await this.runCreatorPriorityTest();
    await this.runCollectionPriorityTest();
    this.logger.log('Test suite finished.');
  }

  private async runNoDocTest() {
    await this.runTest('no doc', {}, [], []);
  }

  private async runEmptyFilterTest() {
    await this.runTest(
      'createdAt desc default sorting',
      {
        nfts: [
          { _id: 'nft1', createdAt: testDateMinusNDays(3) },
          { _id: 'nft2', createdAt: testDateMinusNDays(1) },
          { _id: 'nft3', createdAt: testDateMinusNDays(2) },
        ],
      },
      [{}, { recencyScoreBoostDate: testDate }],
      ['nft2', 'nft3', 'nft1'],
    );
  }

  private async runTitleOrDescriptionTest() {
    await this.runTest(
      'title match is more important than description match, despite recency',
      {
        nfts: [
          { _id: 'nft1', title: 'coke', description: 'coke', createdAt: testDateMinusNDays(1) },
          { _id: 'nft2', title: 'coke', description: 'pepsi', createdAt: testDateMinusNDays(1) },
          { _id: 'nft3', title: 'sprite', description: 'coke', createdAt: testDateMinusNDays(2) },
          { _id: 'nft4', title: 'sprite', description: 'coke', createdAt: testDateMinusNDays(3) },
          { _id: 'nft5', title: 'sprite', description: 'fanta', createdAt: testDateMinusNDays(3) },
        ],
      },
      [{ titleOrDescription: 'coke' }, { recencyScoreBoostDate: testDate }],
      ['nft1', 'nft2', 'nft3', 'nft4'],
    );
  }

  private async runDescriptionPriorityTest() {
    await this.runTest(
      'description match prioritized over another criteria matches',
      {
        nfts: [
          { _id: 'nft1', description: 'papa ours', tagIds: ['tag1'] },
          { _id: 'nft2', description: 'papa ours', tagIds: ['tag2'] },
          { _id: 'nft3', description: 'papa chat', tagIds: ['tag1'] },
          { _id: 'nft4', description: 'papa chat', tagIds: ['tag2'] },
        ],
      },
      [{ titleOrDescription: 'papa ours', favoredTagIds: ['tag1'] }],
      ['nft1', 'nft2', 'nft3', 'nft4'],
    );
  }

  private async runRecentBuyerIdsPriorityTest() {
    await this.runTest(
      'recentBuyerIds > recency',
      {
        nfts: [
          { _id: 'nft1', createdAt: testDateMinusNDays(2) },
          { _id: 'nft2', createdAt: testDateMinusNDays(1) },
        ],
        nftHistoryRecords: [
          { kind: NftHistoryRecordKind.Sold, nftId: 'nft1', buyerId: 'followedUserId1' },
          { kind: NftHistoryRecordKind.Sold, nftId: 'nft2', buyerId: 'user2' },
        ],
      },
      [{ recentBuyerIds: ['followedUserId1'] }, { recencyScoreBoostDate: testDate }],
      ['nft1', 'nft2'],
    );
  }

  private async runBookmarkedByUserIdsPriorityTest() {
    await this.runTest(
      'bookmarkedByUserIds > recency',
      {
        nfts: [
          { _id: 'nft1', createdAt: testDateMinusNDays(2) },
          { _id: 'nft2', createdAt: testDateMinusNDays(1) },
        ],
        users: [{ _id: 'followedUserId1', bookmarks: [{ nftId: 'nft1', addedAt: new Date() }] }],
      },
      [{ bookmarkedByUserIds: ['followedUserId1'] }, { recencyScoreBoostDate: testDate }],
      ['nft1', 'nft2'],
    );
  }

  private async runRecentBuyerIdsBookmarkedByUserIdsPriorityTest() {
    await this.runTest(
      'recentBuyerIds > bookmarkedByUserIds',
      {
        nfts: [
          { _id: 'nft1', createdAt: testDateMinusNDays(2) },
          { _id: 'nft2', createdAt: testDateMinusNDays(1) },
        ],
        nftHistoryRecords: [
          { kind: NftHistoryRecordKind.Sold, nftId: 'nft1', buyerId: 'followedUserId1' },
        ],
        users: [{ _id: 'followedUserId1', bookmarks: [{ nftId: 'nft2', addedAt: new Date() }] }],
      },
      [
        { recentBuyerIds: ['followedUserId1'], bookmarkedByUserIds: ['followedUserId1'] },
        { recencyScoreBoostDate: testDate },
      ],
      ['nft1', 'nft2'],
    );
  }

  private async runFavoriteTagsPriorityTest() {
    await this.runTest(
      'favoredTagIds > recency',
      {
        nfts: [
          { _id: 'nft1', tagIds: ['tag1', 'tag2'], createdAt: testDateMinusNDays(2) },
          { _id: 'nft2', tagIds: ['tag3', 'tag4'], createdAt: testDateMinusNDays(1) },
        ],
      },
      [{ favoredTagIds: ['tag1'] }, { recencyScoreBoostDate: testDate }],
      ['nft1', 'nft2'],
    );
  }

  private async runCreatorPriorityTest() {
    await this.runTest(
      'creatorIds > recency',
      {
        nfts: [
          { _id: 'nft1', creatorId: 'creator1', createdAt: testDateMinusNDays(2) },
          { _id: 'nft2', creatorId: 'creator2', createdAt: testDateMinusNDays(1) },
        ],
        users: [{ _id: 'creator1' }, { _id: 'creator2' }],
      },
      [{ creatorIds: ['creator1'] }, { recencyScoreBoostDate: testDate }],
      ['nft1', 'nft2'],
    );
  }

  private async runCollectionPriorityTest() {
    await this.runTest(
      'colelctionId > recency',
      {
        nfts: [
          { _id: 'nft1', collectionId: 'collection1', createdAt: testDateMinusNDays(2) },
          { _id: 'nft2', collectionId: 'collection2', createdAt: testDateMinusNDays(1) },
        ],
      },
      [{ collectionIds: ['collection1'] }, { recencyScoreBoostDate: testDate }],
      ['nft1', 'nft2'],
    );
  }

  private mockNftServiceWithDocuments(nfts: Partial<Nft>[]) {
    // Mock the behavior of the NftService
    const nftDocs = chain(nfts)
      .map((nft) => nftDocMock(nft))
      .orderBy((nft) => nft.createdAt, 'desc')
      .value();
    this.nftServiceMock.count = async () => nftDocs.length;
    this.nftServiceMock.getMany = async ({ ids } = {}, { skip, limit } = {}) => {
      // console.log('getMany ids', ids);
      // console.log('getMany skip', skip);
      // console.log('getMany limit', limit);
      if (ids) {
        // Query time
        return nftDocs.filter((nft) => ids.includes(nft._id));
      }
      if (skip !== undefined && limit !== undefined) {
        // Indexing time
        return chain(nftDocs).drop(skip).take(limit).value();
      }
      throw Error('Mock could not guess the situation. This is a bug in your test.');
    };
  }

  private mockUserServiceWithDocuments(users: Partial<User>[]) {
    // Mock the behavior of the NftService
    const userDocs = chain(users)
      .map((user) => userDocMock(user))
      .orderBy((user) => user.createdAt, 'desc')
      .value();
    this.userServiceMock.getMany = async ({ bookmarkedNftIds } = {}) => {
      // console.log('bookmarkedNftIds', bookmarkedNftIds);
      if (bookmarkedNftIds) {
        // Indexing time
        return userDocs.filter((user) =>
          intersects(
            user.bookmarks.map((b) => b.nftId),
            bookmarkedNftIds,
          ),
        );
      }
      throw Error('Mock could not guess the situation. This is a bug in your test.');
    };
  }

  private mockNftHistoryServiceWithDocuments(records: Partial<NftHistoryRecord>[]) {
    // Mock the behavior of the NftService
    const recordDocs = chain(records)
      .map((record) => nftHistoryRecordDocMock(record))
      .orderBy((record: NftHistoryRecord) => record.createdAt, 'desc')
      .value();
    this.nftHistoryServiceMock.getMany = async ({ nftIds, kinds }: any) => {
      if (nftIds && isEqual(kinds, [NftHistoryRecordKind.Sold])) {
        // Indexing time
        return recordDocs.filter((r) => nftIds.includes(r.nftId)) as any;
      }
      throw Error('Mock could not guess the situation. This is a bug in your test.');
    };
  }

  private async runTest(
    testName: string,
    docMocks: {
      nfts?: Partial<Nft>[];
      users?: Partial<User>[];
      nftHistoryRecords?: Partial<NftHistoryRecord>[];
    },
    getMethodArgs: Parameters<NftElasticsearchService['get']>,
    expectedNftIds: NftId[],
  ) {
    this.mockNftServiceWithDocuments(docMocks.nfts || []);
    this.mockUserServiceWithDocuments(docMocks.users || []);
    this.mockNftHistoryServiceWithDocuments(docMocks.nftHistoryRecords || []);
    await this.service.deleteAndReindexAll();
    const msg = (text: string) => `${testName}: ${text}`;
    try {
      const resultNfts = await this.service.get(...getMethodArgs);
      if (
        isEqual(
          resultNfts.map((nft) => nft._id),
          expectedNftIds,
        )
      ) {
        this.logger.log(msg(`SUCCESS`));
      } else {
        this.logger.error(msg(`FAILED`));
        this.logger.error(msg(`expected ids: ${expectedNftIds.join(', ')}`));
        this.logger.error(msg(`received ids: ${resultNfts.map((nft) => nft._id).join(', ')}`));
      }
    } catch (error) {
      this.logger.error(msg(`FAILED: ${String(error)}`));
    }
    // await this.service.deleteIndex();
  }
}
