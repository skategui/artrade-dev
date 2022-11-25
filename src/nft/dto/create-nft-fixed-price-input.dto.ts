import { Field, InputType } from '@nestjs/graphql';
import { IsInt } from 'class-validator';
import { GraphQlLamportScalar } from '../../graphql/scalars/lamport.scalar';
import { LamportAmount } from '../nft.model';
import { CreateCommonNftInput } from './create-common-nft-input.dto';

@InputType()
export class CreateNftFixedPriceInput extends CreateCommonNftInput {
  @IsInt()
  @Field(() => GraphQlLamportScalar)
  price: LamportAmount;
}
