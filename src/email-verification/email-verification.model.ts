import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { defaultRootDocSchemaOption } from '../helpers/default-schema-option.tools';
import { DefaultModel } from '../helpers/default.model';

@ObjectType()
@Schema(defaultRootDocSchemaOption)
export class EmailVerification extends DefaultModel {
  @Prop()
  @Field(() => String)
  code: string;

  @Prop()
  @Field(() => String)
  email: string;

  @Prop()
  @Field(() => String)
  userId: string;
}

export const EmailVerificationSchema = SchemaFactory.createForClass(EmailVerification);
