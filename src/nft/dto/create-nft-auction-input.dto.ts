import { Field, InputType, Int } from '@nestjs/graphql';
import { IsDate, IsInt } from 'class-validator';
import { CreateCommonNFTInput } from './create-common-nft-input.dto';

@InputType()
export class CreateNFTAuctionInput extends CreateCommonNFTInput {
  @IsDate()
  @Field(() => Date)
  startDate: Date;

  @IsDate()
  @Field(() => Date)
  endDate: Date;

  @IsInt()
  @Field(() => Int)
  startingPriceInSol: number;
}
