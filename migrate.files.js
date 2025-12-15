// migrate-files.js
const { createClient } = require('@supabase/supabase-js');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
require('dotenv').config();
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY);
console.log('CONTABO_IP:', process.env.CONTABO_IP);
console.log('AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY);


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
  'ad-1764526974046-1486.png',
  'ad-1765419659230-3961.jpg',
  'ad-1764970010623-2561.png',
  'ad-1765124355513-8352.jpeg',
  'ad-1765074371195-860.jpg',
  'ad-1764781111299-8406.jpeg',
  'ad-1764776671508-5128.jpg',
  'ad-1765620386903-281.jpeg',
  'ad-1765141702322-5359.png',
  'ad-1765141777946-3951.png',
  'ad-1765093905233-4128.jpg',
  'ad-1765650522696-4921.png',
  'ad-1764971171171-1740.png',
  'ad-1764526567908-9018.jpg',
  'ad-1764526567908-4882.jpg',
  'ad-1765123837373-8504.png',
  'ad-1764566635637-8267.png',
  'ad-1764566635637-7650.jpg',
  'ad-1765651715024-7445.png',
  'ad-1765652199537-3291.png',
  'ad-1764969700263-2127.png',
  'ad-1765123773526-9550.png',
  'ad-1765124530080-4086.png',
  'ad-1765124472972-2695.jpeg',
  'ad-1764969773931-469.png',
  'ad-1765263450669-5220.png',
  'ad-1765211373579-5209.jpg',
  'ad-1764971869799-8793.png',
  'ad-1765366893734-6323.png',
  'ad-1765348760660-3866.png'
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