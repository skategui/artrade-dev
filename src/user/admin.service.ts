import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { AppLogger } from '../logging/logging.service';
import { BaseUserService } from './base-user.service';
import { Admin, AdminId } from './model/admin.model';

@Injectable()
export class AdminService extends BaseUserService<Admin> {
  constructor(@InjectModel(Admin.name) model: Model<Admin>, private readonly logger: AppLogger) {
    super(model);
    this.logger.setContext(this.constructor.name);
  }

  async getOne(filter?: AdminFilter): Promise<Admin | null> {
    this.logger.verbose('getOne');
    const mongoFilter = adminFilterToMongoFilter(filter || {});
    return await this.model.findOne(mongoFilter).exec();
  }
}

export interface AdminFilter {
  id?: AdminId;
}

export const adminFilterToMongoFilter = (filter: AdminFilter): FilterQuery<Admin> => {
  const { id } = filter;
  const query: FilterQuery<Admin> = {};
  if (id) {
    query._id = id;
  }
  return query;
};
