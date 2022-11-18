import { ArgsType, Field, InputType, registerEnumType } from '@nestjs/graphql';
import { createPaginationArgs } from '../../helpers/pagination/pagination-args.graphql';
import { UserId } from '../../user/model/user.model';
import { CollectionId } from '../collection.model';

export enum ListCollectionInputSortFields {
  createdAt = 'createdAt',
}

registerEnumType(ListCollectionInputSortFields, {
  name: 'ListCollectionInputSortFields',
});

@InputType()
export class ListCollectionFilterInputDto {
  @Field(() => [String], { nullable: true, description: 'Collections should be one of these ids' })
  ids?: CollectionId[];

  @Field(() => [String], { nullable: true, description: 'Author should be one of these ids' })
  authors?: UserId[];
}

@ArgsType()
@InputType()
export class ListCollectionQueryArgs extends createPaginationArgs(ListCollectionInputSortFields) {
  @Field(() => ListCollectionFilterInputDto, { nullable: true })
  filter: ListCollectionFilterInputDto;
}
