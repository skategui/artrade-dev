import { ArgsType, Field, InputType, registerEnumType } from '@nestjs/graphql';
import { GraphQlLamportScalar } from '../../graphql/scalars/lamport.scalar';
import { createPaginationArgs } from '../../helpers/pagination/pagination-args.graphql';
import { TagId } from '../../tag/tag.model';
import { UserId } from '../../user/model/user.model';
import { NftSaleKind } from '../nft-sale';
import { LamportAmount, NftId } from '../nft.model';

export enum ListNftInputSortFields {
  createdAt = 'createdAt',
}

registerEnumType(ListNftInputSortFields, {
  name: 'ListNftInputSortFields',
});

@InputType()
export class ListNftFilterInputDto {
  @Field(() => [String], { nullable: true })
  ids?: NftId[];

  @Field(() => [String], { nullable: true })
  creatorIds?: UserId[];

  @Field(() => [String], { nullable: true })
  ownerIds?: UserId[];

  @Field(() => [NftSaleKind], { nullable: true })
  saleKinds?: NftSaleKind[];

  @Field(() => [String], { nullable: true })
  tagIds?: TagId[];

  @Field(() => GraphQlLamportScalar, { nullable: true })
  minPrice?: LamportAmount;

  @Field(() => GraphQlLamportScalar, { nullable: true })
  maxPrice?: LamportAmount;
}

@ArgsType()
@InputType()
export class ListNftQueryArgs extends createPaginationArgs(ListNftInputSortFields) {
  @Field(() => ListNftFilterInputDto, { nullable: true })
  filter: ListNftFilterInputDto;
}
