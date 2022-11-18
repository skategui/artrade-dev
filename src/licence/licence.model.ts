import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsString } from 'class-validator';
import { defaultRootDocSchemaOption } from '../helpers/default-schema-option.tools';
import { DefaultModel } from '../helpers/default.model';

export type LicenceId = string;

@ObjectType()
@Schema(defaultRootDocSchemaOption)
export class Licence extends DefaultModel {
  @Prop({ required: true, unique: true })
  @Field(() => String)
  @IsString()
  name: string;
}

export const LicenceSchema = SchemaFactory.createForClass(Licence);
