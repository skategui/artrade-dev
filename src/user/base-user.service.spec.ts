import { getModelToken, MongooseModule, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';
import { defaultRootDocSchemaOption } from '../helpers/default-schema-option.tools';
import { hash } from '../helpers/strings.tools';
import {
  serviceTestBaseImports,
  ServiceTestingModuleMeta,
  setupServiceTestingModule,
} from '../test/helpers/setup-service-testing-module';
import { CreatePayload } from '../types/mongo-helpers';
import { BaseUserService } from './base-user.service';
import { BaseUser } from './model/base-user.model';

class ConcreteBaseUserService extends BaseUserService {
  // BaseUserService is abstract, so we create a stub child.
  // eslint-disable-next-line require-await
  async getOne(): Promise<BaseUser | null> {
    return null; // getOne is abstract, so we implement a dummy version.
  }
}

@Schema(defaultRootDocSchemaOption)
class ConcreteBaseUser extends BaseUser {
  // BaseUser is abstract, so we create a stub child.
}

describe('BaseUserService', () => {
  let service: BaseUserService;
  let userModel: Model<BaseUser>;
  let testingModule: TestingModule;
  let testingModuleMeta: ServiceTestingModuleMeta;

  beforeAll(async () => {
    testingModule = await Test.createTestingModule({
      imports: [
        ...serviceTestBaseImports,
        MongooseModule.forFeature([
          { name: BaseUser.name, schema: SchemaFactory.createForClass(ConcreteBaseUser) },
        ]),
      ],
    }).compile();
    testingModuleMeta = setupServiceTestingModule(testingModule);
    userModel = testingModule.get(getModelToken(BaseUser.name));
    service = new ConcreteBaseUserService(userModel);
  });

  afterAll(async () => {
    await testingModuleMeta.afterAll();
  });

  beforeEach(async () => {
    await userModel.deleteMany({});
  });

  const email = 'foo@foo.com';
  const password = 'password';
  const createPayload: CreatePayload<BaseUser> = { email, password: hash(password) };

  describe('tryLoginByEmailAndPassword', () => {
    it('should return user if email and password match', async () => {
      await userModel.create(createPayload);
      expect(await service.tryLoginByEmailAndPassword(email, password)).toEqual(
        expect.objectContaining({ email }),
      );
    });

    it('should return null if email and password do not match', async () => {
      await userModel.create(createPayload);
      expect(await service.tryLoginByEmailAndPassword('bar@bar.com', password)).toBeNull();
      expect(await service.tryLoginByEmailAndPassword(email, 'notpassword')).toBeNull();
    });
  });

  describe('updateJwtHash', () => {
    it('should update the jwt hash', async () => {
      const user = await userModel.create(createPayload);
      const refreshJwtHash = 'jwtHash';
      await service.updateJwtHash(user._id, refreshJwtHash);
      const updatedUser = await userModel.findOne({}, { refreshJwtHash: true });
      expect(updatedUser).toEqual(expect.objectContaining({ refreshJwtHash }));
    });
  });
});
