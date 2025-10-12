# دليل النشر (Deployment Guide)

## نظرة عامة

يغطي هذا الدليل جميع الخطوات اللازمة لنشر منصة التسويق الرقمي في بيئات مختلفة، من التطوير المحلي إلى الإنتاج.

## متطلبات النظام

### الحد الأدنى للمتطلبات
- **Node.js**: v22.x أو أحدث
- **npm**: v8.x أو أحدث
- **PostgreSQL**: v14.x أو أحدث
- **Git**: v2.x أو أحدث

### موارد الخادم المقترحة
- **CPU**: 2 cores
- **RAM**: 4GB
- **Storage**: 20GB SSD
- **Network**: 100 Mbps

## إعداد البيئة المحلية

### 1. استنساخ المشروع

```bash
# استنساخ المشروع
git clone <repository-url>
cd marketingPlatform

# تثبيت التبعيات
npm install
```

### 2. إعداد متغيرات البيئة

إنشاء ملف `.env` في الجذر:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/marketing_platform
DATABASE_SSL=false

# Authentication
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Paymob Configuration
PAYMOB_API_KEY=your_paymob_api_key
PAYMOB_SECRET_KEY=your_paymob_secret_key
PAYMOB_INTEGRATION_ID=your_integration_id
PAYMOB_IFRAME_ID=your_iframe_id
PAYMOB_HMAC_SECRET=your_hmac_secret

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Facebook Configuration
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret

# Email Service (Resend)
RESEND_API_KEY=your_resend_api_key

# Supabase (Optional)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# Application
NODE_ENV=development
PORT=3000
```

### 3. إعداد قاعدة البيانات

```bash
# إنشاء قاعدة البيانات
createdb marketing_platform

# تشغيل المايجريشن
npm run db:push

# أو استخدام المايجريشن
npm run db:migrate
```

### 4. تشغيل المشروع

```bash
# وضع التطوير
npm run dev

# البناء للإنتاج
npm run build
npm start
```

## النشر على Vercel

### 1. إعداد Vercel CLI

```bash
# تثبيت Vercel CLI
npm i -g vercel

# تسجيل الدخول
vercel login
```

### 2. إعداد المشروع

```bash
# ربط المشروع بـ Vercel
vercel

# اتباع التعليمات لإعداد المشروع
```

### 3. إعداد متغيرات البيئة في Vercel

```bash
# إضافة متغيرات البيئة
vercel env add DATABASE_URL
vercel env add JWT_SECRET
vercel env add STRIPE_SECRET_KEY
# ... باقي المتغيرات
```

أو من خلال لوحة تحكم Vercel:
1. اذهب إلى المشروع في Vercel Dashboard
2. اختر Settings → Environment Variables
3. أضف جميع متغيرات البيئة المطلوبة

### 4. النشر

```bash
# النشر للإنتاج
vercel --prod

# النشر للمعاينة
vercel
```

### 5. إعداد النطاق المخصص

```bash
# إضافة نطاق مخصص
vercel domains add your-domain.com
```

## النشر على خادم VPS

### 1. إعداد الخادم

```bash
# تحديث النظام
sudo apt update && sudo apt upgrade -y

# تثبيت Node.js
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# تثبيت PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# تثبيت PM2
sudo npm install -g pm2
```

### 2. إعداد قاعدة البيانات

```bash
# إنشاء مستخدم قاعدة البيانات
sudo -u postgres createuser --interactive

# إنشاء قاعدة البيانات
sudo -u postgres createdb marketing_platform

# تعيين كلمة مرور للمستخدم
sudo -u postgres psql -c "ALTER USER your_username PASSWORD 'your_password';"
```

### 3. إعداد Nginx

```bash
# تثبيت Nginx
sudo apt install nginx -y

# إنشاء ملف الإعداد
sudo nano /etc/nginx/sites-available/marketing-platform
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# تفعيل الموقع
sudo ln -s /etc/nginx/sites-available/marketing-platform /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 4. إعداد SSL مع Let's Encrypt

```bash
# تثبيت Certbot
sudo apt install certbot python3-certbot-nginx -y

# الحصول على شهادة SSL
sudo certbot --nginx -d your-domain.com

# اختبار التجديد التلقائي
sudo certbot renew --dry-run
```

### 5. النشر على الخادم

```bash
# استنساخ المشروع على الخادم
git clone <repository-url>
cd marketingPlatform

# تثبيت التبعيات
npm install

# بناء المشروع
npm run build

# إعداد متغيرات البيئة
nano .env

# تشغيل مع PM2
pm2 start dist/index.js --name "marketing-platform"
pm2 startup
pm2 save
```

## إعداد قاعدة البيانات للإنتاج

### 1. Neon Database (PostgreSQL المدارة)

```bash
# إنشاء حساب على Neon
# الحصول على connection string
# إضافة إلى متغيرات البيئة
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require
```

### 2. إعداد النسخ الاحتياطية

```bash
# إنشاء نسخة احتياطية
pg_dump marketing_platform > backup.sql

# استعادة النسخة الاحتياطية
psql marketing_platform < backup.sql
```

## إعداد الخدمات الخارجية

### 1. Stripe

```bash
# إنشاء حساب Stripe
# الحصول على API Keys
# إعداد Webhooks
# إضافة endpoints:
# - /webhook (للدفع)
# - /api/payment/webhook (للاستردادات)
```

### 2. Paymob

```bash
# إنشاء حساب Paymob
# الحصول على API Keys
# إعداد Integration ID
# إعداد HMAC Secret
```

### 3. Google OAuth

```bash
# إنشاء مشروع في Google Cloud Console
# تفعيل Google+ API
# إنشاء OAuth 2.0 credentials
# إضافة authorized redirect URIs:
# - http://localhost:3000/api/auth/google/login (لل开发)
# - https://your-domain.com/api/auth/google/login (للإنتاج)
```

### 4. Facebook Developer

```bash
# إنشاء تطبيق في Facebook Developer
# إضافة منتجات: Facebook Login, Marketing API
# إعداد App Domains
# إضافة Valid OAuth Redirect URIs
```

## مراقبة الأداء

### 1. إعداد PM2 Monitoring

```bash
# مراقبة العمليات
pm2 monit

# عرض السجلات
pm2 logs

# إعادة تشغيل التطبيق
pm2 restart marketing-platform
```

### 2. إعداد Nginx Logging

```bash
# عرض سجلات Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 3. مراقبة قاعدة البيانات

```bash
# مراقبة الاتصالات
sudo -u postgres psql -c "SELECT * FROM pg_stat_activity;"

# مراقبة الأداء
sudo -u postgres psql -c "SELECT * FROM pg_stat_database;"
```

## اختبار النشر

### 1. Health Check

```bash
# اختبار الصحة العامة
curl http://localhost:3000/

# اختبار API
curl http://localhost:3000/api/auth/login
```

### 2. اختبار الوظائف الأساسية

```bash
# اختبار التسجيل
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password","username":"test"}'

# اختبار تسجيل الدخول
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

## الصيانة والتحديثات

### 1. تحديث التطبيق

```bash
# سحب التحديثات
git pull origin main

# تثبيت التبعيات الجديدة
npm install

# بناء التطبيق
npm run build

# إعادة تشغيل PM2
pm2 restart marketing-platform
```

### 2. تحديث قاعدة البيانات

```bash
# تشغيل المايجريشن
npm run db:migrate

# أو دفع التغييرات
npm run db:push
```

### 3. النسخ الاحتياطية الدورية

```bash
# إنشاء سكريبت النسخ الاحتياطية
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump marketing_platform > "backup_$DATE.sql"
find . -name "backup_*.sql" -mtime +7 -delete
```

```bash
# إضافة إلى crontab
crontab -e

# تشغيل يومياً في الساعة 2 صباحاً
0 2 * * * /path/to/backup-script.sh
```

## استكشاف الأخطاء

### 1. مشاكل شائعة

#### خطأ في قاعدة البيانات
```bash
# التحقق من اتصال قاعدة البيانات
psql $DATABASE_URL

# فحص السجلات
pm2 logs marketing-platform
```

#### خطأ في الذاكرة
```bash
# زيادة حد الذاكرة
pm2 restart marketing-platform --max-memory-restart 1G
```

#### خطأ في SSL
```bash
# التحقق من شهادة SSL
sudo certbot certificates

# تجديد الشهادة
sudo certbot renew
```

### 2. مراقبة السجلات

```bash
# سجلات التطبيق
pm2 logs marketing-platform --lines 100

# سجلات Nginx
sudo tail -f /var/log/nginx/error.log

# سجلات النظام
sudo journalctl -u nginx -f
```

## الأمان

### 1. إعداد Firewall

```bash
# تثبيت UFW
sudo apt install ufw -y

# إعداد القواعد
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443

# تفعيل Firewall
sudo ufw enable
```

### 2. تحديث النظام

```bash
# تحديث تلقائي للأمان
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure -plow unattended-upgrades
```

### 3. مراقبة الأمان

```bash
# مراقبة محاولات الدخول
sudo tail -f /var/log/auth.log

# فحص الملفات المشبوهة
sudo find /var/log -name "*.log" -exec grep -l "error\|fail\|denied" {} \;
```

---

باتباع هذا الدليل، ستتمكن من نشر منصة التسويق الرقمي بنجاح في بيئة الإنتاج مع ضمان الأمان والأداء العالي.
