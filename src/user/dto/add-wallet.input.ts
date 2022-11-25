import { ArgsType, Field, InputType } from '@nestjs/graphql';

@ArgsType()
@InputType()
export class AddWalletInput {
  @Field({ nullable: false })
  walletId: string;
}
