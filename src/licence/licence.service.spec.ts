import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { FilterQuery, Model } from 'mongoose';
import { BadInputError } from '../helpers/errors/BadInputError';
import {
  serviceTestBaseImports,
  ServiceTestingModuleMeta,
  setupServiceTestingModule,
} from '../test/helpers/setup-service-testing-module';
import { SilentLogger } from '../test/helpers/silent-logger.service';
import { Licence, LicenceSchema } from './licence.model';
import { LicenceFilter, licencefilterToMongoFilter, LicenceService } from './licence.service';

describe('LicenceService', () => {
  let service: LicenceService;
  let testingModule: TestingModule;
  let licenceModel: Model<Licence>;
  let testingModuleMeta: ServiceTestingModuleMeta;

  beforeAll(async () => {
    testingModule = await Test.createTestingModule({
      imports: [
        ...serviceTestBaseImports,
        MongooseModule.forFeature([{ name: Licence.name, schema: LicenceSchema }]),
      ],
      providers: [SilentLogger],
    }).compile();
    testingModuleMeta = setupServiceTestingModule(testingModule);
    licenceModel = testingModule.get(getModelToken(Licence.name));
    service = new LicenceService(testingModule.get(SilentLogger), licenceModel);
  });

  afterAll(async () => {
    await testingModuleMeta.afterAll();
  });

  beforeEach(async () => {
    await licenceModel.deleteMany({});
  });

  describe('getMany', () => {
    it('should get all licences', async () => {
      const licence1 = await service.create('Licence1');
      const licence2 = await service.create('Licence2');
      const licence3 = await service.create('Licence3');
      const expected = [licence1, licence2, licence3];

      expect(await service.getMany()).toEqual(expected);
    });
  });

  describe('validateIdsExist', () => {
    it('should return the same list when the ID matches', async () => {
      const licence1 = await service.create('Licence1');
      const licence2 = await service.create('Licence2');
      const licence3 = await service.create('Licence3');
      const licenceIds = [licence1._id, licence2._id, licence3._id];
      const expected = licenceIds;

      expect(await service.validateIdsExist(licenceIds)).toEqual(expected);
    });

    it('should return an error if the list contains an incorrect ID', async () => {
      const licence1 = await service.create('Licence1');
      const licence2 = await service.create('Licence2');
      const licence3 = await service.create('Licence3');
      const incorrectId = 'incorrect_id';
      const licenceIds = [licence1._id, licence2._id, licence3._id, incorrectId];
      await expect(service.validateIdsExist(licenceIds)).rejects.toThrowError(
        new BadInputError(`Licence with id \"${incorrectId}\" does not exist`),
      );
    });
  });

  describe('licencefilterToMongoFilter', () => {
    const tests: [LicenceFilter, FilterQuery<Licence>][] = [
      [{ ids: ['123'] }, { _id: { $in: ['123'] } }],
    ];
    it('should provide expected output', () => {
      for (const [input, expectedOutput] of tests) {
        expect(licencefilterToMongoFilter(input)).toEqual(expectedOutput);
      }
    });
  });
});
