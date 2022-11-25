import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';
import {
  serviceTestBaseImports,
  ServiceTestingModuleMeta,
  setupServiceTestingModule,
} from '../test/helpers/setup-service-testing-module';
import { SilentLogger } from '../test/helpers/silent-logger.service';
import { EmailVerification, EmailVerificationSchema } from './email-verification.model';
import { EmailVerificationService } from './email-verification.service';

describe('EmailVerificationService', () => {
  let service: EmailVerificationService;
  let emailVerificationModel: Model<EmailVerification>;
  let testingModule: TestingModule;
  let testingModuleMeta: ServiceTestingModuleMeta;

  beforeAll(async () => {
    testingModule = await Test.createTestingModule({
      imports: [
        ...serviceTestBaseImports,
        MongooseModule.forFeature([
          { name: EmailVerification.name, schema: EmailVerificationSchema },
        ]),
      ],
      providers: [SilentLogger],
    }).compile();
    testingModuleMeta = setupServiceTestingModule(testingModule);
    emailVerificationModel = testingModule.get(getModelToken(EmailVerification.name));
    service = new EmailVerificationService(testingModule.get(SilentLogger), emailVerificationModel);
  });

  afterAll(async () => {
    await testingModuleMeta.afterAll();
  });

  beforeEach(async () => {
    await emailVerificationModel.deleteMany({});
  });

  describe('get by email', () => {
    it('should return the associated user if it exists in the DB', async () => {
      const email = 'toto@gmail.com';
      const code = 'artrade';
      const userId = 'userId';
      await service.create({ code, email, userId });
      expect(await service.getByEmail(email)).toEqual(
        expect.objectContaining({
          code,
          email,
          userId,
        }),
      );
    });

    it('should return null if the user does not exist in the DB', async () => {
      expect(await service.getByEmail('not_existing_email@gmail.com')).toEqual(null);
    });
  });

  describe('delete', () => {
    it('should delete email verification item', async () => {
      const emailVerificationTest = await service.create({
        email: 'bob@example.com',
        userId: '123',
        code: 'abcDEF',
      });
      await service.delete(emailVerificationTest._id);
      expect(await emailVerificationModel.findOne({ _id: emailVerificationTest._id })).toEqual(
        null,
      );
    });
  });
});
