import { ArgsType, Field } from '@nestjs/graphql';
import { GraphQlLamportScalar } from '../../graphql/scalars/lamport.scalar';
import { NftSaleKind } from '../../nft/nft-sale';
import { LamportAmount } from '../../nft/nft.model';
import { TagId } from '../../tag/tag.model';

@ArgsType()
export class NftSearchArgs {
  @Field({ nullable: true })
  titleOrDescription?: string;

  @Field(() => [NftSaleKind], { nullable: true })
  saleKinds?: NftSaleKind[];

  @Field(() => GraphQlLamportScalar, { nullable: true })
  maxPrice?: LamportAmount;

  @Field(() => GraphQlLamportScalar, { nullable: true })
  minPrice?: LamportAmount;

  @Field(() => [String], { nullable: true })
  tagIds?: TagId[];

  @Field({ nullable: true })
  page?: number;
}
