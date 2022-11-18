import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { AnalyticModule } from './analytic/analytic.module';
import { AuthModule } from './auth/auth.module';
import { EndpointAuthMonitorGuard } from './auth/guards/endpoint-auth-monitor.guard';
import { BlockchainModule } from './blockchain/blockchain.module';
import { CollectionModule } from './collections/collection.module';
import { ConfigModule } from './config/config.module';
import { EmailingModule } from './emailing/emailing.module';
import { GoogleModule } from './google/google.module';
import { graphqlModule } from './graphql.module';
import { LicenceModule } from './licence/licence.module';
import { mongoModule } from './mongo.module';
import { NewsFeedModule } from './newsfeed/newsfeed.module';
import { NFTModule } from './nft/nft.module';
import { s3Module } from './s3.module';
import { TagModule } from './tag/tag.module';
import { UserModule } from './user/user.module';
import { VerificationModule } from './verification/verification.module';

@Module({
  imports: [
    ConfigModule,
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    s3Module,
    mongoModule,
    graphqlModule,

    /* APPLICATION MODULES */
    AuthModule,
    UserModule,
    TagModule,
    AnalyticModule,
    CollectionModule,
    NFTModule,
    EmailingModule,
    BlockchainModule,
    GoogleModule,
    NewsFeedModule,
    VerificationModule,
    LicenceModule,
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
