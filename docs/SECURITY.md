# دليل الأمان (Security Guide)

## نظرة عامة

يغطي هذا الدليل جميع جوانب الأمان في منصة التسويق الرقمي، من حماية البيانات إلى منع الهجمات السيبرانية.

## استراتيجية الأمان

### طبقات الحماية

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                        │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │   Input     │ │  Output     │ │   Session   │           │
│  │ Validation  │ │ Encoding    │ │ Management  │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                   Authentication Layer                      │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │    JWT      │ │   OAuth     │ │   Password  │           │
│  │   Tokens    │ │   2.0       │ │   Hashing   │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    Network Layer                            │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │     SSL     │ │   Rate      │ │   CORS      │           │
│  │   /TLS      │ │ Limiting    │ │  Control    │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

## حماية المصادقة

### 1. JWT Tokens

```typescript
// إعداد JWT مع خيارات أمان متقدمة
export class JwtService {
  private readonly secretKey: string;
  private readonly expiresIn: string;

  constructor() {
    this.secretKey = process.env.JWT_SECRET!;
    this.expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  }

  generateToken(payload: any): string {
    return jwt.sign(payload, this.secretKey, {
      expiresIn: this.expiresIn,
      algorithm: 'HS256',
      issuer: 'marketing-platform',
      audience: 'marketing-platform-users'
    });
  }

  verifyToken(token: string): any {
    try {
      return jwt.verify(token, this.secretKey, {
        algorithms: ['HS256'],
        issuer: 'marketing-platform',
        audience: 'marketing-platform-users'
      });
    } catch (error) {
      throw new Error('Invalid token');
    }
  }
}
```

### 2. تشفير كلمات المرور

```typescript
export class PasswordService {
  private readonly saltRounds = 12;

  async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, this.saltRounds);
  }

  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  validatePasswordStrength(password: string): boolean {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return password.length >= minLength && 
           hasUpperCase && 
           hasLowerCase && 
           hasNumbers && 
           hasSpecialChar;
  }
}
```

### 3. إدارة الجلسات

```typescript
// إعداد Express Session مع خيارات أمان
app.use(session({
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'strict'
  },
  store: new MemoryStore({
    checkPeriod: 86400000 // prune expired entries every 24h
  })
}));
```

## حماية البيانات

### 1. تنظيف البيانات المدخلة

```typescript
// Middleware لتنظيف البيانات
const sanitizeInput = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const dangerousFields = [
    'role', 'isAdmin', 'permissions', '__proto__', 
    'constructor', 'prototype', 'eval', 'function'
  ];
  
  const sanitizeObject = (obj: any): any => {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    const sanitized: any = {};
    for (const key in obj) {
      // منع الحقول الخطيرة
      if (dangerousFields.includes(key)) {
        console.warn(`⚠️ Blocked dangerous field: ${key}`);
        continue;
      }
      
      if (typeof obj[key] === 'string') {
        // تنظيف النصوص
        sanitized[key] = obj[key]
          .trim()
          .replace(/[<>]/g, '') // منع HTML tags
          .replace(/javascript:/gi, '') // منع JavaScript URLs
          .replace(/on\w+=/gi, ''); // منع event handlers
      } else if (typeof obj[key] === 'object') {
        sanitized[key] = sanitizeObject(obj[key]);
      } else {
        sanitized[key] = obj[key];
      }
    }
    return sanitized;
  };
  
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  
  next();
};
```

### 2. التحقق من صحة البيانات

```typescript
// استخدام Zod للتحقق من البيانات
export const CreateUserSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .min(5, 'Email too short')
    .max(255, 'Email too long'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
           'Password must contain uppercase, lowercase, number and special character'),
  username: z.string()
    .min(3, 'Username too short')
    .max(50, 'Username too long')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers and underscores')
});

export const validateCreateUser = (data: any) => {
  return CreateUserSchema.parse(data);
};
```

### 3. حماية من SQL Injection

```typescript
// استخدام Drizzle ORM مع prepared statements
export class UserRepositoryImpl implements userInterface {
  async getUserByEmail(email: string): Promise<User | undefined> {
    // Drizzle يتعامل تلقائياً مع SQL injection
    const result = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    
    return result[0];
  }

  async createUser(user: CreateUser): Promise<User> {
    // استخدام prepared statements
    const result = await db
      .insert(users)
      .values({
        id: generateId(),
        email: user.email,
        password: await this.hashPassword(user.password),
        username: user.username,
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    return result[0];
  }
}
```

## حماية الشبكة

### 1. HTTPS/TLS

```typescript
// إعداد Helmet للأمان
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

### 2. CORS Configuration

```typescript
// إعداد CORS مع خيارات أمان
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      "http://localhost:3000",
      "https://marketing-platform.vercel.app",
      "https://your-domain.com"
    ];
    
    // السماح للطلبات بدون origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  credentials: true,
  maxAge: 86400 // Cache preflight response for 24 hours
}));
```

### 3. Rate Limiting

```typescript
// Rate limiting متعدد المستويات
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: { error: 'Too many requests from this IP' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit auth attempts
  message: { error: 'Too many authentication attempts' },
  skipSuccessfulRequests: true,
});

const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Only 3 password reset attempts per hour
  message: { error: 'Too many password reset attempts' },
});

// Slow down middleware
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 100, // Allow 100 requests per 15 minutes at full speed
  delayMs: () => 500, // Add 500ms delay for each request after delayAfter
  maxDelayMs: 20000, // Maximum delay of 20 seconds
});
```

## حماية التطبيق

### 1. Middleware الأمان

```typescript
// Security headers middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.removeHeader('X-Powered-By');
  next();
});

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('User-Agent') || 'Unknown';
  
  console.log(`[${timestamp}] ${req.method} ${req.path} - ${ip} - ${userAgent}`);
  next();
});
```

### 2. حماية من XSS

```typescript
// تنظيف HTML
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const window = new JSDOM('').window;
const purify = DOMPurify(window);

export const sanitizeHtml = (dirty: string): string => {
  return purify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href', 'title'],
    ALLOW_DATA_ATTR: false
  });
};
```

### 3. حماية من CSRF

```typescript
// CSRF Protection
import csrf from 'csurf';

const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  }
});

// تطبيق CSRF على الطلبات الحساسة
app.post('/api/auth/register', csrfProtection, (req, res) => {
  // معالجة التسجيل
});
```

## حماية قاعدة البيانات

### 1. تشفير البيانات الحساسة

```typescript
import crypto from 'crypto';

export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly secretKey: Buffer;

  constructor() {
    this.secretKey = crypto.scryptSync(process.env.ENCRYPTION_KEY!, 'salt', 32);
  }

  encrypt(text: string): { encrypted: string; iv: string; tag: string } {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.algorithm, this.secretKey);
    cipher.setAAD(Buffer.from('marketing-platform', 'utf8'));

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const tag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex')
    };
  }

  decrypt(encryptedData: { encrypted: string; iv: string; tag: string }): string {
    const decipher = crypto.createDecipher(this.algorithm, this.secretKey);
    decipher.setAAD(Buffer.from('marketing-platform', 'utf8'));
    decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));

    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}
```

### 2. النسخ الاحتياطية المشفرة

```typescript
export class BackupService {
  async createEncryptedBackup(): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = `backup_${timestamp}.sql`;
    
    // إنشاء النسخة الاحتياطية
    const { stdout } = await exec(`pg_dump ${process.env.DATABASE_URL} > ${backupFile}`);
    
    // تشفير النسخة الاحتياطية
    const encryptionService = new EncryptionService();
    const backupContent = await fs.readFile(backupFile, 'utf8');
    const encryptedBackup = encryptionService.encrypt(backupContent);
    
    // حفظ النسخة المشفرة
    await fs.writeFile(`${backupFile}.enc`, JSON.stringify(encryptedBackup));
    
    // حذف النسخة غير المشفرة
    await fs.unlink(backupFile);
  }
}
```

## مراقبة الأمان

### 1. تسجيل الأحداث الأمنية

```typescript
export class SecurityLogger {
  private logFile = 'security.log';

  logSecurityEvent(event: {
    type: 'AUTH_FAILURE' | 'RATE_LIMIT_EXCEEDED' | 'SUSPICIOUS_ACTIVITY' | 'DATA_BREACH_ATTEMPT';
    ip: string;
    userAgent: string;
    details: any;
    timestamp?: Date;
  }): void {
    const logEntry = {
      ...event,
      timestamp: event.timestamp || new Date(),
      severity: this.getSeverityLevel(event.type)
    };

    // تسجيل في الملف
    fs.appendFileSync(this.logFile, JSON.stringify(logEntry) + '\n');

    // إرسال تنبيه للأنشطة عالية الخطورة
    if (logEntry.severity === 'HIGH') {
      this.sendSecurityAlert(logEntry);
    }
  }

  private getSeverityLevel(type: string): 'LOW' | 'MEDIUM' | 'HIGH' {
    const severityMap = {
      'AUTH_FAILURE': 'MEDIUM',
      'RATE_LIMIT_EXCEEDED': 'LOW',
      'SUSPICIOUS_ACTIVITY': 'HIGH',
      'DATA_BREACH_ATTEMPT': 'HIGH'
    };
    
    return severityMap[type] || 'LOW';
  }

  private sendSecurityAlert(event: any): void {
    // إرسال تنبيه عبر البريد الإلكتروني أو Slack
    console.error('🚨 SECURITY ALERT:', event);
  }
}
```

### 2. مراقبة محاولات الاختراق

```typescript
export class IntrusionDetection {
  private failedAttempts = new Map<string, number>();
  private blockedIPs = new Set<string>();

  checkIntrusion(ip: string, success: boolean): boolean {
    if (success) {
      // إعادة تعيين عداد المحاولات الفاشلة
      this.failedAttempts.delete(ip);
      return false;
    }

    // زيادة عداد المحاولات الفاشلة
    const attempts = (this.failedAttempts.get(ip) || 0) + 1;
    this.failedAttempts.set(ip, attempts);

    // حظر IP بعد 5 محاولات فاشلة
    if (attempts >= 5) {
      this.blockedIPs.add(ip);
      console.warn(`🚫 Blocked IP ${ip} due to multiple failed attempts`);
      return true;
    }

    return false;
  }

  isIPBlocked(ip: string): boolean {
    return this.blockedIPs.has(ip);
  }

  unblockIP(ip: string): void {
    this.blockedIPs.delete(ip);
    this.failedAttempts.delete(ip);
  }
}
```

## إدارة المفاتيح

### 1. Key Rotation

```typescript
export class KeyRotationService {
  private currentKeyVersion = 1;
  private keyHistory: Map<number, string> = new Map();

  async rotateKeys(): Promise<void> {
    // إنشاء مفتاح جديد
    const newKey = crypto.randomBytes(64).toString('hex');
    const newVersion = this.currentKeyVersion + 1;

    // حفظ المفتاح الجديد
    this.keyHistory.set(newVersion, newKey);
    this.currentKeyVersion = newVersion;

    // حذف المفاتيح القديمة (الاحتفاظ بالمفتاح السابق فقط)
    if (this.keyHistory.size > 2) {
      const oldestVersion = Math.min(...this.keyHistory.keys());
      this.keyHistory.delete(oldestVersion);
    }

    console.log(`🔄 Keys rotated. New version: ${newVersion}`);
  }

  getCurrentKey(): string {
    return this.keyHistory.get(this.currentKeyVersion)!;
  }

  getKey(version: number): string | undefined {
    return this.keyHistory.get(version);
  }
}
```

## اختبار الأمان

### 1. اختبارات الاختراق

```typescript
describe('Security Tests', () => {
  describe('SQL Injection Protection', () => {
    it('should prevent SQL injection in login', async () => {
      const maliciousInput = "'; DROP TABLE users; --";
      
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: maliciousInput,
          password: 'password'
        });

      expect(response.status).toBe(400);
      // التأكد من أن الجدول لم يتم حذفه
      const users = await db.select().from(usersTable);
      expect(users.length).toBeGreaterThan(0);
    });
  });

  describe('XSS Protection', () => {
    it('should sanitize malicious scripts', async () => {
      const maliciousScript = '<script>alert("XSS")</script>';
      
      const response = await request(app)
        .post('/api/advertising')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          title: maliciousScript,
          description: 'Test ad'
        });

      expect(response.status).toBe(201);
      expect(response.body.data.title).not.toContain('<script>');
    });
  });

  describe('Rate Limiting', () => {
    it('should block excessive requests', async () => {
      const requests = Array(11).fill(null).map(() =>
        request(app).post('/api/auth/login').send({
          email: 'test@example.com',
          password: 'wrongpassword'
        })
      );

      const responses = await Promise.all(requests);
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });
});
```

## خطة الاستجابة للحوادث

### 1. تصنيف الحوادث

```typescript
export enum SecurityIncidentType {
  DATA_BREACH = 'DATA_BREACH',
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  MALWARE_INFECTION = 'MALWARE_INFECTION',
  DDOS_ATTACK = 'DDOS_ATTACK',
  PHISHING_ATTEMPT = 'PHISHING_ATTEMPT'
}

export enum IncidentSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}
```

### 2. خطة الاستجابة

```typescript
export class IncidentResponse {
  async handleIncident(incident: {
    type: SecurityIncidentType;
    severity: IncidentSeverity;
    description: string;
    affectedSystems: string[];
  }): Promise<void> {
    console.log(`🚨 Security Incident: ${incident.type} - ${incident.severity}`);
    
    switch (incident.severity) {
      case IncidentSeverity.CRITICAL:
        await this.handleCriticalIncident(incident);
        break;
      case IncidentSeverity.HIGH:
        await this.handleHighSeverityIncident(incident);
        break;
      case IncidentSeverity.MEDIUM:
        await this.handleMediumSeverityIncident(incident);
        break;
      case IncidentSeverity.LOW:
        await this.handleLowSeverityIncident(incident);
        break;
    }
  }

  private async handleCriticalIncident(incident: any): Promise<void> {
    // إيقاف الخدمة مؤقتاً
    await this.shutdownServices();
    
    // إشعار فريق الأمان
    await this.notifySecurityTeam(incident);
    
    // حفظ الأدلة
    await this.preserveEvidence(incident);
  }
}
```

---

باتباع هذا الدليل الأمني، ستتمكن من حماية منصة التسويق الرقمي من التهديدات السيبرانية المختلفة وضمان أمان البيانات والمستخدمين.
