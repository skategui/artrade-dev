import { InputType } from '@nestjs/graphql';
import { CreateCommonNFTInput } from './create-common-nft-input.dto';

@InputType()
export class CreateNFTOfferInput extends CreateCommonNFTInput {
  // add specific fields related to offer here
}
