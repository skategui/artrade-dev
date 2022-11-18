import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { Prop, Schema } from '@nestjs/mongoose';
import { defaultSubDocSchemaOption } from '../helpers/default-schema-option.tools';

@InputType('RoyaltiesInput')
@ObjectType()
@Schema(defaultSubDocSchemaOption)
export class Royalties {
  @Prop({ required: true })
  @Field(() => Int)
  amount: number;

  @Prop({ required: true })
  @Field(() => String)
  walletAddress: string;
}

@InputType()
export class RoyaltiesInput extends Royalties {}
