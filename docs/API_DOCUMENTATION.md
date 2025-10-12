# API Documentation

## Overview

The Marketing Platform provides a comprehensive set of APIs for managing users, advertisements, and payments. All requests use JSON and require JWT token authentication.

**Base URL**: `https://your-domain.com/api`

## المصادقة

### تسجيل مستخدم جديد

```http
POST /api/auth/register
Content-Type: application/json
```

**المعاملات المطلوبة:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "username": "username"
}
```

**الاستجابة الناجحة:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "username": "username",
    "role": "user"
  },
  "message": "User created successfully"
}
```

### تسجيل الدخول

```http
POST /api/auth/login
Content-Type: application/json
```

**المعاملات المطلوبة:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**الاستجابة الناجحة:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "username": "username",
    "role": "user"
  },
  "message": "Login successful"
}
```

### التحقق من البريد الإلكتروني

```http
POST /api/auth/verify
Content-Type: application/json
```

**المعاملات المطلوبة:**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

### إعادة إرسال رمز التحقق

```http
POST /api/auth/resend-otp
Content-Type: application/json
```

**المعاملات المطلوبة:**
```json
{
  "email": "user@example.com"
}
```

### إعادة تعيين كلمة المرور

```http
POST /api/auth/password-reset-email
Content-Type: application/json
```

**المعاملات المطلوبة:**
```json
{
  "email": "user@example.com"
}
```

## إدارة المستخدمين

### الحصول على الملف الشخصي

```http
GET /api/users/profile
Authorization: Bearer <jwt-token>
```

**الاستجابة:**
```json
{
  "success": true,
  "data": {
    "id": "user-id",
    "email": "user@example.com",
    "username": "username",
    "role": "user",
    "isVerified": true,
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### تحديث الملف الشخصي

```http
PUT /api/users/profile
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

**المعاملات المتاحة:**
```json
{
  "username": "new-username",
  "firstName": "John",
  "lastName": "Doe"
}
```

### الحصول على تفاصيل المستخدم

```http
GET /api/user/userDetails/:id
Authorization: Bearer <jwt-token>
```

### الحصول على قائمة المستخدمين (للمديرين)

```http
GET /api/users
Authorization: Bearer <jwt-token>
```

### حذف مستخدم (للمديرين)

```http
DELETE /api/users/:id
Authorization: Bearer <jwt-token>
```

### ترقية مستخدم إلى مدير (للمديرين)

```http
PUT /api/users/promote/:id
Authorization: Bearer <jwt-token>
```

## المصادقة الاجتماعية

### تسجيل الدخول مع جوجل

```http
GET /api/auth/google
```

### معاودة جوجل

```http
GET /api/auth/google/login
```

### تسجيل الدخول مع فيسبوك

```http
GET /api/auth/facebook
```

### معاودة فيسبوك

```http
GET /api/auth/facebook/login
```

### إنشاء رابط مصادقة فيسبوك

```http
GET /api/auth/facebook/generateUserAuthUrl
Authorization: Bearer <jwt-token>
```

## الإعلانات

### إنشاء إعلان جديد

```http
POST /api/advertising
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

**المعاملات المطلوبة:**
```json
{
  "title": "عنوان الإعلان",
  "description": "وصف الإعلان",
  "targetAudience": "الجمهور المستهدف",
  "budget": 1000,
  "pageId": "facebook-page-id",
  "adType": "image",
  "callToAction": "تعرف على المزيد"
}
```

**الاستجابة:**
```json
{
  "success": true,
  "data": {
    "id": "ad-id",
    "title": "عنوان الإعلان",
    "status": "pending",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### الحصول على قائمة الإعلانات

```http
GET /api/advertising/list
Authorization: Bearer <jwt-token>
```

**المعاملات الاختيارية:**
- `page` - رقم الصفحة
- `limit` - عدد العناصر في الصفحة
- `status` - حالة الإعلان

### البحث في الإعلانات

```http
GET /api/advertising/search?title=search-term
Authorization: Bearer <jwt-token>
```

### الحصول على إعلان محدد

```http
GET /api/advertising/:id
Authorization: Bearer <jwt-token>
```

### تحديث إعلان

```http
PUT /api/advertising/:id
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

### حذف إعلان

```http
DELETE /api/advertising/:id
Authorization: Bearer <jwt-token>
```

### رفع صورة للإعلان

```http
POST /api/advertising/uploadPhoto/:id
Authorization: Bearer <jwt-token>
Content-Type: multipart/form-data
```

**المعاملات:**
- `photo` - ملف الصورة

### تعيين ائتمان للإعلان

```http
POST /api/advertising/:id/assign-credit
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

**المعاملات:**
```json
{
  "creditAmount": 1000
}
```

### الموافقة على إعلان (للمديرين)

```http
PUT /api/advertising/:id/approve
Authorization: Bearer <jwt-token>
```

### رفض إعلان (للمديرين)

```http
PUT /api/advertising/:id/reject
Authorization: Bearer <jwt-token>
```

### تفعيل إعلان (للمديرين)

```http
PUT /api/advertising/:id/activate
Authorization: Bearer <jwt-token>
```

### إلغاء تفعيل إعلان

```http
PUT /api/advertising/:id/deactivate
Authorization: Bearer <jwt-token>
```

### الحصول على صفحات المستخدم

```http
GET /api/advertising/list/userPages
Authorization: Bearer <jwt-token>
```

### الحصول على منشورات الصفحة

```http
GET /api/advertising/list/pages/:pageId/posts
Authorization: Bearer <jwt-token>
```

### الحصول على إحصائيات المنشور

```http
GET /api/advertising/insights/pages/:pageId/posts/:postId
Authorization: Bearer <jwt-token>
```

## المدفوعات

### إنشاء جلسة دفع

```http
POST /api/payment/createSessionUrl
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

**المعاملات المطلوبة:**
```json
{
  "amount": 100,
  "currency": "SAR",
  "metadata": {
    "type": "credit_purchase",
    "description": "شراء ائتمانات"
  }
}
```

**الاستجابة:**
```json
{
  "success": true,
  "data": {
    "sessionId": "session-id",
    "url": "https://checkout-url.com",
    "amount": 100,
    "currency": "SAR"
  }
}
```

### الحصول على تاريخ المشتريات

```http
GET /api/payment/history
Authorization: Bearer <jwt-token>
```

### الحصول على تاريخ المشتريات للمديرين

```http
GET /api/payment/getPurchaseHistoryForAdmin
Authorization: Bearer <jwt-token>
```

### Webhook للمدفوعات

```http
POST /webhook
Content-Type: application/json
```

## لوحة التحكم

### إحصائيات المستخدم

```http
GET /api/dashboard/user
Authorization: Bearer <jwt-token>
```

**الاستجابة:**
```json
{
  "success": true,
  "data": {
    "totalAds": 10,
    "activeAds": 5,
    "totalSpent": 1500,
    "totalViews": 50000,
    "totalClicks": 2500,
    "conversionRate": 5.0
  }
}
```

### إحصائيات المدير

```http
GET /api/dashboard/admin
Authorization: Bearer <jwt-token>
```

**الاستجابة:**
```json
{
  "success": true,
  "data": {
    "totalUsers": 100,
    "totalAds": 500,
    "totalRevenue": 25000,
    "pendingAds": 15,
    "activeAds": 400,
    "rejectedAds": 85
  }
}
```

## إدارة نسب الانطباع

### الحصول على نسب الانطباع المتاحة

```http
GET /api/users/impression-ratios
```

### تحديث نسبة الانطباع (للمديرين)

```http
PUT /api/users/impression-ratios/:id
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

**المعاملات:**
```json
{
  "ratio": 0.05,
  "description": "نسبة انطباع جديدة"
}
```

## تتبع النقرات

### تسجيل نقرة على إعلان

```http
PUT /api/users/ad/:id/click
```

## رموز الحالة

| الكود | المعنى |
|-------|--------|
| 200 | نجح الطلب |
| 201 | تم الإنشاء بنجاح |
| 400 | طلب غير صحيح |
| 401 | غير مصرح |
| 403 | محظور |
| 404 | غير موجود |
| 429 | عدد الطلبات تجاوز الحد المسموح |
| 500 | خطأ في الخادم |

## معالجة الأخطاء

جميع الاستجابات تحتوي على نفس البنية:

**الاستجابة الناجحة:**
```json
{
  "success": true,
  "data": { ... },
  "message": "رسالة النجاح"
}
```

**الاستجابة الفاشلة:**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "رسالة الخطأ",
    "details": "تفاصيل إضافية"
  }
}
```

## الحدود والقيود

- **Rate Limiting**: 1000 طلب لكل 15 دقيقة لكل IP
- **Auth Endpoints**: 10 محاولات لكل 15 دقيقة
- **Password Reset**: 3 محاولات لكل ساعة
- **Registration**: 50 محاولة لكل ساعة
- **File Upload**: حد أقصى 10MB
- **JSON Payload**: حد أقصى 10MB

## أمثلة الاستخدام

### تسجيل مستخدم جديد وتسجيل الدخول

```javascript
// تسجيل مستخدم جديد
const registerResponse = await fetch('/api/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'securePassword123',
    username: 'username'
  })
});

const registerData = await registerResponse.json();

// تسجيل الدخول
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'securePassword123'
  })
});

const loginData = await loginResponse.json();
const token = loginData.data.token;
```

### إنشاء إعلان جديد

```javascript
const createAdResponse = await fetch('/api/advertising', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    title: 'إعلان جديد',
    description: 'وصف الإعلان',
    targetAudience: 'الجمهور المستهدف',
    budget: 1000,
    pageId: 'facebook-page-id'
  })
});

const adData = await createAdResponse.json();
```

### إنشاء جلسة دفع

```javascript
const paymentResponse = await fetch('/api/payment/createSessionUrl', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    amount: 100,
    currency: 'SAR',
    metadata: {
      type: 'credit_purchase'
    }
  })
});

const paymentData = await paymentResponse.json();
// توجيه المستخدم إلى paymentData.data.url
```

---

للمزيد من المعلومات أو الدعم، يرجى مراجعة الوثائق الرئيسية أو التواصل مع فريق التطوير.
