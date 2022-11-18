import { InjectModel } from '@nestjs/mongoose';
import DataLoader from 'dataloader';
import { keyBy } from 'lodash';
import { FilterQuery, Model } from 'mongoose';
import { BadInputError } from '../helpers/errors/BadInputError';
import { assertAllExisting } from '../helpers/get-or-create-dataloader';
import { MongoPagination, paginateQuery } from '../helpers/pagination/pagination';
import { AppLogger } from '../logging/logging.service';
import { Licence, LicenceId } from './licence.model';

export class LicenceService {
  constructor(private logger: AppLogger, @InjectModel(Licence.name) private model: Model<Licence>) {
    this.logger.setContext(this.constructor.name);
  }

  async create(name: string): Promise<Licence> {
    return (await this.model.create({ name })).toObject();
  }

  async getMany(filter?: TagFilter, pagination?: MongoPagination<Licence>): Promise<Licence[]> {
    this.logger.verbose('getMany');
    const mongoFilter = filterToMongoFilter(filter || {});
    const query = this.model.find(mongoFilter);
    const docs = await paginateQuery<Licence>(query, pagination).lean().exec();
    return docs;
  }

  async exists(licenceIds: LicenceId[]): Promise<boolean> {
    const result = await this.model.count({ _id: { $in: licenceIds } });
    return result === licenceIds.length;
  }

  createDataloaderById(): DataLoader<LicenceId, Licence> {
    return new DataLoader<LicenceId, Licence>(async (licenceIds: LicenceId[]) => {
      const licences = await this.getMany({ ids: licenceIds });
      const licencesById = keyBy(licences, (g) => g._id);
      return assertAllExisting(
        Licence.name,
        licenceIds,
        licenceIds.map((licenceId) => licencesById[licenceId]),
      );
    });
  }

  async validateIdsExist(licenceIds: LicenceId[]): Promise<LicenceId[]> {
    const licences = await this.getMany({ ids: licenceIds });
    const licencesPerId = keyBy(licences, (g) => g._id);
    const missing = licenceIds.filter((id) => !licencesPerId[id]);
    if (missing.length > 0) {
      throw new BadInputError(
        `Licence with id ${missing.map((id) => `"${id}"`).join(', ')} does not exist`,
      );
    }
    return licenceIds;
  }
}

export interface TagFilter {
  ids?: LicenceId[];
}

const filterToMongoFilter = (filter: TagFilter): FilterQuery<Licence> => {
  const { ids } = filter;
  const query: FilterQuery<Licence> = {};
  if (ids) {
    query._id = { $in: ids };
  }
  return query;
};
