// migrate-files.js
const { createClient } = require('@supabase/supabase-js');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
require('dotenv').config();

// Supabase Cloud configuration (source)
const supabaseUrl = 'https://bswsekovxuifojugqdbx.supabase.co'
const supabaseKey = process.env.SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)
const contaboId = process.env.CONTABO_IP
const password = process.env.AWS_SECRET_ACCESS_KEY

// MinIO configuration (destination)
const s3Client = new S3Client({
  endpoint: `http://${contaboId}:9000`,
  region: 'us-east-1',
  credentials: {
    accessKeyId: 'admin',
    secretAccessKey: password
  },
  forcePathStyle: true
})

// Files to migrate (the ones you kept)
const filesToMigrate = [
  'ad-1765811743091-9851.png'
]

// Detect content type from filename
function getContentType(filename) {
  const ext = filename.split('.').pop().toLowerCase()
  const types = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml'
  }
  return types[ext] || 'application/octet-stream'
}

async function migrateFile(filename) {
  try {
    // Get public URL from Supabase
    const { data } = supabase.storage.from('photos').getPublicUrl(filename)
    
    console.log(`Downloading: ${filename}`)
    
    // Download file from Supabase
    const response = await fetch(data.publicUrl)
    if (!response.ok) {
      throw new Error(`Failed to download ${filename}: ${response.statusText}`)
    }
    
    const buffer = Buffer.from(await response.arrayBuffer())
    
    console.log(`Uploading to MinIO: ${filename} (${buffer.length} bytes)`)
    
    // Upload to MinIO
    const command = new PutObjectCommand({
      Bucket: 'supabase-storage',
      Key: filename,
      Body: buffer,
      ContentType: getContentType(filename)
    })
    
    await s3Client.send(command)
    console.log(`✓ Successfully migrated: ${filename}`)
    
    return { success: true, filename }
  } catch (error) {
    console.error(`✗ Failed to migrate ${filename}:`, error.message)
    return { success: false, filename, error: error.message }
  }
}

async function migrateAllFiles() {
  console.log(`Starting migration of ${filesToMigrate.length} files...`)
  console.log('='.repeat(50))
  
  const results = []
  
  for (const filename of filesToMigrate) {
    const result = await migrateFile(filename)
    results.push(result)
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  console.log('='.repeat(50))
  console.log('Migration Summary:')
  console.log(`Total files: ${results.length}`)
  console.log(`Successful: ${results.filter(r => r.success).length}`)
  console.log(`Failed: ${results.filter(r => !r.success).length}`)
  
  const failed = results.filter(r => !r.success)
  if (failed.length > 0) {
    console.log('\nFailed files:')
    failed.forEach(f => console.log(`  - ${f.filename}: ${f.error}`))
  }
}

// Run migration
migrateAllFiles().catch(console.error)