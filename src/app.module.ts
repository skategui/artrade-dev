import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { AnalyticModule } from './analytic/analytic.module';
import { AuthModule } from './auth/auth.module';
import { EndpointAuthMonitorGuard } from './auth/guards/endpoint-auth-monitor.guard';
import { BlockchainModule } from './blockchain/blockchain.module';
import { NftCollectionModule } from './collections/nft-collection.module';
import { ConfigModule } from './config/config.module';
import { ElasticsearchModule } from './elasticsearch/elasticsearch.module';
import { VerificationModule } from './email-verification/email-verification.module';
import { EmailingModule } from './emailing/emailing.module';
import { GoogleModule } from './google/google.module';
import { graphqlModule } from './graphql/graphql.module';
import './helpers/lodash-mixins/register-lodash-mixins';
import { LicenceModule } from './licence/licence.module';
import { MongoMigrationModule } from './mongo-migration.module';
import { mongoModule } from './mongo.module';
import { NewsFeedModule } from './newsfeed/newsfeed.module';
import { NftModule } from './nft/nft.module';
import { NftHistoryModule } from './nfthistory/nft-history.module';
import { TagModule } from './tag/tag.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    ConfigModule,
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    mongoModule,
    graphqlModule,
    MongoMigrationModule,

    /* APPLICATION MODULES */
    AuthModule,
    UserModule,
    TagModule,
    AnalyticModule,
    NftCollectionModule,
    NftModule,
    EmailingModule,
    BlockchainModule,
    GoogleModule,
    NewsFeedModule,
    VerificationModule,
    LicenceModule,
    NftHistoryModule,
    ElasticsearchModule,
  ],
  providers: [
    {
      // Make sure any endpoint is protected by an auth policy.
      provide: APP_GUARD,
      useClass: EndpointAuthMonitorGuard,
    },
  ],
})
export class AppModule {}

export class AppStartedEvent {
  static symbol = Symbol(AppStartedEvent.name);
  baseUrl: URL;
}
