import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { defaultRootDocSchemaOption } from '../helpers/default-schema-option.tools';
import { DefaultModel } from '../helpers/default.model';
import { TagId } from '../tag/tag.model';
import { UserId } from '../user/model/user.model';

export type CollectionId = string;

@ObjectType()
@Schema(defaultRootDocSchemaOption)
export class CollectionNFT extends DefaultModel {
  @Prop({ required: true, unique: true })
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

  @Prop()
  @Field(() => String, { nullable: true })
  thumbnail?: string;
}

export const CollectionNFTSchema = SchemaFactory.createForClass(CollectionNFT);
