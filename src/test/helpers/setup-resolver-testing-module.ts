/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { graphqlUploadExpress } from 'graphql-upload';
import { mapValues, reduce } from 'lodash';
import portFinder from 'portfinder';
import request from 'supertest';
import { ConfigService } from '../../config/config.service';
import { graphqlModule, GRAPHQL_PATH } from '../../graphql.module';
import {
  serviceTestBaseImports,
  ServiceTestingModuleMeta,
  setupServiceTestingModule,
} from './setup-service-testing-module';

const listenToFirstAvailablePort = async (app: INestApplication): Promise<number> => {
  let freePortWasFound = false;
  do {
    // portFinder is not atomic and we must try until we find a port
    // that is not taken at the last minute.
    const port = await portFinder.getPortPromise();
    try {
      await app.listen(port);
      freePortWasFound = true;
      return port;
    } catch (error) {
      if (error.code === 'EADDRINUSE') {
        freePortWasFound = false;
      } else {
        throw error;
      }
    }
  } while (!freePortWasFound);
  throw Error('Should not arrive here. This is a bug');
};

export type ResolverTestingModuleMeta = ServiceTestingModuleMeta & {
  app: INestApplication;
  appUrl: string;
  // Helper to make a simple graphql request
  request: () => request.Test;
  // Helper to make a graphql request with an upload. The file array must be the variable $files in the query.
  uploadRequest: (query: string, filePaths: string[]) => request.Test;
};

export const resolverTestBaseImports = [...serviceTestBaseImports, graphqlModule];

export const setupResolverTestingModule = async (
  testingModule: TestingModule,
): Promise<ResolverTestingModuleMeta> => {
  const testingModuleMeta = setupServiceTestingModule(testingModule);
  const app = testingModuleMeta.moduleRef.createNestApplication({ logger: false });
  app.use(
    graphqlUploadExpress({
      maxFileSize: 10 * 1024 * 1024,
      maxFiles: 10,
    }),
  );
  const port = await listenToFirstAvailablePort(app);
  const configService = app.get<ConfigService>(ConfigService);
  configService.port = port; // Override the port in config.

  const appUrl = await app.getUrl();

  const simpleRequest = () => request(appUrl).post(`/${GRAPHQL_PATH}`);

  const uploadRequest = (query: string, filePaths: string[]) => {
    const req = simpleRequest()
      .set('Content-Type', 'multipart/form-data')
      .field('operations', JSON.stringify({ query }))
      .field(
        'map',
        JSON.stringify(mapValues(filePaths, (filePath, index) => [`variables.files.${index}`])),
      );
    return reduce(filePaths, (req, filePath, index) => req.attach(String(index), filePath), req);
  };

  return {
    ...testingModuleMeta,
    afterAll: async () => {
      await app.close();
      await testingModuleMeta.afterAll();
    },
    app,
    appUrl,
    request: simpleRequest,
    uploadRequest,
  };
};
