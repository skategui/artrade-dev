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
import { User, UserCreatePayload, UserSchema } from './model/user.model';
import { UserFilter, userFilterToMongoFilter, UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;
  let userModel: Model<User>;
  let testingModule: TestingModule;
  let testingModuleMeta: ServiceTestingModuleMeta;

  beforeAll(async () => {
    testingModule = await Test.createTestingModule({
      imports: [
        ...serviceTestBaseImports,
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
      ],
      providers: [SilentLogger],
    }).compile();
    testingModuleMeta = setupServiceTestingModule(testingModule);
    userModel = testingModule.get(getModelToken(User.name));
    service = new UserService(
      userModel,
      testingModule.get(SilentLogger),
      {} as any, // TODO mock tagService once we implement tests that require it
      {} as any, // TODO mock emailingService once we implement tests that require it
      {} as any, // TODO mock fileStorageService once we implement tests that require it
      {} as any, // TODO mock verifyTwitterService once we implement tests that require it
      {} as any, // TODO mock verificationService once we implement tests that require it
    );
  });

  afterAll(async () => {
    await testingModuleMeta.afterAll();
  });

  beforeEach(async () => {
    await userModel.deleteMany({});
  });

  const createPayload: UserCreatePayload = {
    email: 'foo@foo.com',
    password: hash('password'),
    firstName: 'John',
    lastName: 'Doe',
    nickname: 'Johnny',
  };

  describe('getOne', () => {
    let user: User;
    beforeEach(async () => {
      await userModel.create({ ...createPayload, email: 'user1@foo.com' });
      user = await userModel.create({ ...createPayload, email: 'user2@foo.com' });
      await userModel.create({ ...createPayload, email: 'user3@foo.com' });
    });
    it('should getOne by id', async () => {
      expect(await service.getOne({ id: user._id })).toEqual(
        expect.objectContaining({ email: 'user2@foo.com' }),
      );
    });
  });

  describe('userFilterToMongoFilter', () => {
    const tests: [UserFilter, FilterQuery<User>][] = [
      [{ id: '123' }, { _id: { $in: ['123'] } }],
      [{ ids: ['123', '456'] }, { _id: { $in: ['123', '456'] } }],
      [
        { nameRegexp: 'foo' },
        {
          $or: [{ nickname: { $regex: 'foo', $options: 'i' } }],
        },
      ],
      [{ nickname: 'foo' }, { nickname: 'foo' }],
      [{ email: 'foo@foo.com' }, { email: { $regex: 'foo@foo.com', $options: 'i' } }],
      [{ refreshJwtHash: 'hash' }, { refreshJwtHash: 'hash' }],
      [
        { ids: ['123', '456'], nameRegexp: 'foo' },
        { _id: { $in: ['123', '456'] }, $or: [{ nickname: { $regex: 'foo', $options: 'i' } }] },
      ],
    ];
    it('should provide expected output', () => {
      for (const [input, expectedOutput] of tests) {
        expect(userFilterToMongoFilter(input)).toEqual(expectedOutput);
      }
    });
  });
});
