# Digital Marketing Platform 🚀

A comprehensive digital marketing platform built with Clean Architecture principles for managing social media advertising campaigns with integrated payment processing and analytics.

## ✨ Features

### Core Functionality
- **🔐 Authentication & Authorization**: JWT-based authentication with Google and Facebook OAuth integration
- **📱 Social Media Integration**: Direct Facebook and Instagram advertising campaign management
- **💳 Payment Processing**: Dual payment gateway support (Stripe for international, Paymob for local payments)
- **📊 Analytics Dashboard**: Real-time campaign performance tracking and analytics
- **👥 User Management**: Role-based access control (User, Admin) with granular permissions
- **✉️ Email Services**: Automated email notifications using Resend
- **🔔 OTP Verification**: Secure account verification system

### Technical Features
- Clean Architecture with DDD principles
- Repository pattern for data access
- Comprehensive error handling
- Rate limiting and security middleware
- RESTful API design
- WebSocket support for real-time updates
- Database migrations with Drizzle ORM

## 🛠 Tech Stack

### Backend
- **Runtime**: Node.js v22.x
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL 14.x
- **ORM**: Drizzle ORM

### Security & Auth
- **Authentication**: JWT, Google OAuth, Facebook SDK
- **Security**: Helmet, CORS, express-rate-limit
- **Encryption**: bcrypt for password hashing

### Payment Gateways
- **International**: Stripe
- **Local (MENA)**: Paymob

### External Services
- **Email**: Resend
- **Storage**: Supabase
- **Social**: Facebook Graph API

### DevOps
- **Deployment**: Vercel
- **Database Hosting**: Neon (PostgreSQL)
- **Version Control**: Git

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

```bash
# Node.js v22.x or higher
node --version  # Should output v22.x.x

# npm v8.x or higher
npm --version

# PostgreSQL v14.x or higher
psql --version

# Git
git --version
```

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd marketingPlatform
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Configure your environment variables:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/marketing_platform

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# Stripe
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Paymob
PAYMOB_API_KEY=your_paymob_api_key
PAYMOB_INTEGRATION_ID=your_integration_id
PAYMOB_HMAC_SECRET=your_hmac_secret

# OAuth
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
FACEBOOK_REDIRECT_URI=http://localhost:3000/api/auth/facebook/callback

# Email
RESEND_API_KEY=re_your_resend_api_key
FROM_EMAIL=noreply@yourdomain.com

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_anon_key

# Application
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:3000
```

### 4. Database Setup

```bash
# Create database
createdb marketing_platform

# Push schema to database
npm run db:push

# Or run migrations
npm run db:generate
npm run db:migrate
```

### 5. Start Development Server

```bash
npm run dev
```

The server will start at `http://localhost:3000`

## 📁 Project Structure

```
marketingPlatform/
├── src/
│   ├── infrastructure/              # Infrastructure layer
│   │   ├── config/                  # Configuration files
│   │   │   ├── app.config.ts
│   │   │   ├── drizzle.config.ts
│   │   │   ├── paymob.config.ts
│   │   │   └── stripe.config.ts
│   │   ├── db/                      # Database connection
│   │   │   └── connection.ts
│   │   └── shared/                  # Shared infrastructure
│   │       ├── common/              # Common services
│   │       │   ├── apiResponse/     # API response builders
│   │       │   ├── auth/            # Authentication services
│   │       │   ├── email/           # Email services
│   │       │   ├── errors/          # Error handling
│   │       │   ├── otp/             # OTP services
│   │       │   ├── pagination/      # Pagination utilities
│   │       │   └── validation/      # Input validation
│   │       ├── paymob/              # Paymob integration
│   │       ├── schema/              # Database schema
│   │       ├── sdk/                 # External SDKs
│   │       └── stripe/              # Stripe integration
│   └── modules/                     # Business modules
│       ├── auth/                    # Authentication module
│       │   ├── application/         # Application services
│       │   ├── domain/              # Domain logic
│       │   ├── infrastructure/      # Data persistence
│       │   └── interfaces/          # Controllers & routes
│       ├── user/                    # User management
│       ├── payment/                 # Payment processing
│       └── advertising/             # Advertising campaigns
├── api/
│   └── index.ts                     # Express server entry point
├── tests/                           # Test files
├── drizzle/                         # Migration files
├── .env.example                     # Environment template
├── package.json
├── tsconfig.json
└── README.md
```

## 🔌 API Documentation

### Base URL
```
Development: http://localhost:3000/api
Production: https://your-domain.com/api
```

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123",
  "username": "johndoe"
}

Response: 201 Created
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "username": "johndoe",
    "role": "user"
  },
  "message": "User created successfully"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}

Response: 200 OK
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user-123",
      "email": "user@example.com",
      "username": "johndoe",
      "role": "user"
    }
  }
}
```

#### Google OAuth
```http
GET /api/auth/google
Redirects to Google OAuth consent screen

GET /api/auth/google/callback?code=GOOGLE_AUTH_CODE
Returns JWT token on success
```

#### Facebook OAuth
```http
GET /api/auth/facebook
Redirects to Facebook OAuth consent screen

GET /api/auth/facebook/callback?code=FB_AUTH_CODE
Returns JWT token on success
```

### User Endpoints

#### Get User Profile
```http
GET /api/users/profile
Authorization: Bearer {token}

Response: 200 OK
{
  "success": true,
  "data": {
    "id": "user-123",
    "email": "user@example.com",
    "username": "johndoe",
    "role": "user",
    "isVerified": true,
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

#### Update User Profile
```http
PUT /api/users/profile
Authorization: Bearer {token}
Content-Type: application/json

{
  "username": "newUsername",
  "phone": "+1234567890"
}

Response: 200 OK
```

### Advertising Endpoints

#### Create Ad Campaign
```http
POST /api/advertising
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Summer Sale Campaign",
  "description": "Promote summer products",
  "budget": 500,
  "targetAudience": {
    "age": [18, 65],
    "interests": ["fashion", "shopping"]
  },
  "pageId": "facebook-page-id"
}

Response: 201 Created
{
  "success": true,
  "data": {
    "id": "ad-123",
    "title": "Summer Sale Campaign",
    "status": "pending"
  }
}
```

#### List User Campaigns
```http
GET /api/advertising/list?page=1&limit=10
Authorization: Bearer {token}

Response: 200 OK
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "totalPages": 5
    }
  }
}
```

#### Approve Campaign (Admin Only)
```http
PUT /api/advertising/:id/approve
Authorization: Bearer {admin-token}

Response: 200 OK
```

### Payment Endpoints

#### Create Payment Session
```http
POST /api/payment/createSessionUrl
Authorization: Bearer {token}
Content-Type: application/json

{
  "amount": 100,
  "currency": "usd",
  "provider": "stripe",
  "description": "Ad campaign funding"
}

Response: 201 Created
{
  "success": true,
  "data": {
    "sessionUrl": "https://checkout.stripe.com/session/...",
    "sessionId": "cs_test_..."
  }
}
```

#### Payment History
```http
GET /api/payment/history?page=1&limit=10
Authorization: Bearer {token}

Response: 200 OK
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {...}
  }
}
```

#### Payment Webhook
```http
POST /webhook/stripe
Content-Type: application/json
Stripe-Signature: {signature}

Handles Stripe payment events
```

## 🧪 Testing

### Run Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- user.test.ts

# Watch mode
npm run test:watch
```

### Test Structure

```typescript
// Example unit test
describe('UserAppService', () => {
  let userService: UserAppService;
  
  beforeEach(() => {
    userService = new UserAppService(mockRepository);
  });

  it('should create user successfully', async () => {
    const result = await userService.createUser({
      email: 'test@example.com',
      password: 'password123'
    });
    
    expect(result.success).toBe(true);
  });
});
```

## 📦 Building for Production

```bash
# Build TypeScript
npm run build

# The compiled output will be in /dist directory
```

## 🚀 Deployment

### Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to production
vercel --prod

# Set environment variables
vercel env add DATABASE_URL
vercel env add JWT_SECRET
# ... add all required environment variables
```


## 🔒 Security

### Implemented Security Measures

- **Rate Limiting**: 1000 requests per 15 minutes per IP
- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with salt rounds of 12
- **Input Validation**: Zod schema validation
- **SQL Injection Prevention**: Parameterized queries via Drizzle ORM
- **XSS Protection**: Helmet middleware
- **CORS**: Configured for specific origins
- **HTTPS**: Enforced in production

### Security Headers

```typescript
app.use(helmet({
  contentSecurityPolicy: true,
  xssFilter: true,
  noSniff: true,
  hsts: true
}));
```

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Test additions or modifications
- `chore:` Build process or auxiliary tool changes
