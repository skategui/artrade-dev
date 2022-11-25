import { ArgsType, Field, InputType, Int } from '@nestjs/graphql';
import { MaxLength, MinLength } from 'class-validator';

@ArgsType()
@InputType()
export class CreateTagInputDto {
  @MinLength(2)
  @MaxLength(30)
  @Field({ nullable: false })
  name: string;

  @Field(() => Int, { nullable: false })
  index: number;
}
