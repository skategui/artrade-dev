import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { Prop, Schema } from '@nestjs/mongoose';
import { Long } from 'mongodb';
import { GraphQlLamportScalar } from '../graphql/scalars/lamport.scalar';
import { defaultSubDocSchemaOption } from '../helpers/default-schema-option.tools';
import { LamportAmount } from './nft.model';

@InputType('RoyaltiesInput')
@ObjectType()
@Schema(defaultSubDocSchemaOption)
export class Royalties {
  @Prop({ required: true, type: Long })
  @Field(() => GraphQlLamportScalar)
  amount: LamportAmount;

  @Prop({ required: true })
  @Field(() => String)
  walletAddress: string;
}

@InputType()
export class RoyaltiesInput extends Royalties {}
