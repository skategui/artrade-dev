import { ArgsType, Field, InputType, registerEnumType } from '@nestjs/graphql';
import { createPaginationArgs } from '../../helpers/pagination/pagination-args.graphql';
import { UserId } from '../../user/model/user.model';
import { NftId } from '../nft.model';

export enum ListNftInputSortFields {
  createdAt = 'createdAt',
}

registerEnumType(ListNftInputSortFields, {
  name: 'ListNftInputSortFields',
});

@InputType()
export class ListNftFilterInputDto {
  @Field(() => [String], { nullable: true })
  nftIds?: NftId[];

  @Field(() => [String], { nullable: true })
  creatorIds?: UserId[];

  @Field(() => [String], { nullable: true })
  ownerIds?: UserId[];
}

@ArgsType()
@InputType()
export class ListNftQueryArgs extends createPaginationArgs(ListNftInputSortFields) {
  @Field(() => ListNftFilterInputDto, { nullable: true })
  filter: ListNftFilterInputDto;
}
