import { ArgsType, Field, InputType, registerEnumType } from '@nestjs/graphql';
import { createPaginationArgs } from '../../helpers/pagination/pagination-args.graphql';
import { UserId } from '../../user/model/user.model';
import { NftCollectionId } from '../nft-collection.model';

export enum ListCollectionInputSortFields {
  createdAt = 'createdAt',
}

registerEnumType(ListCollectionInputSortFields, {
  name: 'ListCollectionInputSortFields',
});

@InputType()
export class ListCollectionFilterInputDto {
  @Field(() => [String], { nullable: true, description: 'Collections should be one of these ids' })
  ids?: NftCollectionId[];

  @Field(() => [String], { nullable: true, description: 'Author should be one of these ids' })
  creatorIds?: UserId[];
}

@ArgsType()
@InputType()
export class ListCollectionQueryArgs extends createPaginationArgs(ListCollectionInputSortFields) {
  @Field(() => ListCollectionFilterInputDto, { nullable: true })
  filter: ListCollectionFilterInputDto;
}
