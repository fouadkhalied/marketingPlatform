import { S3Client } from '@aws-sdk/client-s3'
import dotenv from "dotenv";

dotenv.config();

const minioClient = new S3Client({
    endpoint: 'https://octopusad.com/storage/supabase-storage',
    region: 'us-east-1',
    credentials: {
      accessKeyId: 'admin', // admin
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY! 
    },
    forcePathStyle: true
  })
  
  const BUCKET_NAME = 'supabase-storage'
  const MINIO_PUBLIC_URL = 'https://octopusad.com/storage/supabase-storage' 
  
export {minioClient, BUCKET_NAME , MINIO_PUBLIC_URL}
