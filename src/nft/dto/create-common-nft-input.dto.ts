import { Field, InputType, Int } from '@nestjs/graphql';
import { IsArray, ValidateNested } from 'class-validator';
import { NftCollectionId } from '../../collections/nft-collection.model';
import { TagId } from '../../tag/tag.model';
import { RoyaltiesInputDto } from './create-royalties-input.dto';

@InputType()
export class CreateCommonNftInput {
  @Field({ nullable: false })
  mintAddress: string;

  @IsArray()
  @Field(() => [String], { nullable: true })
  tagIds: TagId[];

  @Field()
  title: string;

  @Field()
  description: string;

  @Field()
  thumbnail: string;

  @Field()
  collectionId: NftCollectionId;

  @Field()
  license: string;

  @Field(() => Int)
  numberOfEdition: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Field(() => [RoyaltiesInputDto])
  royalties: RoyaltiesInputDto[];
}
