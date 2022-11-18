import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { UserAuthTrait } from '../auth/auth.service';
import { hash } from '../helpers/strings.tools';
import { BaseUser } from './model/base-user.model';
import { UserId } from './model/user.model';

@Injectable()
export abstract class BaseUserService<U extends BaseUser = BaseUser> implements UserAuthTrait<U> {
  constructor(protected readonly model: Model<U>) {}

  async tryLoginByEmailAndPassword(email: string, password: string): Promise<U | null> {
    return await this.model
      .findOneAndUpdate(
        { email, password: hash(password) },
        { $set: { lastLoginDate: new Date() } },
        { new: true },
      )
      .exec();
  }

  async updateJwtHash(userId: UserId, hash: string): Promise<void> {
    await this.model.updateOne({ _id: userId }, { $set: { refreshJwtHash: hash } }).exec();
  }

  abstract getOne(filter?: BaseUserFilter): Promise<U | null>;
}

export interface BaseUserFilter {
  id?: UserId;
}
