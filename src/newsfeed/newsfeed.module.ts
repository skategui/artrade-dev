import { forwardRef, Module } from '@nestjs/common';
import { CollectionModule } from '../collections/collection.module';
import { NFTModule } from '../nft/nft.module';
import { FileStorageModule } from '../storage/file-storage.module';
import { UserModule } from '../user/user.module';
import { NewsfeedResolver } from './newsfeed.resolver';
import { NewsfeedService } from './newsfeed.service';

@Module({
  imports: [
    forwardRef(() => NFTModule),
    forwardRef(() => UserModule),
    forwardRef(() => CollectionModule),
    FileStorageModule,
  ],
  providers: [NewsfeedService, NewsfeedResolver],
  exports: [NewsfeedService],
})
export class NewsFeedModule {}
