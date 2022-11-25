import { Field, Int, InterfaceType, ObjectType, registerEnumType } from '@nestjs/graphql';
import { Prop, Schema } from '@nestjs/mongoose';
import {
  defaultRootDocWithDiscriminatorSchemaOption,
  defaultSubDocWithDiscriminatorSchemaOption,
} from '../../helpers/default-schema-option.tools';
import { DefaultModel } from '../../helpers/default.model';
import { NftSaleKind } from '../../nft/nft-sale';
import { NftId } from '../../nft/nft.model';
import { UserId } from '../../user/model/user.model';

export enum NftHistoryRecordKind {
  Created = 'Created',
  Sold = 'Sold',
  PriceUpdated = 'PriceUpdated',
  TypeOfSaleUpdated = 'TypeOfSaleUpdated',
}

registerEnumType(NftHistoryRecordKind, {
  name: 'NftHistoryRecordKind',
});

const resolveType = (value: NftHistoryRecord) => {
  switch (value.kind) {
    case NftHistoryRecordKind.Created:
      return NftCreatedHistoryRecord;
    case NftHistoryRecordKind.Sold:
      return NftSoldHistoryRecord;
    case NftHistoryRecordKind.PriceUpdated:
      return NftPriceUpdatedHistoryRecord;
    case NftHistoryRecordKind.TypeOfSaleUpdated:
      return NftTypeOfSaleUpdatedHistoryRecord;
    default:
      throw Error(`Unknown ActivityType kind ${(value as any).kind}`);
  }
};

@InterfaceType({ resolveType })
@Schema({ ...defaultRootDocWithDiscriminatorSchemaOption, discriminatorKey: 'kind' })
export class BaseNftHistoryRecord extends DefaultModel {
  @Prop({ required: true })
  @Field(() => String)
  nftId: NftId;

  @Field()
  kind: NftHistoryRecordKind;
}

@ObjectType({ implements: BaseNftHistoryRecord })
@Schema(defaultSubDocWithDiscriminatorSchemaOption)
export class NftCreatedHistoryRecord extends BaseNftHistoryRecord {
  kind = NftHistoryRecordKind.Created as const;

  @Prop({ required: true })
  @Field()
  ownerId: UserId;
}

@ObjectType({ implements: BaseNftHistoryRecord })
@Schema(defaultSubDocWithDiscriminatorSchemaOption)
export class NftSoldHistoryRecord extends BaseNftHistoryRecord {
  kind = NftHistoryRecordKind.Sold as const;

  @Prop({ required: true })
  @Field(() => Int)
  price: number;

  @Prop({ required: true })
  @Field(() => String)
  sellerId: UserId;

  @Prop({ required: true })
  @Field(() => String)
  buyerId: UserId;
}

@ObjectType({ implements: BaseNftHistoryRecord })
@Schema(defaultSubDocWithDiscriminatorSchemaOption)
export class NftPriceUpdatedHistoryRecord extends BaseNftHistoryRecord {
  kind = NftHistoryRecordKind.PriceUpdated as const;

  @Prop({ required: true })
  @Field(() => Int)
  price: number;

  @Prop({ required: true })
  @Field(() => String)
  ownerId: UserId;
}

@ObjectType({ implements: BaseNftHistoryRecord })
@Schema(defaultSubDocWithDiscriminatorSchemaOption)
export class NftTypeOfSaleUpdatedHistoryRecord extends BaseNftHistoryRecord {
  kind = NftHistoryRecordKind.TypeOfSaleUpdated as const;

  @Prop({ required: true })
  @Field(() => String)
  ownerId: UserId;

  @Prop({ required: true })
  @Field()
  typeOfSale: NftSaleKind;
}

export type NftHistoryRecord =
  | NftCreatedHistoryRecord
  | NftSoldHistoryRecord
  | NftPriceUpdatedHistoryRecord
  | NftTypeOfSaleUpdatedHistoryRecord;

export type NftHistoryRecordKindToClass<K extends NftHistoryRecordKind> =
  | (NftHistoryRecordKind.Created extends K ? NftCreatedHistoryRecord : never)
  | (NftHistoryRecordKind.Sold extends K ? NftSoldHistoryRecord : never)
  | (NftHistoryRecordKind.PriceUpdated extends K ? NftPriceUpdatedHistoryRecord : never)
  | (NftHistoryRecordKind.TypeOfSaleUpdated extends K ? NftTypeOfSaleUpdatedHistoryRecord : never);
