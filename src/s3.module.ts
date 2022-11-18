import { S3Module } from 'nestjs-s3';
import { ConfigService } from './config/config.service';

export const s3Module = S3Module.forRootAsync({
  imports: [],
  useFactory: (conf: ConfigService) => {
    return {
      config: {
        endpoint: conf.s3.host,
        accessKeyId: conf.s3.accessKeyId,
        secretAccessKey: conf.s3.secretAccessKey,
        s3ForcePathStyle: true,
        signatureVersion: 'v4',
      },
    };
  },
  inject: [ConfigService],
});
