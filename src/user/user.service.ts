import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ForbiddenError } from 'apollo-server-express';
import DataLoader from 'dataloader';
import { keyBy } from 'lodash';
import { FilterQuery, Model } from 'mongoose';
import { v4 } from 'uuid';
import { EmailVerificationService } from '../email-verification/email-verification.service';
import { EmailingService } from '../emailing/emailing.service';
import { assertAllExisting } from '../helpers/get-or-create-dataloader';
import { MongoPagination, paginateQuery } from '../helpers/pagination/pagination';
import { hash } from '../helpers/strings.tools';
import { AppLogger } from '../logging/logging.service';
import { NftId } from '../nft/nft.model';
import { TagService } from '../tag/tag.service';
import { BaseUserService } from './base-user.service';
import { CreateUserInput } from './dto/create-user-input.dto';
import { UpdateUserInputDto } from './dto/update-user-input.dto';
import { User, UserId } from './model/user.model';
import { UserFileStorageService } from './user-file-storage.service';
import { VerifyTwitterService } from './verify-twitter.service';

@Injectable()
export class UserService extends BaseUserService<User> {
  constructor(
    @InjectModel(User.name) model: Model<User>,
    private readonly logger: AppLogger,
    private readonly tagService: TagService,
    private readonly emailingService: EmailingService,
    private readonly fileStorageService: UserFileStorageService,
    private readonly verifyTwitterService: VerifyTwitterService,
    private readonly verificationService: EmailVerificationService,
  ) {
    super(model);
    this.logger.setContext(this.constructor.name);
  }

  async getById(id: UserId): Promise<User | null> {
    return await this.model.findOne({ _id: id }).lean().exec();
  }

  async getByEmail(email: string): Promise<User | null> {
    return await this.model.findOne({ email }).lean().exec();
  }

  async getByIdOrThrow(id: UserId): Promise<User> {
    const doc = await this.getById(id);
    if (!doc) {
      throw Error(`User not found with id ${id}`);
    }
    return doc;
  }

  async getMany(filter?: UserFilter, pagination?: MongoPagination<User>): Promise<User[]> {
    this.logger.verbose('getMany');
    const mongoFilter = userFilterToMongoFilter(filter || {});
    const query = this.model.find(mongoFilter);
    const docs = await paginateQuery<User>(query, pagination).lean().exec();
    return docs;
  }

  async count(filter?: UserFilter): Promise<number> {
    this.logger.verbose('count');
    return await this.model.count(userFilterToMongoFilter(filter || {})).exec();
  }

  async getOne(filter?: UserFilter): Promise<User | null> {
    this.logger.verbose('getOne');
    const mongoFilter = userFilterToMongoFilter(filter || {});
    return await this.model.findOne(mongoFilter).exec();
  }

  async isEmailTaken(email: string): Promise<boolean> {
    const exists = await this.model.exists({ email });
    return exists ? !!exists._id : false;
  }

  async isNicknameTaken(nickname: string): Promise<boolean> {
    const exists = await this.model.exists({ nickname });
    return exists ? !!exists._id : false;
  }

  async create(input: CreateUserInput): Promise<User> {
    const userId = UserService.createUserId();
    return await this.createWithCompleteInfo(input, userId);
  }

  async createWithCompleteInfo(
    input: CreateUserInput,
    userId: string,
    avatar?: string,
  ): Promise<User> {
    const isEmailTaken = await this.isEmailTaken(input.email);
    if (isEmailTaken) {
      throw new EmailAlreadyUsedException(input.email);
    }

    const isNicknameTaken = await this.isNicknameTaken(input.nickname);
    if (isNicknameTaken) {
      throw new NicknameAlreadyUsedException(input.nickname);
    }

    const createdUser = await this.model.create({
      ...input,
      twitterVerified: false,
      _id: userId,
      inviteFriends: [],
      wallets: [],
      followers: [],
      tagsId: [],
      isOnboarded: false,
      password: hash(input.password),
      avatarUrl: avatar ? avatar : `https://avatar.tobi.sh/${input.nickname} `,
    });
    await this.emailingService.accountCreated(createdUser);
    return createdUser.toObject();
  }

  async updateUser(
    userId: UserId,
    { newPassword, currentPassword, avatarFile, bannerFile, ...form }: UpdateUserInputDto,
  ): Promise<User | null> {
    const passwordIsProvided = Boolean(currentPassword);
    if (passwordIsProvided) {
      const userCount = await this.model
        .count({ _id: userId, password: hash(currentPassword!) })
        .exec();
      if (userCount !== 1) {
        throw new ForbiddenError('Incorrect password');
      }
    }
    if (newPassword && !passwordIsProvided) {
      throw new ForbiddenError('The current password is required to change it');
    }

    const avatarUrl = avatarFile
      ? await this.fileStorageService.uploadAvatar(userId, await avatarFile)
      : undefined;

    const bannerUrl = bannerFile
      ? await this.fileStorageService.uploadBanner(userId, await bannerFile)
      : undefined;

    const result = await this.model.findOneAndUpdate(
      { _id: userId },
      {
        $set: {
          ...form,
          ...(form.tagsId ? { tags: await this.tagService.validateIdsExist(form.tagsId) } : {}),
          ...(avatarUrl ? { avatarUrl } : {}),
          ...(bannerUrl ? { bannerUrl } : {}),
          ...(newPassword ? { password: hash(newPassword) } : {}),
        },
      },
      { new: true },
    );
    this.updateLastestActivity(userId);
    return result;
  }

  async addWallet(userId: UserId, walletId: string): Promise<User | null> {
    const now = new Date();
    const result = await this.model.findOneAndUpdate(
      { _id: userId, 'wallets.walletId': { $ne: walletId } },
      {
        $addToSet: { wallets: { walletId, date: now } },
      },
      { new: true },
    );
    this.updateLastestActivity(userId);
    return result;
  }

  async follow(userId: UserId, creatorIdToFollow: UserId): Promise<void> {
    await this.model.findOneAndUpdate(
      { _id: creatorIdToFollow },
      {
        $addToSet: { followerIds: userId },
      },
      { new: true },
    );
  }

  async unfollow(userId: UserId, creatorIdToUnfollow: UserId): Promise<void> {
    await this.model.findOneAndUpdate(
      { _id: creatorIdToUnfollow },
      {
        $pull: { followerIds: userId },
      },
      { new: true },
    );
  }

  async addToBookmark(nftId: NftId, myId: UserId): Promise<void> {
    await this.model.findOneAndUpdate(
      { _id: myId },
      { $addToSet: { bookmarks: { nftId, addedAt: new Date() } } },
      { new: true },
    );
  }

  async removeFromBookmark(nftId: NftId, myId: UserId): Promise<void> {
    await this.model.findOneAndUpdate(
      { _id: myId },
      {
        $pull: { bookmarks: { nftId } },
      },
      { new: true },
    );
  }

  async invite(userId: UserId, emails: string[]): Promise<void> {
    const currentUser = await this.getByIdOrThrow(userId);
    await this.emailingService.sendInviteEmails(emails, currentUser.nickname);

    await this.model.findOneAndUpdate(
      { _id: userId },
      {
        $set: { inviteFriends: emails },
      },
      { new: true },
    );
  }

  async verifyTwitter(userId: UserId, url: string): Promise<boolean> {
    const currentUser = await this.getByIdOrThrow(userId);
    const walletAddresses = currentUser.wallets.map((wallet) => wallet.walletId);
    const isVerified = await this.verifyTwitterService.verify(url, walletAddresses);
    this.model.findOneAndUpdate({ _id: userId }, { $set: { twitterVerified: isVerified } }).exec();
    return isVerified;
  }

  async verifyEmail(email: string, code: string): Promise<User | null> {
    const verification = await this.verificationService.getByEmail(email);
    if (verification && verification.code === code) {
      const user = await this.model.findOneAndUpdate(
        { _id: verification.userId },
        { $set: { emailVerified: true } },
        { new: true },
      );
      await this.verificationService.delete(verification._id);
      return user;
    }
    return null;
  }

  async forgotPassword(email: string): Promise<boolean> {
    const user = await this.getByEmail(email);
    if (!user) {
      throw Error(`User not found with email ${email}`);
    }
    if (user.emailVerified) {
      await this.emailingService.resentEmail(user, true);
      return true;
    } else {
      throw Error(`User email is not verified`);
    }
  }

  async reinitializePassword(email: string, code: string, password: string): Promise<boolean> {
    const verification = await this.verificationService.getByEmail(email);
    if (!verification) {
      throw Error(`Invalid code verification`);
    }
    if (verification.code === code) {
      await this.model.findOneAndUpdate(
        { _id: verification.userId },
        {
          $set: {
            password: hash(password),
          },
        },
        { new: true },
      );
      await this.updateLastestActivity(verification.userId);
      await this.verificationService.delete(verification._id);
      return true;
    } else {
      throw Error(`Invalid code verification`);
    }
  }

  createDataloaderById(): DataLoader<UserId, User> {
    return new DataLoader<UserId, User>(async (userIds: UserId[]) => {
      const users = await this.getMany({ ids: userIds });
      const usersById = keyBy(users, (g) => g._id);
      return assertAllExisting(
        User.name,
        userIds,
        userIds.map((userId) => usersById[userId]),
      );
    });
  }

  static createUserId(): UserId {
    return v4();
  }

  // should be call when the user does something
  async updateLastestActivity(userId: UserId): Promise<void> {
    const now = new Date();
    await this.model.updateOne({ _id: userId }, { $set: { lastActivity: now } }).exec();
  }
}

export interface UserFilter {
  id?: UserId;
  ids?: UserId[];
  email?: string;
  nameRegexp?: string;
  nickname?: string;
  refreshJwtHash?: string;
  followedByUserId?: UserId;
  bookmarkedNftIds?: NftId[];
}

export const userFilterToMongoFilter = (filter: UserFilter): FilterQuery<User> => {
  const {
    id,
    ids,
    nameRegexp,
    nickname,
    email,
    refreshJwtHash,
    followedByUserId,
    bookmarkedNftIds,
  } = filter;
  const query: FilterQuery<User> = {};
  if (nickname) {
    query.nickname = nickname;
  }
  if (id || ids) {
    query._id = { $in: [...(ids ?? []), ...(id ? [id] : [])] };
  }
  if (nameRegexp) {
    query.$or = [
      {
        nickname: {
          $regex: nameRegexp,
          $options: 'i',
        },
      },
    ];
  }
  if (email) {
    query.email = { $regex: email, $options: 'i' };
  }
  if (refreshJwtHash) {
    query.refreshJwtHash = refreshJwtHash;
  }
  if (followedByUserId) {
    query.followerIds = followedByUserId;
  }
  if (bookmarkedNftIds) {
    query['bookmarks.nftId'] = { $in: bookmarkedNftIds };
  }
  return query;
};

export class EmailAlreadyUsedException extends HttpException {
  constructor(email: string) {
    super(`Email ${email} Already used`, HttpStatus.CONFLICT);
  }
}

export class NicknameAlreadyUsedException extends HttpException {
  constructor(nickname: string) {
    super(`Nickname ${nickname} Already used`, HttpStatus.CONFLICT);
  }
}
