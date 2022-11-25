import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { FilterQuery, Model } from 'mongoose';
import { EmailVerificationService } from '../email-verification/email-verification.service';
import { EmailingService } from '../emailing/emailing.service';
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
  let emailService: EmailingService;
  let verificationService: EmailVerificationService;
  let testingModule: TestingModule;
  let testingModuleMeta: ServiceTestingModuleMeta;
  const MockEmailService = jest.fn().mockImplementation(() => ({
    resentEmail: jest.fn(),
  }));
  const MockVerificationService = jest.fn().mockImplementation(() => ({
    getByEmail: jest.fn().mockResolvedValue({
      _id: '654321',
      code: 'secret',
      userId: '123456',
    }),
    delete: jest.fn(),
  }));

  beforeAll(async () => {
    testingModule = await Test.createTestingModule({
      imports: [
        ...serviceTestBaseImports,
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
      ],
      providers: [SilentLogger, MockEmailService, MockVerificationService],
    }).compile();
    testingModuleMeta = setupServiceTestingModule(testingModule);
    userModel = testingModule.get(getModelToken(User.name));
    emailService = testingModule.get(MockEmailService);
    verificationService = testingModule.get(MockVerificationService);
    service = new UserService(
      userModel,
      testingModule.get(SilentLogger),
      {} as any, // TODO mock tagService once we implement tests that require it
      emailService,
      {} as any, // TODO mock fileStorageService once we implement tests that require it
      {} as any, // TODO mock verifyTwitterService once we implement tests that require it
      verificationService,
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
    it('should find the user associated to the given id', async () => {
      expect(await service.getOne({ id: user._id })).toEqual(
        expect.objectContaining({ email: 'user2@foo.com' }),
      );
    });
    it('should not find any user if an incorrect Id', async () => {
      expect(await service.getOne({ id: 'incorrect_id' })).toEqual(null);
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
      [{ followedByUserId: 'user1' }, { followerIds: 'user1' }],
      [{ bookmarkedNftIds: ['nft1'] }, { 'bookmarks.nftId': { $in: ['nft1'] } }],
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

  describe('forgotPassword', () => {
    beforeEach(async () => {
      await userModel.create({
        ...createPayload,
        email: 'reset@password.com',
        emailVerified: true,
      });
    });

    it('should send email', async () => {
      await service.forgotPassword('reset@password.com');
      expect(emailService.resentEmail).toBeCalledWith(
        expect.objectContaining({
          email: 'reset@password.com',
        }),
        true,
      );
    });
  });

  describe('reinitializePassword', () => {
    beforeEach(async () => {
      await userModel.create({
        ...createPayload,
        email: 'change@password.com',
        emailVerified: true,
      });
    });

    it('should save new password', async () => {
      const isReinitialized = await service.reinitializePassword(
        'change@password.com',
        'secret',
        'strongpassword',
      );
      expect(verificationService.getByEmail).toBeCalledWith('change@password.com');
      expect(verificationService.delete).toBeCalledWith('654321');
      expect(isReinitialized).toBeTruthy();
    });
  });
});
