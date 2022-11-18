import { ArgsType, Field, InputType } from '@nestjs/graphql';
import { ArrayNotEmpty, IsEmail } from 'class-validator';

@ArgsType()
@InputType()
export class InviteInput {
  @ArrayNotEmpty()
  @IsEmail({}, { each: true })
  @Field(() => [String], { nullable: false })
  emails: string[];
}
