import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { FilterQuery, Model } from 'mongoose';
import { hash } from '../helpers/strings.tools';
import {
  serviceTestBaseImports,
  ServiceTestingModuleMeta,
  setupServiceTestingModule,
} from '../test/helpers/setup-service-testing-module';
import { SilentLogger } from '../test/helpers/silent-logger.service';
import { AdminFilter, adminFilterToMongoFilter, AdminService } from './admin.service';
import { Admin, AdminCreatePayload, AdminSchema } from './model/admin.model';

describe('AdminService', () => {
  let service: AdminService;
  let adminModel: Model<Admin>;
  let testingModule: TestingModule;
  let testingModuleMeta: ServiceTestingModuleMeta;

  beforeAll(async () => {
    testingModule = await Test.createTestingModule({
      imports: [
        ...serviceTestBaseImports,
        MongooseModule.forFeature([{ name: Admin.name, schema: AdminSchema }]),
      ],
      providers: [SilentLogger],
    }).compile();
    testingModuleMeta = setupServiceTestingModule(testingModule);
    adminModel = testingModule.get(getModelToken(Admin.name));
    service = new AdminService(adminModel, testingModule.get(SilentLogger));
  });

  afterAll(async () => {
    await testingModuleMeta.afterAll();
  });

  beforeEach(async () => {
    await adminModel.deleteMany({});
  });

  const createPayload: AdminCreatePayload = {
    email: 'foo@foo.com',
    password: hash('password'),
  };

  describe('getOne', () => {
    let admin: Admin;
    beforeEach(async () => {
      await adminModel.create({ ...createPayload, email: 'admin1@foo.com' });
      admin = await adminModel.create({ ...createPayload, email: 'admin2@foo.com' });
      await adminModel.create({ ...createPayload, email: 'admin3@foo.com' });
    });
    it('should getOne by id', async () => {
      expect(await service.getOne({ id: admin._id })).toEqual(
        expect.objectContaining({ email: 'admin2@foo.com' }),
      );
    });
  });

  describe('adminFilterToMongoFilter', () => {
    const tests: [AdminFilter, FilterQuery<Admin>][] = [[{ id: '123' }, { _id: '123' }]];
    it('should provide expected output', () => {
      for (const [input, expectedOutput] of tests) {
        expect(adminFilterToMongoFilter(input)).toEqual(expectedOutput);
      }
    });
  });
});
