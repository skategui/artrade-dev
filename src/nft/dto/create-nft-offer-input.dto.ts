import { InputType } from '@nestjs/graphql';
import { CreateCommonNftInput } from './create-common-nft-input.dto';

@InputType()
export class CreateNftOfferInput extends CreateCommonNftInput {
  // add specific fields related to offer here
}
