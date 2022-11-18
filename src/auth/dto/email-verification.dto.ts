import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class EmailVerificationOutput {
  @Field()
  destination: string;

  @Field()
  deliveryMedium: Date;

  @Field()
  attributeName: Date;
}
