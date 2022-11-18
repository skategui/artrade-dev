import { Field, ObjectType } from '@nestjs/graphql';
import { NewsItem } from '../news-item.model';

@ObjectType()
export class NewsfeedOutput {
  @Field(() => [NewsItem])
  items: NewsItem[];
}
