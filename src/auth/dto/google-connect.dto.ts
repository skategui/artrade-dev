import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class GoogleConnectOutput {
  @Field()
  username: string;

  @Field()
  secret: Date;
}
