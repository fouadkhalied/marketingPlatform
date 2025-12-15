// infrastructure/storage/MinioUploader.ts

import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { PhotosInterface } from "../interfaces/photo.interface";
import { IUploader } from "../interfaces/photoUploader.interface";
import { minioClient } from '../config/supbase.config';

export class SupabaseUploader implements IUploader {
  private minioClient: S3Client;
  private bucketName: string;
  private minioPublicUrl: string;

  constructor() {
    this.minioClient = minioClient
    this.bucketName = 'supabase-storage';
    this.minioPublicUrl = 'http://75.119.136.7:9000';
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
    try {
    
      const urlPath = new URL(url).pathname;
      const filePath = urlPath.replace(`/${this.bucketName}/`, '');

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
      return true;
    } catch (error: any) {
      throw new Error(`error in deleting photo: ${error.message}`);
    }
  }

  async getUrl(filePath: string): Promise<string> {
    try {
      return `${this.minioPublicUrl}/${this.bucketName}/${filePath}`;
    } catch (error: any) {
      throw new Error(`error in getting photo URL: ${error.message}`);
    }
  }
}