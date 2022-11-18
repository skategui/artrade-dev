import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsInt, IsString } from 'class-validator';
import { defaultRootDocSchemaOption } from '../helpers/default-schema-option.tools';
import { DefaultModel } from '../helpers/default.model';

export type TagId = string;

@ObjectType()
@Schema(defaultRootDocSchemaOption)
export class Tag extends DefaultModel {
  @Prop({ required: true, unique: true })
  @Field(() => String)
  @IsString()
  name: string;

  @Prop({ required: true })
  @Field(() => Int)
  @IsInt()
  index: number;
}

export const TagSchema = SchemaFactory.createForClass(Tag);
