import { Injectable } from '@nestjs/common';
import AWS from 'aws-sdk';
import { ContentType, ObjectCannedACL } from 'aws-sdk/clients/s3';
import { InjectS3, S3 } from 'nestjs-s3';
import { ConfigService } from '../config/config.service';

@Injectable()
export class FileStorageService {
  private bucketName: string;

  constructor(
    private readonly configService: ConfigService,
    @InjectS3() private readonly s3Client: S3,
  ) {
    this.bucketName = configService.s3.bucketName;
  }

  async putObjectInBucket(asset: { bucketPath: string; imageBuffer: Buffer }): Promise<string> {
    const { bucketPath, imageBuffer } = asset;
    const params = {
      Bucket: this.bucketName,
      Key: bucketPath,
      Body: imageBuffer,
      ContentType: 'image/webp',
    };
    console.log('S3 params');
    console.log(params);
    const data = await this.s3Client.upload(params).promise();
    return data.Location;
  }

  async put(
    readStream: AWS.S3.Body,
    path: string,
    acl: ObjectCannedACL = 'public-read',
    contentType: ContentType = 'image/jpeg',
  ): Promise<string> {
    const data = await this.s3Client
      .upload({
        Bucket: this.bucketName,
        Key: path,
        Body: readStream,
        ContentType: contentType,
        ACL: acl,
      })
      .promise();
    return data.Location;
  }

  async get(path: string): Promise<AWS.S3.Body | undefined> {
    const data = await this.s3Client
      .getObject({
        Bucket: this.bucketName,
        Key: path,
      })
      .promise();

    return data.Body;
  }

  async getOrThrow(path: string): Promise<AWS.S3.Body> {
    const body = await this.get(path);
    if (!body) {
      throw new StorageObjectNotFound(this.bucketName, path);
    }
    return body;
  }

  async delete(path: string): Promise<void> {
    await this.s3Client
      .deleteObject({
        Bucket: this.bucketName,
        Key: path,
      })
      .promise();
  }
}

export class StorageObjectNotFound extends Error {
  constructor(readonly bucketName: string, readonly path: string) {
    super(`Object not found in bucket ${bucketName} at path ${path}`);
  }
}
