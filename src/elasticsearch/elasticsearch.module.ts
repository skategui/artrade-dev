import { Module } from '@nestjs/common';
import { ElasticsearchModule as EsModule, ElasticsearchModuleOptions } from '@nestjs/elasticsearch';
import { ConfigModule } from '../config/config.module';
import { ConfigService } from '../config/config.service';
import { NftModule } from '../nft/nft.module';
import { NftHistoryModule } from '../nfthistory/nft-history.module';
import { UserModule } from '../user/user.module';
import { NftElasticsearchResolver } from './nft-elasticsearch.resolver';
import { NftElasticsearchService } from './nft-elasticsearch.service';
import { NftElasticsearchTester } from './nft-elasticsearch.tester';

export const esModule = EsModule.registerAsync({
  imports: [ConfigModule],
  useFactory: ({ elasticsearch: { node, apiKey } }: ConfigService): ElasticsearchModuleOptions => ({
    node,
    ...(apiKey
      ? {
          auth: { apiKey },
        }
      : {}),
  }),
  inject: [ConfigService],
});

@Module({
  imports: [esModule, NftModule, UserModule, NftHistoryModule],
  providers: [NftElasticsearchService, NftElasticsearchResolver, NftElasticsearchTester],
  exports: [NftElasticsearchService],
})
export class ElasticsearchModule {}
