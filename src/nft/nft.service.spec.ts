import { EventEmitter2 } from '@nestjs/event-emitter';
import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { Long } from 'mongodb';
import { FilterQuery, Model } from 'mongoose';
import { BadInputError } from '../helpers/errors/BadInputError';
import { TagService } from '../tag/tag.service';
import {
  serviceTestBaseImports,
  ServiceTestingModuleMeta,
  setupServiceTestingModule,
} from '../test/helpers/setup-service-testing-module';
import { SilentLogger } from '../test/helpers/silent-logger.service';
import { CreateNftAuctionInput } from './dto/create-nft-auction-input.dto';
import { CreateNftFixedPriceInput } from './dto/create-nft-fixed-price-input.dto';
import { CreateNftOfferInput } from './dto/create-nft-offer-input.dto';
import { NftFixedPriceSale, NftSaleKind } from './nft-sale';
import { Nft, NftSchema } from './nft.model';
import { NftFilter, nftFilterToMongoFilter, NftService } from './nft.service';

describe('NftService', () => {
  let service: NftService;
  let nftModel: Model<Nft>;
  let testingModule: TestingModule;
  let testingModuleMeta: ServiceTestingModuleMeta;
  const tagServiceMock = mock<TagService>();
  const eventEmitterMock = mock<EventEmitter2>();

  const tagIds = ['toto', 'tata'];

  beforeAll(async () => {
    testingModule = await Test.createTestingModule({
      imports: [
        ...serviceTestBaseImports,
        MongooseModule.forFeature([{ name: Nft.name, schema: NftSchema }]),
      ],
      providers: [SilentLogger],
    }).compile();
    testingModuleMeta = setupServiceTestingModule(testingModule);
    nftModel = testingModule.get(getModelToken(Nft.name));
    jest.spyOn(tagServiceMock, 'validateIdsExist').mockResolvedValue(tagIds);
    jest.spyOn(eventEmitterMock, 'emit').mockImplementation(() => true);
    service = new NftService(
      testingModule.get(SilentLogger),
      nftModel,
      tagServiceMock,
      eventEmitterMock,
    );
  });

  afterAll(async () => {
    await testingModuleMeta.afterAll();
  });

  beforeEach(async () => {
    await nftModel.deleteMany({});
  });

  const nftFixedPrice: CreateNftFixedPriceInput = {
    price: Long.fromInt(100000000),
    mintAddress: '0xaaaaa',
    tagIds: [],
    title: 'nftFixedPriceTitle',
    description: 'description',
    thumbnail: 'thumbnail_url4',
    collectionId: 'collectionId',
    license: 'license1',
    numberOfEdition: 3,
    royalties: [],
  };

  const nftAuctionPrice: CreateNftAuctionInput = {
    startDate: new Date(),
    endDate: new Date(),
    startingPrice: Long.fromInt(100000000),
    mintAddress: '0xbbbbbb',
    tagIds: [],
    title: 'nftAuctionPriceTitle',
    description: 'description',
    thumbnail: 'thumbnail_url3',
    collectionId: 'collectionId',
    license: 'license2',
    numberOfEdition: 2,
    royalties: [],
  };

  const nftOpenOfferPrice: CreateNftOfferInput = {
    mintAddress: '0xccccc',
    tagIds: [],
    title: 'nftOpenOfferPriceTitle',
    description: 'description',
    thumbnail: 'thumbnail_url',
    collectionId: 'collectionId',
    license: 'license3',
    numberOfEdition: 1,
    royalties: [],
  };

  describe('createService', () => {
    it('should create nft with FixedPrice type', async () => {
      const nft = await service.createFixedPriceNft({
        input: nftFixedPrice,
        userId: 'userId',
      });

      expect(nft.sale.kind).toEqual(NftSaleKind.FixedPrice);
    });

    it('should create nft with Auction type', async () => {
      const nft = await service.createAuctionNft({
        input: nftAuctionPrice,
        userId: 'userId',
      });

      expect(nft.sale.kind).toEqual(NftSaleKind.Auction);
    });

    it('should create nft with OPenToOffer type', async () => {
      const nft = await service.createOfferNft({
        input: nftOpenOfferPrice,
        userId: 'userId',
      });

      expect(nft.sale.kind).toEqual(NftSaleKind.OpenToOffer);
    });
  });

  describe('getMany', () => {
    it('should get all the NFT', async () => {
      const nft1 = await service.createFixedPriceNft({
        input: nftFixedPrice,
        userId: 'userId',
      });
      const nft2 = await service.createAuctionNft({
        input: nftAuctionPrice,
        userId: 'userId',
      });
      const nft3 = await service.createOfferNft({
        input: nftOpenOfferPrice,
        userId: 'userId',
      });

      expect(await service.getMany()).toEqual([
        expect.objectContaining({
          _id: nft1._id,
          title: nft1.title,
          description: nft2.description,
        }),
        expect.objectContaining({
          _id: nft2._id,
          title: nft2.title,
          description: nft3.description,
        }),
        nft3,
      ]);
    });
  });

  describe('validateIdsExist', () => {
    it('should return the same list when the ID matches', async () => {
      const nft1 = await service.createFixedPriceNft({
        input: nftFixedPrice,
        userId: 'userId',
      });
      const nft2 = await service.createAuctionNft({
        input: nftAuctionPrice,
        userId: 'userId',
      });
      const nft3 = await service.createOfferNft({
        input: nftOpenOfferPrice,
        userId: 'userId',
      });

      const nftIds = [nft1._id, nft2._id, nft3._id];
      const expected = nftIds;

      expect(await service.validateIdsExist(nftIds)).toEqual(expected);
    });

    it('should return an error if the list contains an incorrect ID', async () => {
      const nft1 = await service.createFixedPriceNft({
        input: nftFixedPrice,
        userId: 'userId',
      });
      const nft2 = await service.createAuctionNft({
        input: nftAuctionPrice,
        userId: 'userId',
      });
      const nft3 = await service.createOfferNft({
        input: nftOpenOfferPrice,
        userId: 'userId',
      });

      const incorrectId = 'incorrect_id';
      const nftIds = [nft1._id, nft2._id, nft3._id, incorrectId];
      await expect(service.validateIdsExist(nftIds)).rejects.toThrowError(
        new BadInputError(`NFT with id \"${incorrectId}\" does not exist`),
      );
    });
  });

  describe('exists', () => {
    it('should return true when the ID matches', async () => {
      const nft1 = await service.createFixedPriceNft({
        input: nftFixedPrice,
        userId: 'userId',
      });
      const nft2 = await service.createAuctionNft({
        input: nftAuctionPrice,
        userId: 'userId',
      });
      const nft3 = await service.createOfferNft({
        input: nftOpenOfferPrice,
        userId: 'userId',
      });

      const nftIds = [nft1._id, nft2._id, nft3._id];
      expect(await service.exists(nftIds)).toEqual(true);
    });

    it('should return false if the list contains an incorrect ID', async () => {
      const nft1 = await service.createFixedPriceNft({
        input: nftFixedPrice,
        userId: 'userId',
      });
      const nft2 = await service.createAuctionNft({
        input: nftAuctionPrice,
        userId: 'userId',
      });
      const nft3 = await service.createOfferNft({
        input: nftOpenOfferPrice,
        userId: 'userId',
      });

      const incorrectId = 'incorrect_id';
      const nftIds = [nft1._id, nft2._id, nft3._id, incorrectId];
      expect(await service.exists(nftIds)).toEqual(false);
    });
  });

  describe('increaseViewCount', () => {
    it('should be working as expected', async () => {
      const nft = await service.createFixedPriceNft({
        input: nftFixedPrice,
        userId: 'userId',
      });

      expect(nft.viewCount).toEqual(0);
      await service.increaseViewCount(nft._id);
      const nftFound = await service.getByIdOrThrow(nft._id);
      expect(nftFound.viewCount).toEqual(nft.viewCount + 1);
    });
  });

  describe('update asset', () => {
    it('should be working as expected', async () => {
      const nft = await service.createFixedPriceNft({
        input: nftFixedPrice,
        userId: 'userId',
      });

      const myThumbnail = 'thumbnail';
      await service.updateThumbnail(nft._id, myThumbnail);
      const nftFound = await service.getByIdOrThrow(nft._id);
      expect(nftFound.thumbnail).toEqual(myThumbnail);
    });
  });

  describe('update NFT fixed price', () => {
    it('should be working as expected', async () => {
      const nft = await service.createFixedPriceNft({
        input: nftFixedPrice,
        userId: 'userId',
      });

      const priceInSol = 100000000;
      await service.updateNftFixedPrice(nft._id, priceInSol);
      const nftFound = await service.getByIdOrThrow(nft._id);
      expect((nftFound.sale as NftFixedPriceSale).price).toEqual(priceInSol);
    });

    it('should throw error if the NFT is not found', async () => {
      const nftId = 'not_existing_id';
      await expect(service.updateNftFixedPrice(nftId, 10000)).rejects.toThrowError(
        new BadInputError(`NFT with id \"${nftId}\" with fixed price does not exist`),
      );
    });

    it('should throw error if the NFT has incorrect type', async () => {
      const nft = await service.createOfferNft({
        input: nftOpenOfferPrice,
        userId: 'userId',
      });
      await expect(service.updateNftFixedPrice(nft._id, 10000)).rejects.toThrowError(
        new BadInputError(`NFT with id \"${nft._id}\" with fixed price does not exist`),
      );
    });
  });

  describe('nftFilterToMongoFilter', () => {
    const tests: [NftFilter, FilterQuery<Nft>][] = [
      [{ ids: ['123', '456'] }, { _id: { $in: ['123', '456'] } }],
      [{ creatorIds: ['123', '456'] }, { creatorId: { $in: ['123', '456'] } }],
      [{ ownerIds: ['123', '456'] }, { ownerId: { $in: ['123', '456'] } }],
      [
        { saleKinds: [NftSaleKind.Auction, NftSaleKind.FixedPrice] },
        { 'sale.kind': { $in: [NftSaleKind.Auction, NftSaleKind.FixedPrice] } },
      ],
      [{ tagIds: ['123', '456'] }, { tagIds: { $in: ['123', '456'] } }],
      [
        { minPrice: new Long(123) },
        {
          $and: [
            {
              $or: [
                {
                  'sale.kind': NftSaleKind.Auction,
                  'sale.startingPriceInSol': { $lte: new Long(123) },
                },
                {
                  'sale.kind': NftSaleKind.FixedPrice,
                  'sale.priceInSol': { $lte: new Long(123) },
                },
                {
                  'sale.kind': NftSaleKind.OpenToOffer,
                  'sale.offers': { $last: { $lte: new Long(123) } },
                },
              ],
            },
          ],
        },
      ],
      [
        { maxPrice: new Long(123) },
        {
          $and: [
            {
              $or: [
                {
                  'sale.kind': NftSaleKind.Auction,
                  'sale.startingPriceInSol': { $gte: new Long(123) },
                },
                {
                  'sale.kind': NftSaleKind.FixedPrice,
                  'sale.priceInSol': { $gte: new Long(123) },
                },
                {
                  'sale.kind': NftSaleKind.OpenToOffer,
                  'sale.offers': { $last: { $gte: new Long(123) } },
                },
              ],
            },
          ],
        },
      ],
      // And one with all filters combined
      [
        {
          ids: ['1', '2'],
          creatorIds: ['3', '4'],
          ownerIds: ['5', '6'],
          saleKinds: [NftSaleKind.OpenToOffer, NftSaleKind.FixedPrice],
          tagIds: ['7', '8'],
          minPrice: new Long(9),
          maxPrice: new Long(10),
        },
        {
          _id: { $in: ['1', '2'] },
          creatorId: { $in: ['3', '4'] },
          ownerId: { $in: ['5', '6'] },
          'sale.kind': { $in: [NftSaleKind.OpenToOffer, NftSaleKind.FixedPrice] },
          tagIds: { $in: ['7', '8'] },
          $and: [
            {
              $or: [
                {
                  'sale.kind': NftSaleKind.Auction,
                  'sale.startingPriceInSol': { $gte: new Long(10), $lte: new Long(9) },
                },
                {
                  'sale.kind': NftSaleKind.FixedPrice,
                  'sale.priceInSol': { $gte: new Long(10), $lte: new Long(9) },
                },
                {
                  'sale.kind': NftSaleKind.OpenToOffer,
                  'sale.offers': { $last: { $gte: new Long(10), $lte: new Long(9) } },
                },
              ],
            },
          ],
        },
      ],
    ];
    it('should provide expected output', () => {
      for (const [input, expectedOutput] of tests) {
        expect(nftFilterToMongoFilter(input)).toEqual(expectedOutput);
      }
    });
  });
});
