import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { defaultRootDocSchemaOption } from '../helpers/default-schema-option.tools';
import { DefaultModel } from '../helpers/default.model';

// TODO Rename to a more specific name e.g. EmailVerification...

@ObjectType()
@Schema(defaultRootDocSchemaOption)
export class Verification extends DefaultModel {
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

export const VerificationSchema = SchemaFactory.createForClass(Verification);
