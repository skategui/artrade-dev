import { z } from 'zod';

export const s3ConfigZod = {
  host: ['S3_HOST', z.string().url()],
  accessKeyId: ['S3_ACCESS_KEY_ID', z.string()],
  secretAccessKey: ['S3_SECRET_ACCESS_KEY', z.string()],
  bucketName: ['IMAGES_BUCKET_NAME', z.string()],
  region: ['S3_REGION', z.string()],
} as const;
