import { Field, InputType, Int } from '@nestjs/graphql';
import { IsInt } from 'class-validator';
import { CreateCommonNFTInput } from './create-common-nft-input.dto';

@InputType()
export class CreateNFTFixedPriceInput extends CreateCommonNFTInput {
  @IsInt()
  @Field(() => Int)
  priceInSol: number;
}
