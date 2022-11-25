import { ArgsType, Field, Int, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Long } from 'mongodb';
import { NftCollectionId } from '../collections/nft-collection.model';
import { defaultRootDocSchemaOption } from '../helpers/default-schema-option.tools';
import { DefaultModel } from '../helpers/default.model';
import { TagId } from '../tag/tag.model';
import { CreatePayload } from '../types/mongo-helpers';
import { UserId } from '../user/model/user.model';
import { BaseNftSale, NftSale, registerNftSaleSchemas } from './nft-sale';
import { Royalties } from './royalties.model';

export type NftId = string;
export type LamportAmount = Long;

@ObjectType()
@Schema(defaultRootDocSchemaOption)
export class Nft extends DefaultModel {
  @Prop({ required: true, dunique: true })
  @Field(() => String)
  mintAddress: string;

  @Prop({ required: true, default: [], index: true })
  @Field(() => [String])
  tagIds: TagId[];

  @Prop({ required: true, index: true })
  @Field(() => String)
  creatorId: UserId;

  @Prop({ required: true })
  @Field(() => String)
  title: string;

  @Prop({ required: true })
  @Field(() => String)
  description: string;

  @Prop({ required: true })
  @Field(() => String)
  thumbnail: string;

  @Prop()
  @Field(() => String, { nullable: true })
  ownerId?: UserId; // not set when the NFT is created but not bought yet

  @Prop({ required: true })
  @Field(() => String)
  collectionId: NftCollectionId;

  @Prop({ required: true })
  @Field(() => String)
  license: string;

  @Prop({ required: true })
  @Field(() => Int)
  numberOfEdition: number;

  @Prop({ required: true })
  @Field(() => [Royalties], { defaultValue: [] })
  royalties: Royalties[];

  @Prop({ required: true, type: BaseNftSale })
  @Field(() => BaseNftSale)
  sale: NftSale;

  @Prop()
  @Field(() => Int)
  viewCount: number;
}

export type NftCreatePayload = CreatePayload<Nft, 'tagIds' | 'royalties'>;

@ArgsType()
export class NftInput extends Nft {}

export const NftSchema = SchemaFactory.createForClass(Nft);

registerNftSaleSchemas(NftSchema.path('sale') as any);
