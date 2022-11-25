import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';
import { NftSaleKind } from '../nft/nft-sale';
import {
  serviceTestBaseImports,
  ServiceTestingModuleMeta,
  setupServiceTestingModule,
} from '../test/helpers/setup-service-testing-module';
import { SilentLogger } from '../test/helpers/silent-logger.service';
import { BaseNftHistoryRecord, NftHistoryRecordKind } from './model/nft-history-record.model';
import { nftHistoryRecordMongooseFeatures } from './nft-history.module';
import { NftHistoryService } from './nft-history.service';

describe('NftHistoryService', () => {
  let service: NftHistoryService;
  let nftHistoryRecordModel: Model<BaseNftHistoryRecord>;
  let testingModule: TestingModule;
  let testingModuleMeta: ServiceTestingModuleMeta;

  beforeAll(async () => {
    testingModule = await Test.createTestingModule({
      imports: [...serviceTestBaseImports, nftHistoryRecordMongooseFeatures],
      providers: [SilentLogger],
    }).compile();
    testingModuleMeta = setupServiceTestingModule(testingModule);
    nftHistoryRecordModel = testingModule.get(getModelToken(BaseNftHistoryRecord.name));
    service = new NftHistoryService(testingModule.get(SilentLogger), nftHistoryRecordModel);
  });

  afterAll(async () => {
    await testingModuleMeta.afterAll();
  });

  beforeEach(async () => {
    await nftHistoryRecordModel.deleteMany({});
  });

  describe('getMany', () => {
    beforeEach(async () => {
      await nftHistoryRecordModel.create([
        {
          nftId: '123',
          kind: NftHistoryRecordKind.Created,
          ownerId: 'abc',
        },
        {
          nftId: '123',
          price: 10,
          ownerId: 'abc',
          kind: NftHistoryRecordKind.PriceUpdated,
        },
        {
          nftId: '456',
          kind: NftHistoryRecordKind.Created,
          ownerId: 'def',
        },
      ]);
    });

    it('should get all nft history', async () => {
      expect(await service.getMany()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            nftId: '123',
            kind: 'Created',
          }),
          expect.objectContaining({
            nftId: '123',
            price: 10,
            ownerId: 'abc',
            kind: 'PriceUpdated',
          }),
          expect.objectContaining({
            nftId: '456',
            kind: 'Created',
          }),
        ]),
      );
    });

    it('should get nft history filter by nftId', async () => {
      expect(await service.getMany({ nftIds: ['123'] })).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            nftId: '123',
            kind: 'Created',
          }),
          expect.objectContaining({
            nftId: '123',
            price: 10,
            ownerId: 'abc',
            kind: 'PriceUpdated',
          }),
        ]),
      );
    });
  });

  describe('create', () => {
    it('should create Creation nft history record', async () => {
      const input = {
        nftId: '123',
        kind: NftHistoryRecordKind.Created,
        ownerId: 'abc',
      };
      expect(await service.create(input)).toEqual(
        expect.objectContaining({
          nftId: '123',
          kind: 'Created',
        }),
      );
    });

    it('should create Sale nft history record', async () => {
      const input = {
        nftId: '123',
        sellerId: 'abc',
        buyerId: 'def',
        price: 10,
        kind: NftHistoryRecordKind.Sold,
      };
      expect(await service.create(input)).toEqual(
        expect.objectContaining({
          nftId: '123',
          sellerId: 'abc',
          buyerId: 'def',
          price: 10,
          kind: 'Sold',
        }),
      );
    });

    it('should create PriceUpdate nft history record', async () => {
      const input = {
        nftId: '123',
        ownerId: 'abc',
        price: 10,
        kind: NftHistoryRecordKind.PriceUpdated,
      };
      expect(await service.create(input)).toEqual(
        expect.objectContaining({
          nftId: '123',
          ownerId: 'abc',
          price: 10,
          kind: 'PriceUpdated',
        }),
      );
    });

    it('should create TypeOfSaleUpdate nft history record', async () => {
      const input = {
        nftId: '123',
        ownerId: 'abc',
        typeOfSale: NftSaleKind.FixedPrice,
        kind: NftHistoryRecordKind.TypeOfSaleUpdated,
      };
      expect(await service.create(input)).toEqual(
        expect.objectContaining({
          nftId: '123',
          ownerId: 'abc',
          typeOfSale: 'FixedPrice',
          kind: 'TypeOfSaleUpdated',
        }),
      );
    });
  });
});
