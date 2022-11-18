import { ArgsType, Field, InputType } from '@nestjs/graphql';

@ArgsType()
@InputType()
export class GoogleConnectInput {
  @Field(() => String, { nullable: false })
  accessToken: string;
}
