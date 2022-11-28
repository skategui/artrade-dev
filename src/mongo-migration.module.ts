import { Injectable, Module, OnModuleInit } from '@nestjs/common';
import { config, database, up } from 'migrate-mongo';
import migrateMongoConfig from '../migrate-mongo-config';
import { AppLogger } from './logging/logging.service';

@Injectable()
class MongoMigrationService implements OnModuleInit {
  constructor(private readonly logger: AppLogger) {
    this.logger.setContext(this.constructor.name);
  }

  async onModuleInit(): Promise<void> {
    config.set(migrateMongoConfig as any as Partial<config.Config>);
    const { db, client } = await database.connect();
    const migrated = await up(db, client);
    migrated.forEach((fileName) => this.logger.log(`Migrated: ${fileName}`));
    await client.close();
  }
}

@Module({
  providers: [MongoMigrationService],
})
export class MongoMigrationModule {}
