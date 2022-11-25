import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VerificationModule } from '../email-verification/email-verification.module';
import { EmailingModule } from '../emailing/emailing.module';
import { NftModule } from '../nft/nft.module';
import { FileStorageModule } from '../storage/file-storage.module';
import { TagModule } from '../tag/tag.module';
import { AdminService } from './admin.service';
import { BookmarkResolver } from './bookmark.resolver';
import { Admin, AdminSchema } from './model/admin.model';
import { User, UserSchema } from './model/user.model';
import { UserFileStorageService } from './user-file-storage.service';
import { UserResolver } from './user.resolver';
import { UserService } from './user.service';
import { VerifyTwitterService } from './verify-twitter.service';

@Module({
  imports: [
    forwardRef(() => EmailingModule),
    forwardRef(() => NftModule),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Admin.name, schema: AdminSchema },
    ]),
    TagModule,
    EmailingModule,
    FileStorageModule,
    VerificationModule,
  ],
  providers: [
    UserService,
    AdminService,
    UserResolver,
    UserFileStorageService,
    VerifyTwitterService,
    BookmarkResolver,
  ],
  exports: [UserService, AdminService],
})
export class UserModule {}
