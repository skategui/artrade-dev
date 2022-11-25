import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, Schema } from '@nestjs/mongoose';
import { defaultSubDocSchemaOption } from '../../helpers/default-schema-option.tools';
import { NftId } from '../../nft/nft.model';

@ObjectType()
@Schema(defaultSubDocSchemaOption)
export class Bookmark {
  @Prop({ required: true })
  @Field()
  addedAt: Date;

  @Prop({ required: true })
  @Field()
  nftId: NftId;
}
