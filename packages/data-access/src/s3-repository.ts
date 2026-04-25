import {
    DeleteObjectCommand,
    GetObjectCommand,
    PutObjectCommand,
    S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({});

export class S3Repository {
    constructor(private readonly bucketName: string) {}

    async putObject(key: string, body: Buffer | string, contentType: string): Promise<void> {
        await s3.send(
            new PutObjectCommand({
                Bucket: this.bucketName,
                Key: key,
                Body: body,
                ContentType: contentType,
            })
        );
    }

    async getObject(key: string): Promise<Buffer> {
        const result = await s3.send(new GetObjectCommand({ Bucket: this.bucketName, Key: key }));
        const bytes = await result.Body!.transformToByteArray();
        return Buffer.from(bytes);
    }

    async getObjectAsString(key: string): Promise<string> {
        const result = await s3.send(new GetObjectCommand({ Bucket: this.bucketName, Key: key }));
        return result.Body!.transformToString('utf-8');
    }

    async deleteObject(key: string): Promise<void> {
        await s3.send(new DeleteObjectCommand({ Bucket: this.bucketName, Key: key }));
    }

    async presignedUploadUrl(
        key: string,
        contentType: string,
        expiresInSeconds = 300
    ): Promise<string> {
        return getSignedUrl(
            s3,
            new PutObjectCommand({
                Bucket: this.bucketName,
                Key: key,
                ContentType: contentType,
            }),
            { expiresIn: expiresInSeconds }
        );
    }

    async presignedDownloadUrl(key: string, expiresInSeconds = 900): Promise<string> {
        return getSignedUrl(s3, new GetObjectCommand({ Bucket: this.bucketName, Key: key }), {
            expiresIn: expiresInSeconds,
        });
    }
}
