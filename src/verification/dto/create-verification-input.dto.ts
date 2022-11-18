import { ArgsType, Field, InputType } from '@nestjs/graphql';

@ArgsType()
@InputType()
export class CreateVerificationInputDto {
  @Field(() => String)
  code: string;

  @Field(() => String)
  email: string;

  @Field(() => String)
  userId: string;
}
