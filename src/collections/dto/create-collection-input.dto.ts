import { ArgsType, Field, InputType } from '@nestjs/graphql';
import { IsArray, IsString } from 'class-validator';
import { TagId } from '../../tag/tag.model';

@ArgsType()
@InputType()
export class CreateCollectionInput {
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
}
