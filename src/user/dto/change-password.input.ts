import { ArgsType, Field, InputType } from '@nestjs/graphql';
import { IsEmail } from 'class-validator';

@ArgsType()
@InputType()
export class ChangePasswordInput {
  @IsEmail()
  @Field()
  email: string;

  @Field()
  code: string;

  @Field()
  password: string;
}
