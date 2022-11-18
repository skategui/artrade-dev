import { ArgsType, Field, InputType, registerEnumType } from '@nestjs/graphql';
import { createPaginationArgs } from '../../helpers/pagination/pagination-args.graphql';
import { UserId } from '../model/user.model';

export enum ListUserInputSortFields {
  nickname = 'nickname',
  createdAt = 'createdAt',
}

registerEnumType(ListUserInputSortFields, {
  name: 'ListUserInputSortFields',
});

@InputType()
export class ListUserFilterInputDto {
  @Field(() => String, { nullable: true, description: 'User name contain this' })
  name?: string;

  @Field(() => String, { nullable: true, description: 'User name matches this regexp' })
  nameRegexp?: string;

  @Field(() => String, { nullable: true, description: 'User email contain this' })
  email?: string;

  @Field(() => [String], { nullable: true, description: 'User with one of these ids' })
  ids?: UserId[];
}

@ArgsType()
@InputType()
export class ListUserQueryArgs extends createPaginationArgs(ListUserInputSortFields) {
  @Field(() => ListUserFilterInputDto, { nullable: true })
  filter: ListUserFilterInputDto;
}
