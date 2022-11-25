import { ArgsType, Field, InputType } from '@nestjs/graphql';
import { IsEmail, Matches, MaxLength, MinLength } from 'class-validator';

@ArgsType()
@InputType()
export class CreateUserInput {
  @MinLength(8)
  @MaxLength(30)
  @Field({ nullable: false })
  @Matches(/^.*(?=.{8,})(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!#$%&?@^"/\-+=*]).*$/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter and one number. Password length must be at least 8 characters.',
  })
  password: string;

  @MaxLength(50)
  @IsEmail()
  @Field({ nullable: false })
  email: string;

  @MaxLength(50)
  @Field({ nullable: false })
  nickname: string;

  @MaxLength(50)
  @Field({ nullable: true })
  firstName?: string;

  @Field({ nullable: true })
  @MaxLength(50)
  lastName?: string;

  @MaxLength(50)
  @Field({ nullable: true })
  birthDate?: string;
}
