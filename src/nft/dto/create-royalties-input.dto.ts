import { ArgsType, InputType, PickType } from '@nestjs/graphql';
import { RoyaltiesInput } from '../royalties.model';

@ArgsType()
@InputType()
export class RoyaltiesInputDto extends PickType(RoyaltiesInput, ['amount', 'walletAddress']) {}
