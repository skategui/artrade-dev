import { ArgsType, Field, InputType } from '@nestjs/graphql';
import { MaxLength } from 'class-validator';
import { NftId } from '../../nft/nft.model';
import { ListEventsPossible } from '../types';

@ArgsType()
@InputType()
export class PushEventInputDto {
  @Field(() => ListEventsPossible, { nullable: false })
  key: ListEventsPossible;

  @MaxLength(50)
  @Field(() => String, { nullable: true })
  nftId?: NftId;

  @MaxLength(500)
  @Field(() => String, { nullable: true })
  extra?: string;
}
