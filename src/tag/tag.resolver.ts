import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Public } from '../auth/decorators/public.decorator';
import { AppLogger } from '../logging/logging.service';
import { CreateTagInputDto } from './dto/create-tag-input.dto';
import { Tag } from './tag.model';
import { TagService } from './tag.service';

@Resolver(() => Tag)
export class TagResolver {
  constructor(private logger: AppLogger, private tagService: TagService) {
    this.logger.setContext(this.constructor.name);
  }

  /* ================= QUERY =============== */
  @Public()
  @Query(() => [Tag])
  async getAllTags(): Promise<Tag[]> {
    this.logger.verbose('getAllTags');
    return await this.tagService.getMany();
  }

  /* ================= MUTATION =============== */
  @Public()
  @Mutation(() => Tag)
  async createTag(@Args() input: CreateTagInputDto): Promise<Tag> {
    this.logger.verbose('createTag');
    return await this.tagService.create(input);
  }
}
