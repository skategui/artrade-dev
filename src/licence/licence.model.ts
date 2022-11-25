import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { defaultRootDocSchemaOption } from '../helpers/default-schema-option.tools';
import { DefaultModel } from '../helpers/default.model';

export type LicenceId = string;

@ObjectType()
@Schema(defaultRootDocSchemaOption)
export class Licence extends DefaultModel {
  @Prop({ required: true, unique: true })
  @Field()
  name: string;
}

export const LicenceSchema = SchemaFactory.createForClass(Licence);
