import {
  DeleteObjectCommand,
  GetObjectCommand,
  ObjectCannedACL,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { Readable } from 'stream';
import { ConfigService } from '../config/config.service';

/* istanbul ignore next */
@Injectable()
export class FileStorageService {
  private bucketName: string;
  private s3Client: S3Client;

  constructor(private readonly conf: ConfigService) {
    this.s3Client = new S3Client({
      endpoint: conf.s3.host,
      region: conf.s3.region,
      forcePathStyle: true,
      credentials: { accessKeyId: conf.s3.accessKeyId, secretAccessKey: conf.s3.secretAccessKey },
    });
    this.bucketName = conf.s3.bucketName;
  }

  async putObjectInBucket(asset: { bucketPath: string; imageBuffer: Buffer }): Promise<string> {
    const { bucketPath, imageBuffer } = asset;
    const params = {
      Bucket: this.bucketName,
      Key: bucketPath,
      Body: imageBuffer,
      ContentType: 'image/webp',
    };
    const command = new PutObjectCommand(params);
    await this.s3Client.send(command);
    return `${params.Bucket}/${params.Key}`;
  }

  async put(
    readStream: Readable,
    path: string,
    acl: ObjectCannedACL = ObjectCannedACL.public_read,
    contentType = 'image/jpeg',
  ): Promise<string> {
    const params = {
      Bucket: this.bucketName,
      Key: path,
      Body: readStream,
      ContentType: contentType,
      ACL: acl,
    };

    const command = new PutObjectCommand(params);
    await this.s3Client.send(command);
    return `${params.Bucket}/${params.Key}`;
  }

  async get(path: string): Promise<Readable | ReadableStream | Blob | undefined> {
    const params = {
      Bucket: this.bucketName,
      Key: path,
    };
    const command = new GetObjectCommand(params);
    const data = await this.s3Client.send(command);
    return data.Body;
  }

  async getOrThrow(path: string): Promise<Readable | ReadableStream | Blob> {
    const body = await this.get(path);
    if (!body) {
      throw new StorageObjectNotFound(this.bucketName, path);
    }
    return body;
  }

  async delete(path: string): Promise<void> {
    const params = {
      Bucket: this.bucketName,
      Key: path,
    };
    const command = new DeleteObjectCommand(params);
    await this.s3Client.send(command);
  }
}

export class StorageObjectNotFound extends Error {
  constructor(readonly bucketName: string, readonly path: string) {
    super(`Object not found in bucket ${bucketName} at path ${path}`);
  }
}
