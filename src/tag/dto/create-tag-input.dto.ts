import { ArgsType, Field, InputType, Int } from '@nestjs/graphql';
import { IsInt, IsString, MaxLength, MinLength } from 'class-validator';

@ArgsType()
@InputType()
export class CreateTagInputDto {
  @IsString()
  @MinLength(2)
  @MaxLength(30)
  @Field(() => String, { nullable: false })
  name: string;

  @IsInt()
  @Field(() => Int, { nullable: false })
  index: number;
}
