import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { Model } from 'mongoose';
import { NftService } from '../nft/nft.service';
import {
  serviceTestBaseImports,
  ServiceTestingModuleMeta,
  setupServiceTestingModule,
} from '../test/helpers/setup-service-testing-module';
import { SilentLogger } from '../test/helpers/silent-logger.service';
import { Analytic, AnalyticSchema } from './analytic.model';
import { AnalyticService, AnalyticsVisitorCountFilter } from './analytic.service';
import { ListEventsPossible } from './types';

describe('AnalyticService', () => {
  let service: AnalyticService;
  let testingModule: TestingModule;
  let analyticModel: Model<Analytic>;
  let testingModuleMeta: ServiceTestingModuleMeta;
  const nftServiceMock = mock<NftService>();

  beforeAll(async () => {
    testingModule = await Test.createTestingModule({
      imports: [
        ...serviceTestBaseImports,
        MongooseModule.forFeature([{ name: Analytic.name, schema: AnalyticSchema }]),
      ],
      providers: [SilentLogger],
    }).compile();
    testingModuleMeta = setupServiceTestingModule(testingModule);
    analyticModel = testingModule.get(getModelToken(Analytic.name));
    service = new AnalyticService(testingModule.get(SilentLogger), analyticModel, nftServiceMock);
  });

  afterAll(async () => {
    await testingModuleMeta.afterAll();
  });

  beforeEach(async () => {
    await analyticModel.deleteMany({});
  });

  describe('create', () => {
    it('create new analytic item in the DB', async () => {
      await service.create(
        {
          key: ListEventsPossible.NftScreenCtaClicked,
        },
        'toto',
      );
      expect(nftServiceMock.increaseViewCount).not.toHaveBeenCalled();
    });

    it('create new analytic item in the DB AND increase view count', async () => {
      const nftId = 'nft_id';

      jest.spyOn(nftServiceMock, 'increaseViewCount' as any).mockImplementation(() => undefined);
      await service.create(
        {
          key: ListEventsPossible.NftScreenShown,
          nftId,
        },
        'toto',
      );
      expect(nftServiceMock.increaseViewCount).toBeCalledWith(nftId);
      expect(nftServiceMock.increaseViewCount).toBeCalledTimes(1);
    });
  });

  describe('getVisitorCount', () => {
    const nftId = 'nft_id';
    const tests: [AnalyticsVisitorCountFilter, number][] = [
      [{ eventKeys: [ListEventsPossible.NftScreenShown] }, 1],
      [{ nftIds: [nftId] }, 2],
    ];

    it('should provide expected output', async () => {
      await service.create(
        {
          key: ListEventsPossible.NftScreenShown,
          nftId,
        },
        'toto',
      );

      await service.create(
        {
          key: ListEventsPossible.PurchaseRefundFailed,
          nftId,
        },
        'toto',
      );
      for (const [input, expectedOutput] of tests) {
        expect(await service.getVisitorCount(input)).toEqual(expectedOutput);
      }
    });
  });
});
