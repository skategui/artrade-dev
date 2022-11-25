import { ArgsType, Field, InputType } from '@nestjs/graphql';
import { IsArray } from 'class-validator';
import { TagId } from '../../tag/tag.model';

@ArgsType()
@InputType()
export class CreateCollectionInput {
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
}
