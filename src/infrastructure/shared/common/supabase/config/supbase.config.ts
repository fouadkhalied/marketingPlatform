import { S3Client } from '@aws-sdk/client-s3'

const minioClient = new S3Client({
    endpoint: 'http://75.119.136.7:9000',
    region: 'us-east-1',
    credentials: {
      accessKeyId: 'admin', // admin
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY! 
    },
    forcePathStyle: true
  })
  
  const BUCKET_NAME = 'supabase-storage'
  const MINIO_PUBLIC_URL = 'http://75.119.136.7:9000' 
  
export {minioClient, BUCKET_NAME , MINIO_PUBLIC_URL}
