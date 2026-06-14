import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Upload } from "@aws-sdk/lib-storage";
import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { extname } from "path";
import { UUIDV4 } from "sequelize";
import MulterFile from "./types/multer-file.type";

@Injectable()
export class S3Service {
  private client: S3Client;
  private bucket: string;
  private region: string;

  constructor(private configService: ConfigService) {
    this.region = this.configService.get<string>("AWS_REGION") ?? "";
    this.bucket = this.configService.get<string>("AWS_S3_BUCKET") ?? "";

    this.client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: this.configService.get<string>("AWS_ACCESS_KEY_ID") ?? "",
        secretAccessKey: this.configService.get<string>("AWS_SECRET_ACCESS_KEY") ?? "",
      },
    });
  }

  async uploadFile(file: MulterFile, folder = "thumbnails"): Promise<string> {
    const key = `${folder}/${UUIDV4()}${extname(file.originalname)}`;

    const upload = new Upload({
      client: this.client,
      params: {
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      },
    });

    await upload.done();

    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }

  async deleteFile(url: string): Promise<void> {
    const key = url.split(".amazonaws.com/")[1];
    if (!key) return;

    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
  }
}
