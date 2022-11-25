import { ArgsType, Field, InputType } from '@nestjs/graphql';

@ArgsType()
@InputType()
export class CreateVerificationInputDto {
  @Field()
  code: string;

  @Field()
  email: string;

  @Field()
  userId: string;
}
