import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Prop, Schema } from '@nestjs/mongoose';
import { defaultSubDocSchemaOption } from '../helpers/default-schema-option.tools';
import { UserId } from '../user/model/user.model';

@ObjectType()
@Schema(defaultSubDocSchemaOption)
export class Offer {
  @Prop({ type: Date, required: true })
  @Field()
  date: Date;

  @Prop({ required: true })
  @Field()
  userId: UserId;

  @Prop({ required: true })
  @Field(() => Int)
  amount: number;
}
