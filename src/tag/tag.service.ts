import { InjectModel } from '@nestjs/mongoose';
import DataLoader from 'dataloader';
import { keyBy } from 'lodash';
import { FilterQuery, Model } from 'mongoose';
import { BadInputError } from '../helpers/errors/BadInputError';
import { assertAllExisting } from '../helpers/get-or-create-dataloader';
import { MongoPagination, paginateQuery } from '../helpers/pagination/pagination';
import { AppLogger } from '../logging/logging.service';
import { CreateTagInputDto } from './dto/create-tag-input.dto';
import { Tag, TagId } from './tag.model';

export class TagService {
  constructor(private logger: AppLogger, @InjectModel(Tag.name) private model: Model<Tag>) {
    this.logger.setContext(this.constructor.name);
  }

  async create(tag: CreateTagInputDto): Promise<Tag> {
    return (await this.model.create(tag)).toObject();
  }

  async getMany(filter?: TagFilter, pagination?: MongoPagination<Tag>): Promise<Tag[]> {
    this.logger.verbose('getMany');
    const mongoFilter = filterToMongoFilter(filter || {});
    const query = this.model.find(mongoFilter).sort({ index: 1 });
    const docs = await paginateQuery<Tag>(query, pagination).lean().exec();
    return docs;
  }

  async exists(tagIds: TagId[]): Promise<boolean> {
    const result = await this.model.count({ _id: { $in: tagIds } });
    return result === tagIds.length;
  }

  createDataloaderById(): DataLoader<TagId, Tag> {
    return new DataLoader<TagId, Tag>(async (tagIds: TagId[]) => {
      const tags = await this.getMany({ ids: tagIds });
      const tagsById = keyBy(tags, (g) => g._id);
      return assertAllExisting(
        Tag.name,
        tagIds,
        tagIds.map((tagId) => tagsById[tagId]),
      );
    });
  }

  async validateIdsExist(tagIds: TagId[]): Promise<TagId[]> {
    const tags = await this.getMany({ ids: tagIds });
    const tagPerId = keyBy(tags, (g) => g._id);
    const missing = tagIds.filter((id) => !tagPerId[id]);
    if (missing.length > 0) {
      throw new BadInputError(
        `Tag with id ${missing.map((id) => `"${id}"`).join(', ')} does not exist`,
      );
    }
    return tagIds;
  }
}

export interface TagFilter {
  ids?: TagId[];
}

const filterToMongoFilter = (filter: TagFilter): FilterQuery<Tag> => {
  const { ids } = filter;
  const query: FilterQuery<Tag> = {};
  if (ids) {
    query._id = { $in: ids };
  }
  return query;
};
