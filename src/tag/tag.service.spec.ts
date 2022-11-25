import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';
import { mongoDocMock } from '../test/helpers/mongo-doc-mock';
import {
  serviceTestBaseImports,
  ServiceTestingModuleMeta,
  setupServiceTestingModule,
} from '../test/helpers/setup-service-testing-module';
import { SilentLogger } from '../test/helpers/silent-logger.service';
import { Tag, TagSchema } from './tag.model';
import { TagService } from './tag.service';

describe('TagService', () => {
  let service: TagService;
  let tagModel: Model<Tag>;
  let testingModule: TestingModule;
  let testingModuleMeta: ServiceTestingModuleMeta;

  beforeAll(async () => {
    testingModule = await Test.createTestingModule({
      imports: [
        ...serviceTestBaseImports,
        MongooseModule.forFeature([{ name: Tag.name, schema: TagSchema }]),
      ],
      providers: [SilentLogger],
    }).compile();
    testingModuleMeta = setupServiceTestingModule(testingModule);
    tagModel = testingModule.get(getModelToken(Tag.name));
    service = new TagService(testingModule.get(SilentLogger), tagModel);
  });

  afterAll(async () => {
    await testingModuleMeta.afterAll();
  });

  beforeEach(async () => {
    await tagModel.deleteMany({});
  });

  describe('getMany', () => {
    beforeEach(async () => {
      await tagModel.create([
        { name: 'Photo', index: 0 },
        { name: 'Art', index: 1 },
        { name: '3D', index: 2 },
      ]);
    });

    it('should return an array of tag model', async () => {
      expect(await service.getMany()).toEqual([
        expect.objectContaining({ name: 'Photo' }),
        expect.objectContaining({ name: 'Art' }),
        expect.objectContaining({ name: '3D' }),
      ]);
    });
  });

  describe('getMany with filter', () => {
    let tag2: Tag;
    let tag3: Tag;

    beforeEach(async () => {
      await tagModel.create({ name: 'Photo', index: 0 });
      tag2 = await tagModel.create({ name: 'Art', index: 1 });
      tag3 = await tagModel.create({ name: '3D', index: 2 });
    });

    it('should return an array of filtered tag model', async () => {
      const filter = { ids: [tag2._id, tag3._id] };
      const docs = await service.getMany(filter);
      expect(docs).toHaveLength(2);
      expect(docs[0]).toEqual(expect.objectContaining({ name: 'Art' }));
      expect(docs[1]).toEqual(expect.objectContaining({ name: '3D' }));
    });
  });

  describe('create', () => {
    it('should create a new tag model', async () => {
      const newTag = mongoDocMock<Tag>({
        name: 'Mixed Media',
        index: 10,
      } as Tag);

      expect(await service.create(newTag)).toEqual(
        expect.objectContaining({
          name: 'Mixed Media',
          index: 10,
        }),
      );
    });
  });
});
