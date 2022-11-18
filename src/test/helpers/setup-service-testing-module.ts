/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { EventEmitterModule } from '@nestjs/event-emitter';
import { getConnectionToken } from '@nestjs/mongoose';
import { TestingModule } from '@nestjs/testing';
import mongodb from 'mongodb';
import { Connection } from 'mongoose';
import { closeMongoConnection, testMongoModule } from './test-mongo.module';

process.setMaxListeners(0); // https://stackoverflow.com/q/23177262/1541141

let connection: Connection;

export type ServiceTestingModuleMeta = {
  moduleRef: TestingModule;
  afterAll: () => Promise<void>;
  connection: Connection;
  db: mongodb.Db;
};

export const serviceTestBaseImports = [EventEmitterModule.forRoot(), testMongoModule];

export const setupServiceTestingModule = (
  testingModule: TestingModule,
): ServiceTestingModuleMeta => {
  connection = testingModule.get(getConnectionToken());
  return {
    moduleRef: testingModule,
    connection,
    db: connection.db,
    afterAll: async () => {
      await connection.close();
      await closeMongoConnection();
    },
  };
};
