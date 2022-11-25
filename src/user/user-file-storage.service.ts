import { Injectable } from '@nestjs/common';
import { FileUpload } from 'graphql-upload';
import path from 'path';
import { BadInputError } from '../helpers/errors/BadInputError';
import { AppLogger } from '../logging/logging.service';
import { FileStorageService } from '../storage/file-storage.service';
import { createAlphanumericId, getSerializedTimestamp } from '../storage/helpers';
import { UserId } from './model/user.model';

/* istanbul ignore next */
@Injectable()
export class UserFileStorageService {
  constructor(private logger: AppLogger, private readonly storageService: FileStorageService) {
    this.logger.setContext(this.constructor.name);
  }

  async uploadAvatar(userId: UserId, avatarFile: FileUpload): Promise<string> {
    const { createReadStream, filename } = avatarFile;
    try {
      return await this.storageService.put(createReadStream(), createAvatarPath(userId, filename));
    } catch (error) {
      throw new UserAvatarFileUploadFailed(error.message);
    }
  }

  async uploadBanner(userId: UserId, avatarFile: FileUpload): Promise<string> {
    const { createReadStream, filename } = avatarFile;
    try {
      return await this.storageService.put(createReadStream(), createBannerPath(userId, filename));
    } catch (error) {
      throw new UserBannerFileUploadFailed(error.message);
    }
  }
}

const createPath = (userId: UserId, originalFileName: string): string => {
  return `${userId}-${getSerializedTimestamp()}-${createAlphanumericId()}${path.extname(
    originalFileName,
  )}`;
};

const createAvatarPath = (userId: UserId, originalFileName: string): string => {
  return `user/avatar/${createPath(userId, originalFileName)}`;
};

const createBannerPath = (userId: UserId, originalFileName: string): string => {
  return `user/banner/${createPath(userId, originalFileName)}`;
};

export class UserAvatarFileUploadFailed extends BadInputError {
  constructor(message: string) {
    super(`Failed to upload user avatar file: ${message}`);
  }
}

export class UserBannerFileUploadFailed extends BadInputError {
  constructor(message: string) {
    super(`Failed to upload user banner file: ${message}`);
  }
}
