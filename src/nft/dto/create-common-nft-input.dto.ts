import { Field, InputType, Int } from '@nestjs/graphql';
import { CollectionId } from 'aws-sdk/clients/rekognition';
import { IsArray, IsInt, IsString, ValidateNested } from 'class-validator';
import { TagId } from '../../tag/tag.model';
import { RoyaltiesInputDto } from './create-royalties-input.dto';

@InputType()
export class CreateCommonNFTInput {
  @IsString()
  @Field(() => String, { nullable: false })
  mintAddress: string;

  @IsArray()
  @Field(() => [String], { nullable: true })
  tagIds: TagId[];

  @IsString()
  @Field(() => String)
  title: string;

  @IsString()
  @Field(() => String)
  description: string;

  @IsString()
  @Field(() => String)
  thumbnail: string;

  @IsString()
  @Field(() => String)
  collectionId: CollectionId;

  @IsString()
  @Field(() => String)
  license: string;

  @IsInt()
  @Field(() => Int)
  numberOfEdition: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Field(() => [RoyaltiesInputDto])
  royalties: RoyaltiesInputDto[];
}
