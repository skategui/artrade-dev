import { ArgsType, Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

@ArgsType()
@InputType()
export class CreateUserInput {
  @IsString()
  @MinLength(8)
  @MaxLength(30)
  @Field(() => String, { nullable: false })
  @Matches(/^.*(?=.{8,})(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!#$%&?@^"/\-+=*]).*$/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter and one number. Password length must be at least 8 characters.',
  })
  password: string;

  @MaxLength(50)
  @IsEmail()
  @Field(() => String, { nullable: false })
  email: string;

  @MaxLength(50)
  @IsString()
  @Field(() => String, { nullable: false })
  nickname: string;

  @MaxLength(50)
  @IsString()
  @Field(() => String, { nullable: false })
  firstName: string;

  @Field(() => String, { nullable: false })
  @MaxLength(50)
  @IsString()
  lastName: string;

  @IsOptional()
  @MaxLength(50)
  @Field({ nullable: true })
  birthDate?: string;
}
