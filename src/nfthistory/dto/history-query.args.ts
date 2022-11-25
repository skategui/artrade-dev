import { ArgsType, Field, InputType, registerEnumType } from '@nestjs/graphql';
import { createPaginationArgs } from '../../helpers/pagination/pagination-args.graphql';
import { NftId } from '../../nft/nft.model';

export enum HistoryInputSortFields {
  createdAt = 'createdAt',
}

registerEnumType(HistoryInputSortFields, {
  name: 'HistoryInputSortFields',
});

@InputType()
export class NftHistoryFilterInput {
  @Field(() => String)
  nftIds?: NftId[];
}

@ArgsType()
@InputType()
export class HistoryQueryArgs extends createPaginationArgs(HistoryInputSortFields) {
  @Field({ nullable: true })
  filter?: NftHistoryFilterInput;
}
