import { ArgsType, Field, InputType, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { defaultRootDocSchemaOption } from '../../helpers/default-schema-option.tools';
import { NftId } from '../../nft/nft.model';
import { TagId } from '../../tag/tag.model';
import { CreatePayload } from '../../types/mongo-helpers';
import { BaseUser } from './base-user.model';
import { UserWallet } from './wallet.model';

export type UserId = string;

@ObjectType()
@Schema(defaultRootDocSchemaOption)
export class User extends BaseUser {
  @Prop({ required: true })
  @Field()
  nickname: string;

  @Prop({ required: true })
  @Field()
  firstName: string;

  @Prop({ required: true })
  @Field()
  lastName: string;

  @Prop()
  @Field({ nullable: false })
  birthDate?: string;

  @Prop()
  @Field(() => Boolean, { defaultValue: true })
  twitterVerified: boolean;

  @Prop()
  @Field(() => [String], { defaultValue: [] })
  inviteFriends: string[];

  @Prop()
  @Field(() => Boolean, { defaultValue: true })
  isOnboarded: boolean;

  @Prop()
  @Field({ nullable: true })
  onboardingStep?: string;

  @Prop([{ type: UserWallet, default: [] }])
  @Field(() => [UserWallet])
  wallets: UserWallet[];

  @Prop({ required: true, default: [], index: true })
  @Field(() => [String])
  tagsId: TagId[];

  @Prop()
  @Field({ nullable: true })
  biography?: string;

  @Prop()
  @Field({ nullable: true })
  twitterUrl?: string;

  @Prop()
  @Field({ nullable: true })
  instagramUrl?: string;

  @Prop({ sparse: true })
  @Field({ nullable: true })
  avatarUrl?: string;

  @Prop({ defaultValue: [], index: true })
  @Field(() => [String])
  followerIds: UserId[];

  @Prop({ defaultValue: [], index: true })
  @Field(() => [String])
  bookmarkIds: NftId[];

  @Prop()
  @Field({ nullable: true })
  lastActivity?: Date;

  @Prop()
  @Field(() => Boolean, { defaultValue: false })
  emailVerified: boolean;
}

@ArgsType()
@InputType()
export class UserInput extends User {}

export const UserSchema = SchemaFactory.createForClass(User);

export type UserCreatePayload = Omit<
  CreatePayload<User>,
  | 'twitterVerified'
  | 'inviteFriends'
  | 'isOnboarded'
  | 'wallets'
  | 'tagsId'
  | 'followerIds'
  | 'bookmarkIds'
  | 'emailVerified'
>;
