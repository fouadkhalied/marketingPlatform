# دليل التطوير (Development Guide)

## نظرة عامة

يغطي هذا الدليل جميع الجوانب المتعلقة بتطوير منصة التسويق الرقمي، من إعداد البيئة المحلية إلى أفضل الممارسات في التطوير.

## إعداد البيئة المحلية

### المتطلبات الأساسية

```bash
# Node.js v22.x أو أحدث
node --version

# npm v8.x أو أحدث
npm --version

# Git
git --version

# PostgreSQL v14.x أو أحدث
psql --version
```

### خطوات الإعداد

```bash
# 1. استنساخ المشروع
git clone <repository-url>
cd marketingPlatform

# 2. تثبيت التبعيات
npm install

# 3. إعداد متغيرات البيئة
cp .env.example .env
# تعديل ملف .env بالقيم المناسبة

# 4. إعداد قاعدة البيانات
createdb marketing_platform
npm run db:push

# 5. تشغيل المشروع
npm run dev
```

## هيكل المشروع

### تنظيم الملفات

```
src/
├── infrastructure/           # الطبقة التحتية
│   ├── config/              # ملفات الإعدادات
│   │   ├── app.config.ts    # إعدادات التطبيق
│   │   ├── drizzle.config.ts # إعدادات قاعدة البيانات
│   │   ├── paymob.config.ts # إعدادات Paymob
│   │   └── stripe.config.ts # إعدادات Stripe
│   ├── db/                  # اتصال قاعدة البيانات
│   │   └── connection.ts    # اتصال Drizzle
│   └── shared/              # المكونات المشتركة
│       ├── common/          # خدمات مشتركة
│       │   ├── apiResponse/ # بناء استجابات API
│       │   ├── auth/        # خدمات المصادقة
│       │   ├── email/       # خدمات البريد الإلكتروني
│       │   ├── errors/      # معالجة الأخطاء
│       │   ├── otp/         # خدمات OTP
│       │   ├── pagination/  # التصفح
│       │   ├── supabase/    # تكامل Supabase
│       │   ├── validation/  # التحقق من البيانات
│       │   └── webhooks/    # معالجة Webhooks
│       ├── paymob/          # تكامل Paymob
│       ├── schema/          # مخطط قاعدة البيانات
│       ├── sdk/             # SDKs خارجية
│       └── stripe/          # تكامل Stripe
└── modules/                 # الوحدات الأساسية
    ├── auth/                # وحدة المصادقة
    │   ├── application/     # طبقة التطبيق
    │   ├── domain/          # طبقة النطاق
    │   ├── infrastructure/  # طبقة البنية التحتية
    │   └── interfaces/      # طبقة العرض
    ├── user/                # وحدة المستخدمين
    ├── payment/             # وحدة المدفوعات
    └── advertising/         # وحدة الإعلانات
```

## معمارية Clean Architecture

### 1. طبقة العرض (Interfaces)

```typescript
// src/modules/user/interfaces/controllers/user.controller.ts
export class UserController {
  constructor(
    private readonly userService: UserAppService
  ) {}

  async createUser(req: Request, res: Response): Promise<void> {
    try {
      const userData = req.body;
      const result = await this.userService.createUser(userData);
      
      const statusCode = this.getStatusCode(result);
      res.status(statusCode).json(result);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  private getStatusCode(result: ApiResponseInterface<any>): number {
    return result.success ? 201 : 400;
  }

  private handleError(error: any, res: Response): void {
    console.error('Controller error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
}
```

### 2. طبقة التطبيق (Application)

```typescript
// src/modules/user/application/services/user-app.service.ts
export class UserAppService {
  constructor(
    private readonly userRepository: UserRepositoryImpl,
    private readonly otpService: OTPService,
    private readonly jwtService: JwtService
  ) {}

  async createUser(input: CreateUser): Promise<ApiResponseInterface<CreateUserResponse>> {
    try {
      // التحقق من صحة البيانات
      const validationResult = this.validateUserInput(input);
      if (!validationResult.isValid) {
        return ErrorBuilder.build(ErrorCode.VALIDATION_ERROR, validationResult.errors.join(', '));
      }

      // التحقق من عدم وجود المستخدم
      const existingUser = await this.userRepository.getUserByEmail(input.email);
      if (existingUser) {
        return ErrorBuilder.build(ErrorCode.USER_ALREADY_EXISTS, 'Email already exists');
      }

      // إنشاء المستخدم
      const user = await this.userRepository.createUser(input);

      // إرسال OTP للتحقق
      const otpResult = await this.sendVerificationOTP(user.email);
      if (!otpResult.success) {
        return ErrorBuilder.build(ErrorCode.OTP_SEND_FAILED, 'Failed to send verification email');
      }

      // إنشاء JWT token
      const token = this.jwtService.generateToken({
        userId: user.id,
        email: user.email,
        role: user.role
      });

      return ResponseBuilder.success({
        token,
        username: user.username,
        role: user.role
      }, 'User created successfully');

    } catch (error) {
      console.error('UserAppService.createUser error:', error);
      return ErrorBuilder.build(ErrorCode.INTERNAL_SERVER_ERROR, 'Failed to create user');
    }
  }

  private validateUserInput(input: CreateUser): ValidationResult {
    const errors: string[] = [];

    if (!input.email || !this.isValidEmail(input.email)) {
      errors.push('Invalid email format');
    }

    if (!input.password || input.password.length < 8) {
      errors.push('Password must be at least 8 characters');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
```

### 3. طبقة النطاق (Domain)

```typescript
// src/modules/user/domain/entities/user.entity.ts
export interface User {
  id: string;
  email: string;
  username?: string;
  password: string;
  role: UserRole;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// src/modules/user/domain/repositories/user.repository.ts
export interface userInterface {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: CreateUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  deleteUser(id: string): Promise<boolean>;
}
```

### 4. طبقة البنية التحتية (Infrastructure)

```typescript
// src/modules/user/infrastructure/repositories/user.repository.impl.ts
export class UserRepositoryImpl implements userInterface {
  constructor(private readonly db: DrizzleDatabase) {}

  async createUser(user: CreateUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(user.password, 12);
    
    const [newUser] = await this.db
      .insert(users)
      .values({
        id: generateId(),
        email: user.email,
        password: hashedPassword,
        username: user.username,
        role: 'user',
        isVerified: false,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    return newUser;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    return user;
  }
}
```

## أفضل الممارسات في التطوير

### 1. إدارة الأخطاء

```typescript
// src/infrastructure/shared/common/errors/errorBuilder.ts
export class ErrorBuilder {
  static build(
    code: ErrorCode,
    message: string,
    details?: string
  ): ApiResponseInterface<null> {
    return {
      success: false,
      error: {
        code,
        message,
        details,
        timestamp: new Date().toISOString()
      }
    };
  }
}

// استخدام ErrorBuilder
try {
  // منطق التطبيق
} catch (error) {
  return ErrorBuilder.build(
    ErrorCode.INTERNAL_SERVER_ERROR,
    'Operation failed',
    error instanceof Error ? error.message : 'Unknown error'
  );
}
```

### 2. بناء الاستجابات

```typescript
// src/infrastructure/shared/common/apiResponse/apiResponseBuilder.ts
export class ResponseBuilder {
  static success<T>(
    data: T,
    message?: string
  ): ApiResponseInterface<T> {
    return {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString()
    };
  }

  static paginated<T>(
    data: T[],
    pagination: PaginationInfo,
    message?: string
  ): ApiResponseInterface<PaginatedResponse<T>> {
    return {
      success: true,
      data: {
        items: data,
        pagination
      },
      message,
      timestamp: new Date().toISOString()
    };
  }
}
```

### 3. التحقق من البيانات

```typescript
// src/modules/user/application/dtos/create-user.dto.ts
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const CreateUserSchema = createInsertSchema(users, {
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  username: z.string().min(3, 'Username must be at least 3 characters')
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  isVerified: true
});

export type CreateUser = z.infer<typeof CreateUserSchema>;

// استخدام في Controller
export const validateCreateUser = (data: any): CreateUser => {
  return CreateUserSchema.parse(data);
};
```

### 4. Dependency Injection

```typescript
// src/modules/user/interfaces/factories/user.factories.ts
export function createUserController(): UserController {
  // إنشاء Repository
  const userRepository = new UserRepositoryImpl();
  
  // إنشاء Services
  const emailService = new EmailService();
  const otpService = new OTPService(emailService);
  const jwtService = new JwtService();
  const facebookAuthService = new FacebookPageService();
  
  // إنشاء Application Service
  const userAppService = new UserAppService(
    userRepository,
    otpService,
    jwtService,
    facebookAuthService
  );
  
  // إنشاء Controller
  return new UserController(userAppService);
}
```

## إدارة قاعدة البيانات

### 1. Schema Definition

```typescript
// src/infrastructure/shared/schema/schema.ts
export const users = pgTable('users', {
  id: varchar('id', { length: 255 }).primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  username: varchar('username', { length: 255 }),
  password: varchar('password', { length: 255 }).notNull(),
  role: userRoleEnum('role').default('user').notNull(),
  isVerified: boolean('is_verified').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const advertising = pgTable('advertising', {
  id: varchar('id', { length: 255 }).primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  status: adStatusEnum('status').default('pending').notNull(),
  userId: varchar('user_id', { length: 255 }).references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});
```

### 2. Migrations

```bash
# إنشاء migration جديد
npm run db:generate

# تطبيق migrations
npm run db:migrate

# دفع التغييرات مباشرة (للتطوير فقط)
npm run db:push
```

### 3. Queries

```typescript
// استخدام Drizzle ORM
export class UserRepositoryImpl {
  async getUsersWithPagination(
    page: number = 1,
    limit: number = 10
  ): Promise<{ users: User[]; total: number }> {
    const offset = (page - 1) * limit;
    
    const [users, totalCount] = await Promise.all([
      this.db
        .select()
        .from(users)
        .limit(limit)
        .offset(offset)
        .orderBy(desc(users.createdAt)),
      
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(users)
    ]);

    return {
      users,
      total: totalCount[0].count
    };
  }

  async getUserWithAds(userId: string): Promise<UserWithAds | undefined> {
    const result = await this.db
      .select()
      .from(users)
      .leftJoin(advertising, eq(users.id, advertising.userId))
      .where(eq(users.id, userId));

    if (result.length === 0) return undefined;

    const user = result[0].users;
    const ads = result
      .map(row => row.advertising)
      .filter(ad => ad !== null);

    return {
      ...user,
      ads
    };
  }
}
```

## الاختبار

### 1. Unit Tests

```typescript
// src/modules/user/tests/application/application.test.ts
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { UserAppService } from '../../application/services/user-app.service';

describe('UserAppService', () => {
  let userAppService: UserAppService;
  let mockUserRepository: jest.Mocked<UserRepositoryImpl>;
  let mockOtpService: jest.Mocked<OTPService>;
  let mockJwtService: jest.Mocked<JwtService>;

  beforeEach(() => {
    mockUserRepository = {
      getUserByEmail: jest.fn(),
      createUser: jest.fn(),
      // ... باقي الطرق
    } as any;

    mockOtpService = {
      sendOTP: jest.fn(),
      // ... باقي الطرق
    } as any;

    mockJwtService = {
      generateToken: jest.fn(),
      // ... باقي الطرق
    } as any;

    userAppService = new UserAppService(
      mockUserRepository,
      mockOtpService,
      mockJwtService
    );
  });

  describe('createUser', () => {
    it('should create user successfully', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        username: 'testuser'
      };

      const mockUser = {
        id: 'user-id',
        email: userData.email,
        username: userData.username,
        role: 'user' as const
      };

      mockUserRepository.getUserByEmail.mockResolvedValue(undefined);
      mockUserRepository.createUser.mockResolvedValue(mockUser as any);
      mockOtpService.sendOTP.mockResolvedValue({ success: true });
      mockJwtService.generateToken.mockReturnValue('jwt-token');

      // Act
      const result = await userAppService.createUser(userData);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.token).toBe('jwt-token');
      expect(mockUserRepository.createUser).toHaveBeenCalledWith(userData);
    });

    it('should return error if user already exists', async () => {
      // Arrange
      const userData = {
        email: 'existing@example.com',
        password: 'password123',
        username: 'testuser'
      };

      const existingUser = {
        id: 'existing-id',
        email: userData.email
      };

      mockUserRepository.getUserByEmail.mockResolvedValue(existingUser as any);

      // Act
      const result = await userAppService.createUser(userData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('USER_ALREADY_EXISTS');
    });
  });
});
```

### 2. Integration Tests

```typescript
// src/modules/user/tests/interfaces/interfaces.test.ts
import request from 'supertest';
import app from '../../../api/index';

describe('User API', () => {
  describe('POST /api/auth/register', () => {
    it('should register new user', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'password123',
        username: 'newuser'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
    });

    it('should return error for invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'password123',
        username: 'testuser'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});
```

### 3. تشغيل الاختبارات

```bash
# تشغيل جميع الاختبارات
npm test

# تشغيل الاختبارات مع التغطية
npm run test:coverage

# تشغيل اختبارات محددة
npm test -- --grep "UserAppService"

# تشغيل الاختبارات في وضع المراقبة
npm run test:watch
```

## التطوير مع Git

### 1. Git Flow

```bash
# إنشاء فرع جديد للميزة
git checkout -b feature/user-authentication

# عمل commit للميزة
git add .
git commit -m "feat: add user authentication with JWT"

# دفع الفرع
git push origin feature/user-authentication

# إنشاء Pull Request
# دمج الفرع بعد المراجعة
```

### 2. Conventional Commits

```bash
# أنواع Commits
feat: إضافة ميزة جديدة
fix: إصلاح خطأ
docs: تحديث الوثائق
style: تغييرات في التنسيق
refactor: إعادة هيكلة الكود
test: إضافة أو تعديل الاختبارات
chore: مهام الصيانة

# أمثلة
git commit -m "feat(auth): add OAuth2 integration with Google"
git commit -m "fix(payment): resolve Paymob webhook validation issue"
git commit -m "docs(api): update authentication endpoints documentation"
```

### 3. Pre-commit Hooks

```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  },
  "lint-staged": {
    "*.{ts,js}": [
      "eslint --fix",
      "prettier --write"
    ]
  }
}
```

## الأدوات والمساعدات

### 1. ESLint Configuration

```json
// .eslintrc.json
{
  "extends": [
    "@typescript-eslint/recommended",
    "prettier"
  ],
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint"],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "@typescript-eslint/no-explicit-any": "warn"
  }
}
```

### 2. Prettier Configuration

```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2
}
```

### 3. TypeScript Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*", "api/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

## Debugging

### 1. VS Code Configuration

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug API",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/api/index.ts",
      "runtimeArgs": ["-r", "ts-node/register"],
      "env": {
        "NODE_ENV": "development"
      },
      "console": "integratedTerminal"
    }
  ]
}
```

### 2. Logging

```typescript
// src/infrastructure/shared/common/logger.ts
export class Logger {
  static info(message: string, meta?: any): void {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, meta || '');
  }

  static error(message: string, error?: any): void {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error || '');
  }

  static warn(message: string, meta?: any): void {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, meta || '');
  }

  static debug(message: string, meta?: any): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${new Date().toISOString()} - ${message}`, meta || '');
    }
  }
}
```

## الأداء والتحسين

### 1. Database Indexing

```typescript
// إضافة فهارس للاستعلامات المتكررة
export const users = pgTable('users', {
  id: varchar('id', { length: 255 }).primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  // ... باقي الحقول
}, (table) => ({
  emailIdx: index('users_email_idx').on(table.email),
  createdAtIdx: index('users_created_at_idx').on(table.createdAt),
}));
```

### 2. Caching

```typescript
// استخدام Redis للتخزين المؤقت
export class CacheService {
  private redis: Redis;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL!);
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.redis.get(key);
    return value ? JSON.parse(value) : null;
  }

  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    await this.redis.setex(key, ttl, JSON.stringify(value));
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }
}
```

### 3. Connection Pooling

```typescript
// إعداد connection pool لقاعدة البيانات
export const db = drizzle(postgres(process.env.DATABASE_URL!, {
  max: 20, // الحد الأقصى للاتصالات
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
}));
```

---

باتباع هذا الدليل، ستتمكن من تطوير منصة التسويق الرقمي بكفاءة عالية مع الحفاظ على جودة الكود وقابلية الصيانة.
