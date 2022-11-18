import { MongooseModule, MongooseModuleFactoryOptions } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod: MongoMemoryServer;

export const testMongoModule = MongooseModule.forRootAsync({
  useFactory: async (): Promise<MongooseModuleFactoryOptions> => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    return {
      uri,
    };
  },
});

export const closeMongoConnection = async (): Promise<void> => {
  if (mongod) {
    await mongod.stop();
  }
};
