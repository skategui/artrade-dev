import { Field, ObjectType } from '@nestjs/graphql';
import { Prop } from '@nestjs/mongoose';
import { AuthZ } from '../../auth/authz/authz.decorator';
import { DefaultModel } from '../../helpers/default.model';

@ObjectType({ isAbstract: true })
@AuthZ({ rules: ['BaseUserDocProtectedFields'] })
export abstract class BaseUser extends DefaultModel {
  @Prop({ required: true, unique: true })
  @Field({ nullable: false })
  email: string;

  @Prop({ required: true, select: false })
  password: string;

  @Prop({ select: false })
  refreshJwtHash?: string;
}
