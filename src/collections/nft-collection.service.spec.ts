import { EventEmitter2 } from '@nestjs/event-emitter';
import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { FilterQuery, Model } from 'mongoose';
import { NftCollection, NftCollectionSchema } from '../collections/nft-collection.model';
import {
  CreateCollection,
  NftCollectionFilter,
  nftCollectionFilterToMongoFilter,
  NftCollectionService,
} from '../collections/nft-collection.service';
import { BadInputError } from '../helpers/errors/BadInputError';
import { TagService } from '../tag/tag.service';
import {
  serviceTestBaseImports,
  ServiceTestingModuleMeta,
  setupServiceTestingModule,
} from '../test/helpers/setup-service-testing-module';
import { SilentLogger } from '../test/helpers/silent-logger.service';

describe('NftCollectionService', () => {
  let service: NftCollectionService;
  let testingModule: TestingModule;
  let NftCollectionModel: Model<NftCollection>;
  let testingModuleMeta: ServiceTestingModuleMeta;
  const tagServiceMock = mock<TagService>();
  const eventEmitterMock = mock<EventEmitter2>();

  const tagIds = ['toto', 'tata'];

  const input1: CreateCollection = {
    mintAddress: 'mintAddress',
    tagIds,
    title: 'myTitle',
    description: 'my Description',
    thumbnail: 'my thumbnail',
    creatorId: 'user_id',
  };
  const input2: CreateCollection = {
    mintAddress: 'mintAddress1',
    tagIds,
    title: 'myTitle1',
    description: 'my Description1',
    thumbnail: 'my thumbnai2l2',
    creatorId: 'user_id',
  };
  const input3: CreateCollection = {
    mintAddress: 'mintAddress3',
    tagIds,
    title: 'myTitle3',
    thumbnail: 'my thumbnail3',
    description: 'my Description3',
    creatorId: 'user_id',
  };

  beforeAll(async () => {
    testingModule = await Test.createTestingModule({
      imports: [
        ...serviceTestBaseImports,
        MongooseModule.forFeature([{ name: NftCollection.name, schema: NftCollectionSchema }]),
      ],
      providers: [SilentLogger],
    }).compile();
    testingModuleMeta = setupServiceTestingModule(testingModule);
    NftCollectionModel = testingModule.get(getModelToken(NftCollection.name));
    jest.spyOn(tagServiceMock, 'validateIdsExist').mockResolvedValue(tagIds);
    jest.spyOn(eventEmitterMock, 'emit').mockImplementation(() => true);
    service = new NftCollectionService(
      testingModule.get(SilentLogger),
      NftCollectionModel,
      tagServiceMock,
      eventEmitterMock,
    );
  });

  afterAll(async () => {
    await testingModuleMeta.afterAll();
  });

  beforeEach(async () => {
    await NftCollectionModel.deleteMany({});
  });

  describe('getMany', () => {
    it('should get all NftCollections', async () => {
      const NftCollection1 = await service.create(input1);
      const NftCollection2 = await service.create(input2);
      const NftCollection3 = await service.create(input3);
      const expected = [NftCollection1, NftCollection2, NftCollection3];

      expect(await service.getMany()).toEqual(expected);
    });

    describe('validateIdsExist', () => {
      it('should return the same list when the ID matches', async () => {
        const NftCollection1 = await service.create(input1);
        const NftCollection2 = await service.create(input2);
        const NftCollection3 = await service.create(input3);
        const NftCollectionIds = [NftCollection1._id, NftCollection2._id, NftCollection3._id];
        const expected = NftCollectionIds;

        expect(await service.validateIdsExist(NftCollectionIds)).toEqual(expected);
      });

      it('should return an error if the list contains an incorrect ID', async () => {
        const NftCollection1 = await service.create(input1);
        const NftCollection2 = await service.create(input2);
        const NftCollection3 = await service.create(input3);
        const incorrectId = 'incorrect_id';
        const NftCollectionIds = [
          NftCollection1._id,
          NftCollection2._id,
          NftCollection3._id,
          incorrectId,
        ];
        await expect(service.validateIdsExist(NftCollectionIds)).rejects.toThrowError(
          new BadInputError(`Collection with id \"${incorrectId}\" does not exist`),
        );
      });
    });

    describe('updateThumbnail', () => {
      it('should update the thumbnail of the collection', async () => {
        const nftCollection = await service.create(input1);
        const thumbnail = 'thumbail_url';
        await service.updateThumbnail(nftCollection._id, thumbnail);

        expect(await service.getMany({ ids: [nftCollection._id] })).toEqual([
          expect.objectContaining({
            _id: nftCollection._id,
            thumbnail,
          }),
        ]);
      });
    });

    describe('exists', () => {
      it('should return true if all the collections exist in the DB', async () => {
        const nftCollection1 = await service.create(input1);
        const nftCollection2 = await service.create(input2);
        const nftCollection3 = await service.create(input3);
        const nftCollectionIds = [nftCollection1._id, nftCollection2._id, nftCollection3._id];

        expect(await service.exists(nftCollectionIds)).toEqual(true);
      });
      it('should return false if at least one collection does not exist in the DB', async () => {
        const nftCollection1 = await service.create(input1);
        const nftCollection2 = await service.create(input2);
        const nftCollection3 = await service.create(input3);
        const incorrectId = 'incorrect_id';
        const nftCollectionIds = [
          nftCollection1._id,
          nftCollection2._id,
          nftCollection3._id,
          incorrectId,
        ];

        expect(await service.exists(nftCollectionIds)).toEqual(false);
      });
    });

    it('should return an error if the list contains an incorrect ID', async () => {
      const NftCollection1 = await service.create(input1);
      const NftCollection2 = await service.create(input2);
      const NftCollection3 = await service.create(input3);
      const incorrectId = 'incorrect_id';
      const NftCollectionIds = [
        NftCollection1._id,
        NftCollection2._id,
        NftCollection3._id,
        incorrectId,
      ];
      await expect(service.validateIdsExist(NftCollectionIds)).rejects.toThrowError(
        new BadInputError(`Collection with id \"${incorrectId}\" does not exist`),
      );
    });
  });

  describe('NftCollectionfilterToMongoFilter', () => {
    const tests: [NftCollectionFilter, FilterQuery<NftCollection>][] = [
      [{ ids: ['123'] }, { _id: { $in: ['123'] } }],
      [{ creatorIds: ['creatorId', 'toto'] }, { creatorId: { $in: ['creatorId', 'toto'] } }],
    ];
    it('should provide expected output', () => {
      for (const [input, expectedOutput] of tests) {
        expect(nftCollectionFilterToMongoFilter(input)).toEqual(expectedOutput);
      }
    });
  });
});
