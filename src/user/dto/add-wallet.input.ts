import { ArgsType, Field, InputType } from '@nestjs/graphql';
import { IsString } from 'class-validator';

@ArgsType()
@InputType()
export class AddWalletInput {
  @IsString()
  @Field({ nullable: false })
  walletId: string;
}
