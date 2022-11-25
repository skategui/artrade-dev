import { forwardRef, Module } from '@nestjs/common';
import { NftCollectionModule } from '../collections/nft-collection.module';
import { ElasticsearchModule } from '../elasticsearch/elasticsearch.module';
import { NftModule } from '../nft/nft.module';
import { NftHistoryModule } from '../nfthistory/nft-history.module';
import { FileStorageModule } from '../storage/file-storage.module';
import { UserModule } from '../user/user.module';
import { NewsfeedResolver } from './newsfeed.resolver';
import { NewsfeedService } from './newsfeed.service';

@Module({
  imports: [
    forwardRef(() => NftModule),
    forwardRef(() => UserModule),
    forwardRef(() => NftCollectionModule),
    FileStorageModule,
    ElasticsearchModule,
    NftHistoryModule,
  ],
  providers: [NewsfeedService, NewsfeedResolver],
  exports: [NewsfeedService],
})
export class NewsFeedModule {}
