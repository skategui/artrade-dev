import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, Schema } from '@nestjs/mongoose';
import { defaultSubDocSchemaOption } from '../../helpers/default-schema-option.tools';

@ObjectType()
@Schema(defaultSubDocSchemaOption)
export class UserWallet {
  @Prop({ type: Date, required: true })
  @Field()
  date: Date;

  @Prop({ required: true })
  @Field()
  walletId: string;
}
