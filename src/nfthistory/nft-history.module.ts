import { Module } from '@nestjs/common';
import { MongooseModule, SchemaFactory } from '@nestjs/mongoose';
import { UserModule } from '../user/user.module';
import {
  BaseNftHistoryRecord,
  NftCreatedHistoryRecord,
  NftHistoryRecordKind,
  NftPriceUpdatedHistoryRecord,
  NftSoldHistoryRecord,
  NftTypeOfSaleUpdatedHistoryRecord,
} from './model/nft-history-record.model';
import { NftCreatedHistoryRecordResolver } from './nft-history-created.resolver';
import { NftPriceUpdatedHistoryRecordResolver } from './nft-history-price-updated.resolver';
import { NftTypeOfSaleUpdatedHistoryRecordResolver } from './nft-history-sale-kind-updated.resolver';
import { NftSoldHistoryRecordResolver } from './nft-history-sold.resolver';
import { NftHistoryResolver } from './nft-history.resolver';
import { NftHistoryService } from './nft-history.service';

export const nftHistoryRecordMongooseFeatures = MongooseModule.forFeature([
  {
    name: BaseNftHistoryRecord.name,
    schema: SchemaFactory.createForClass(BaseNftHistoryRecord),
    discriminators: [
      {
        name: NftCreatedHistoryRecord.name,
        schema: SchemaFactory.createForClass(NftCreatedHistoryRecord),
        value: NftHistoryRecordKind.Created,
      },
      {
        name: NftSoldHistoryRecord.name,
        schema: SchemaFactory.createForClass(NftSoldHistoryRecord),
        value: NftHistoryRecordKind.Sold,
      },
      {
        name: NftPriceUpdatedHistoryRecord.name,
        schema: SchemaFactory.createForClass(NftPriceUpdatedHistoryRecord),
        value: NftHistoryRecordKind.PriceUpdated,
      },
      {
        name: NftTypeOfSaleUpdatedHistoryRecord.name,
        schema: SchemaFactory.createForClass(NftTypeOfSaleUpdatedHistoryRecord),
        value: NftHistoryRecordKind.TypeOfSaleUpdated,
      },
    ],
  },
]);

@Module({
  imports: [nftHistoryRecordMongooseFeatures, UserModule],
  providers: [
    NftHistoryService,
    NftHistoryResolver,
    NftCreatedHistoryRecordResolver,
    NftPriceUpdatedHistoryRecordResolver,
    NftTypeOfSaleUpdatedHistoryRecordResolver,
    NftSoldHistoryRecordResolver,
  ],
  exports: [NftHistoryService],
})
export class NftHistoryModule {}
