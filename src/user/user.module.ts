import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EmailingModule } from '../emailing/emailing.module';
import { NFTModule } from '../nft/nft.module';
import { FileStorageModule } from '../storage/file-storage.module';
import { TagModule } from '../tag/tag.module';
import { VerificationModule } from '../verification/verification.module';
import { AdminService } from './admin.service';
import { Admin, AdminSchema } from './model/admin.model';
import { User, UserSchema } from './model/user.model';
import { UserFileStorageService } from './user-file-storage.service';
import { UserResolver } from './user.resolver';
import { UserService } from './user.service';
import { VerifyTwitterService } from './verify-twitter.service';

@Module({
  imports: [
    forwardRef(() => EmailingModule),
    forwardRef(() => NFTModule),
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
  ],
  exports: [UserService, AdminService],
})
export class UserModule {}
