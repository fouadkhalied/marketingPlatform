// infrastructure/storage/MinioUploader.ts
import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { PhotosInterface } from "../interfaces/photo.interface";
import { IUploader } from "../interfaces/photoUploader.interface";
import { minioClient } from '../config/supbase.config';
import { BucketType } from "./supabase.module";

export class SupabaseUploader implements IUploader {
  private minioClient: S3Client;
  private bucketName: string;
  private minioPublicUrl: string;

  constructor(bucketType: BucketType = BucketType.AD) {
    this.minioClient = minioClient
    this.bucketName = bucketType === BucketType.BLOG ? 'blogs' : 'supabase-storage';
    this.minioPublicUrl = `https://octopusad.com/storage/${this.bucketName}`;
  }

  async upload(file: PhotosInterface): Promise<boolean> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: file.fileName,
        Body: file.buffer,
        ContentType: file.mimeType,
      });

      await this.minioClient.send(command);
      return true;
    } catch (error: any) {
      throw new Error(`error in uploading photo: ${error.message}`);
    }
  }

  

  async delete(url: string): Promise<boolean> {
    let filePath = '';
    try {
      console.log('SupabaseUploader: Starting delete operation', { url, bucketName: this.bucketName });

      const urlObj = new URL(url);
      const urlPath = urlObj.pathname;

      // Extract filename from URL path
      // URL format: /storage/{bucketName}/{fileName}
      // We want to extract just the {fileName} part
      const pathParts = urlPath.split('/');
      filePath = pathParts[pathParts.length - 1]; // Get the last part (filename)

      console.log('SupabaseUploader: Extracted file path', {
        fullUrl: url,
        urlPath,
        bucketName: this.bucketName,
        pathParts,
        extractedFilePath: filePath
      });
      

      // Check if file exists first
      try {
        const headResult = await this.minioClient.send(new HeadObjectCommand({
          Bucket: this.bucketName,
          Key: filePath,
        }));

        console.log(headResult);
        
      } catch (headError: any) {
        // File doesn't exist
        if (headError.name === 'NotFound' || headError.$metadata?.httpStatusCode === 404) {
          return false;
        }
        throw headError;
      }

      // File exists, now delete it
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: filePath,
      });

      console.log(filePath);
      

      await this.minioClient.send(command);
      console.log('SupabaseUploader: Photo deleted successfully', { bucketName: this.bucketName, filePath });
      return true;
    } catch (error: any) {
      console.error('SupabaseUploader: Error deleting photo', {
        bucketName: this.bucketName,
        filePath,
        error: error.message,
        errorName: error.name
      });
      throw new Error(`error in deleting photo: ${error.message}`);
    }
  }

  async getUrl(filePath: string): Promise<string> {
    try {
      return `${this.minioPublicUrl}/${filePath}`;
    } catch (error: any) {
      throw new Error(`error in getting photo URL: ${error.message}`);
    }
  }
}