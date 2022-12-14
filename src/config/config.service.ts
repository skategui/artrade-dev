import { Injectable } from '@nestjs/common';
import { baseConfigZod, Env, Protocol } from './base.config';
import { blockchainConfigZod } from './blockchain.config';
import { elasticsearchConfigZod } from './elasticsearch.config';
import { emailingConfigZod } from './emailing.config';
import { createConfigFromEnv, InferConfig } from './helpers/create-config-from-env';
import { jwtConfigZod } from './jwt.config';
import { mongoConfigZod } from './mongo.config';
import { s3ConfigZod } from './s3.config';

/* istanbul ignore next */
@Injectable()
export class ConfigService implements InferConfig<typeof baseConfigZod> {
  nodeEnv: Env;
  port: number;
  graphqlPlaygroundEnabled: boolean;
  protocol: Protocol;
  host: string;
  throttleTtl: number;
  fileUploadMaxSize: number;
  fileUploadMaxFiles: number;
  artradeBaseUrl: string;
  artradeApiBaseUrl: string;
  devToken: string;
  jwt: InferConfig<typeof jwtConfigZod>;
  emailing: InferConfig<typeof emailingConfigZod>;
  mongo: InferConfig<typeof mongoConfigZod>;
  s3: InferConfig<typeof s3ConfigZod>;
  blockchain: InferConfig<typeof blockchainConfigZod>;
  elasticsearch: InferConfig<typeof elasticsearchConfigZod>;

  constructor() {
    const env = process.env;
    const baseConfig = createConfigFromEnv(baseConfigZod, env);
    Object.assign(this, {
      ...baseConfig,
      graphqlPlaygroundEnabled:
        baseConfig.graphqlPlaygroundEnabled ?? baseConfig.nodeEnv !== Env.production,
    });
    this.jwt = createConfigFromEnv(jwtConfigZod, env);
    this.emailing = createConfigFromEnv(emailingConfigZod, env);
    this.mongo = createConfigFromEnv(mongoConfigZod, env);
    this.s3 = createConfigFromEnv(s3ConfigZod, env);
    this.blockchain = createConfigFromEnv(blockchainConfigZod, env);
    this.elasticsearch = createConfigFromEnv(elasticsearchConfigZod, env);
  }

  get isDevelopment(): boolean {
    return this.nodeEnv === Env.development;
  }

  get isProduction(): boolean {
    return this.nodeEnv === Env.production;
  }

  get isStaging(): boolean {
    return this.nodeEnv === Env.staging;
  }
}
