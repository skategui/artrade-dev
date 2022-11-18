import { Test, TestingModule } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { range } from 'lodash';
import { CollectionNFT } from '../collections/collection.model';
import { CollectionService } from '../collections/collection.service';
import { NFT } from '../nft/nft.model';
import { NftService } from '../nft/nft.service';
import { mongoDocMock } from '../test/helpers/mongo-doc-mock';
import { SilentLogger } from '../test/helpers/silent-logger.service';
import { User } from '../user/model/user.model';
import { UserService } from '../user/user.service';
import { NewsItemKind } from './news-item.model';
import { NewsfeedService } from './newsfeed.service';

describe('NewsfeedService', () => {
  let service: NewsfeedService;
  let testingModule: TestingModule;
  const nftServiceMock = mock<NftService>();
  const collectionServiceMock = mock<CollectionService>();
  const userServiceMock = mock<UserService>();

  beforeAll(async () => {
    testingModule = await Test.createTestingModule({
      providers: [SilentLogger],
    }).compile();
    service = new NewsfeedService(
      testingModule.get(SilentLogger),
      nftServiceMock,
      collectionServiceMock,
      userServiceMock,
    );
  });

  describe('get', () => {
    it('should get page', async () => {
      userServiceMock.getMany.mockResolvedValue(
        range(4).map((i) => mongoDocMock<User>({ email: `user${i}` } as User)),
      );
      nftServiceMock.getMany.mockResolvedValue(
        range(10).map((i) => mongoDocMock<NFT>({ title: `nft${i}` } as NFT)),
      );
      collectionServiceMock.getMany.mockResolvedValue(
        range(6).map((i) => mongoDocMock<CollectionNFT>({ title: `coll${i}` } as CollectionNFT)),
      );
      const items = await service.get(undefined, 0);
      expect(items).toHaveLength(20);
      expect(items).toEqual(
        expect.arrayContaining([
          ...range(4).map((i) =>
            expect.objectContaining({
              kind: NewsItemKind.Profile,
              profile: expect.objectContaining({ email: `user${i}` }),
            }),
          ),
          ...range(10).map((i) =>
            expect.objectContaining({
              kind: NewsItemKind.Nft,
              nft: expect.objectContaining({ title: `nft${i}` }),
            }),
          ),
          ...range(6).map((i) =>
            expect.objectContaining({
              kind: NewsItemKind.Collection,
              collection: expect.objectContaining({ title: `coll${i}` }),
            }),
          ),
        ]),
      );
    });
  });
});
