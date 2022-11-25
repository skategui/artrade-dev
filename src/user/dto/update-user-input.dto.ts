import { ArgsType, Field, InputType, PartialType, PickType } from '@nestjs/graphql';
import { FileUpload, GraphQLUpload } from 'graphql-upload';
import { UserInput } from '../model/user.model';

export const updateUserInputDtoKeys: (keyof UserInput)[] = [
  'email',
  'nickname',
  'firstName',
  'lastName',
  'birthDate',
  'biography',
  'twitterUrl',
  'tagsId',
  'bannerUrl',
  'instagramUrl', // if you wish to have other field from the user model available to update, add it here
];

@ArgsType()
@InputType()
export class UpdateUserInputDto extends PartialType(PickType(UserInput, updateUserInputDtoKeys)) {
  @Field(() => GraphQLUpload, { nullable: true })
  avatarFile?: Promise<FileUpload>;

  // if we have a page to update the password of the user
  @Field({ nullable: true })
  newPassword?: string;

  @Field({ nullable: true })
  currentPassword?: string;

  @Field(() => GraphQLUpload, { nullable: true })
  bannerFile?: Promise<FileUpload>;
}
