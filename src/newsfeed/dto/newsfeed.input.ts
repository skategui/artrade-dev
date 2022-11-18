import { ArgsType, Field, InputType, Int } from '@nestjs/graphql';
import { TagId } from '../../tag/tag.model';

@InputType()
export class NewsfeedFilterInput {
  @Field(() => [String], { nullable: true })
  tagsIds?: TagId[];
}

@ArgsType()
export class NewsfeedQueryArgs {
  @Field(() => NewsfeedFilterInput, { nullable: true })
  filter?: NewsfeedFilterInput;

  @Field(() => Int, { nullable: true })
  page?: number;
}
