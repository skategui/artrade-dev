import { ArgsType, Field, InputType, registerEnumType } from '@nestjs/graphql';
import { createPaginationArgs } from '../../helpers/pagination/pagination-args.graphql';
import { TagId } from '../../tag/tag.model';
import { UserId } from '../model/user.model';

export enum UserSortFields {
  nickname = 'nickname',
  createdAt = 'createdAt',
}

registerEnumType(UserSortFields, { name: 'userSortFields' });

@InputType()
export class UsersQueryFilterInput {
  @Field(() => [String], { nullable: true })
  ids?: UserId[];

  @Field({ nullable: true })
  email?: string;

  @Field({ nullable: true })
  nameRegexp?: string;

  @Field(() => [String], { nullable: true })
  genreIds?: TagId[];
}

@ArgsType()
export class UsersQueryArgs extends createPaginationArgs(UserSortFields) {
  @Field({ nullable: true })
  filter?: UsersQueryFilterInput;
}
