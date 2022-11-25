import { Field, InputType } from '@nestjs/graphql';
import { IsDate, IsInt } from 'class-validator';
import { GraphQlLamportScalar } from '../../graphql/scalars/lamport.scalar';
import { LamportAmount } from '../nft.model';
import { CreateCommonNftInput } from './create-common-nft-input.dto';

@InputType()
export class CreateNftAuctionInput extends CreateCommonNftInput {
  @IsDate()
  @Field(() => Date)
  startDate: Date;

  @IsDate()
  @Field(() => Date)
  endDate: Date;

  @IsInt()
  @Field(() => GraphQlLamportScalar)
  startingPrice: LamportAmount;
}
