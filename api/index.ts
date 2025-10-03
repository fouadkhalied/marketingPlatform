// api/index.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import compression from 'compression';
import hpp from 'hpp';
import multer from "multer";


import { createUserController } from "../src/modules/user/interfaces/factories/user.factories";
import { createPaymentController } from "../src/modules/payment/interfaces/factories/payment.factory";
import { AuthMiddleware } from "../src/infrastructure/shared/common/auth/module/authModule";
import { UserRole } from "../src/infrastructure/shared/common/auth/enums/userRole";
import { CheckVerificationRequest } from "../src/modules/user/interfaces/controllers/user.controller";
import { createAdvertisingController } from "../src/modules/advertising/interfaces/factories/advertising.factory";
import { createAuthController } from "../src/modules/auth/interfaces/factories/auth.controller.factory";
import passport from 'passport';

const app = express();
const upload = multer();

// ============================================
// 1. SECURITY HEADERS & HELMET
// ============================================
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
  crossOriginEmbedderPolicy: false, // Adjust based on your needs
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

app.use(passport.initialize());



// ============================================
// 2. RATE LIMITING
// ============================================

// Global rate limit
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth endpoints rate limit (stricter)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit auth attempts
  message: {
    error: 'Too many authentication attempts, please try again later.',
  },
  skipSuccessfulRequests: true, // Don't count successful requests
});

// Password reset rate limit (very strict)
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Only 3 password reset attempts per hour
  message: {
    error: 'Too many password reset attempts, please try again in an hour.',
  },
});

// Registration rate limit
const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // Only 3 registration attempts per hour per IP
  message: {
    error: 'Too many registration attempts, please try again later.',
  },
});

// Slow down middleware for additional protection
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 100, // Allow 100 requests per 15 minutes at full speed
  delayMs: () => 500, // Add 500ms delay for each request after delayAfter (v2 syntax)
  maxDelayMs: 20000, // Maximum delay of 20 seconds
});

// ============================================
// 3. INPUT SANITIZATION & VALIDATION
// ============================================

// Prevent NoSQL injection attacks

// Prevent HTTP Parameter Pollution
app.use(hpp({
  whitelist: ['tags', 'categories'] // Allow duplicate params for specific fields if needed
}));

// ============================================
// 4. COMPRESSION & CORS
// ============================================
app.use(compression());

// CORS with security considerations
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      "http://localhost:3000",
      "http://localhost:3001", 
      "http://localhost:3002",
      "http://localhost:3003",
      "http://localhost:5000",
      "https://marketing-platform-six.vercel.app"
    ];
    
    // Allow requests with no origin (mobile apps, curl, etc.)
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
  maxAge: 86400, // Cache preflight response for 24 hours
}));

// ============================================
// 5. BODY PARSING WITH SIZE LIMITS
// ============================================

// Apply raw body parser specifically to webhook route BEFORE other middleware
app.use('/webhook', express.raw({ 
  type: 'application/json',
  limit: '1mb' // Limit webhook payload size
}));

// JSON parsing with size limit
app.use((req, res, next) => {
  if (req.path !== '/webhook') {
    express.json({ 
      limit: '10mb', // Adjust based on your needs
      strict: true // Only parse objects and arrays
    })(req, res, next);
  } else {
    next();
  }
});

app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb',
  parameterLimit: 20 // Limit number of parameters
}));

// ============================================
// 6. CUSTOM SECURITY MIDDLEWARE
// ============================================

// Request logging middleware (for monitoring)
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const ip = req.ip || req.connection.remoteAddress;
  console.log(`[${timestamp}] ${req.method} ${req.path} - ${ip} - ${req.get('User-Agent')}`);
  next();
});

// Security headers middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.removeHeader('X-Powered-By');
  next();
});



// Sanitize input middleware
const sanitizeInput = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Remove dangerous fields that should never be in user input
  const dangerousFields = ['role', 'isAdmin', 'permissions', '__proto__', 'constructor'];
  
  const sanitizeObject = (obj: any): any => {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    const sanitized: any = {};
    for (const key in obj) {
      if (dangerousFields.includes(key)) {
        console.warn(`⚠️ Blocked dangerous field: ${key}`);
        continue; // Skip dangerous fields
      }
      
      if (typeof obj[key] === 'string') {
        // Basic string sanitization
        sanitized[key] = obj[key].trim();
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



// ============================================
// 8. CONTROLLER SETUP
// ============================================

const authController = createAuthController();
authController.setGoogleStrategy();

const userController = createUserController();
const paymentController = createPaymentController();
const advertisingController = createAdvertisingController();


// Apply global rate limiting and security
app.use(globalLimiter);
app.use(speedLimiter);

// ============================================
// 9. ROUTES WITH SECURITY
// ============================================

// Health check (no rate limiting)
app.get('/', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Auth routes with rate limiting and input sanitization
app.post('/api/auth/register', 
  registrationLimiter,
  sanitizeInput,
  (req, res) => userController.createUser(req, res)
);

app.post('/api/auth/verify', 
  authLimiter,
  (req, res) => userController.verifyUser(req, res)
);

app.post('/api/auth/resend-otp', 
  authLimiter,
  (req, res) => userController.resendVerificationOTP(req, res)
);

app.get('/api/auth/verification-status',
  (req, res) => userController.checkVerificationStatus(req as CheckVerificationRequest, res)
);

app.post('/api/auth/login', 
  authLimiter,
  sanitizeInput,
  (req, res) => userController.login(req, res)
);

app.post('/api/auth/password-reset-email', 
  passwordResetLimiter,
  (req, res) => userController.sendPasswordResetEmail(req, res)
);

app.post('/api/auth/password-reset', 
  passwordResetLimiter,
  (req, res) => userController.updatePassword(req, res)
);


// google auth routes
app.get(
  '/api/auth/google',
  (req, res, next) => authController.googleAuth(req, res, next)
);

app.get(
  '/api/auth/google/login',
  (req, res, next) => authController.googleAuthCallback(req, res, next)
);

app.get(
  '/api/auth/google/generateAuthUrl',
  (req, res) => authController.generateGoogleAuthUrl(req, res)
);

app.get(
  '/api/auth/google/failure',
  (req, res) => authController.authFailure(req, res)
);

app.post(
  '/api/auth/google/logout',
  (req, res) => authController.logout(req, res)
);

app.get(
  '/api/auth/google/me',
  (req, res) => authController.me(req, res)
);

// facebook auth routes

// facebook auth routes
app.get(
  '/api/auth/facebook',
  (req, res) => authController.facebookAuth(req, res)
);

app.get(
  '/api/auth/facebook/login',
  (req, res) => authController.facebookAuthCallback(req, res)
);

app.get(
  '/api/auth/facebook/generateUserAuthUrl',
  (req, res) => authController.generateFacebookAuthUrl(req, res)
);

// Payment routes
app.post('/webhook', (req, res) => paymentController.webhook(req, res));

app.post('/api/payment/createSessionUrl', 
  AuthMiddleware(UserRole.USER),
  (req, res) => paymentController.createSession(req, res)
);

app.get('/api/payment/history',AuthMiddleware(UserRole.USER),
(req, res) => paymentController.getPurchaseHistory(req, res))

app.get('/api/payment/getPurchaseHistoryForAdmin',AuthMiddleware(UserRole.ADMIN),
(req, res) => paymentController.getPurchaseHistoryForAdmin(req, res))


// Adverstising routes

app.get("/api/advertising/search", AuthMiddleware(UserRole.USER), (req,res) => advertisingController.getAdsByTitle(req,res))

app.post('/api/advertising',AuthMiddleware(UserRole.USER), (req,res) => advertisingController.createAd(req,res)) 

app.post('/api/advertising/uploadPhoto/:id',AuthMiddleware(UserRole.USER), upload.single("photo"), (req,res) => advertisingController.uploadPhotoToAd(req,res))

app.get(
  "/api/advertising/listApprovedAdsForUser",
  AuthMiddleware(UserRole.USER),
  (req, res) => advertisingController.listApprovedAdsForUser(req, res)
);

app.get(
  "/api/advertising/list",
  AuthMiddleware(UserRole.USER),
  (req, res) => advertisingController.listAds(req, res)
);

app.get(
  "/api/advertising/list/userPages",
  AuthMiddleware(UserRole.USER),
  (req,res) => advertisingController.getAllPagesForUser(req,res)
)

app.get(
  "/api/advertising/list/pages/:pageId/posts",
  AuthMiddleware(UserRole.USER),
  (req,res) => advertisingController.getPostsFromPage(req,res)
)

app.get(
  "/api/advertising/insights/pages/:pageId/posts/:postId",
  AuthMiddleware(UserRole.USER),
  (req,res) => advertisingController.getPostInsights(req,res)
)
app.post(
  "/api/advertising/:id/assign-credit",
  AuthMiddleware(UserRole.USER),
  sanitizeInput,
  (req,res)=>advertisingController.assignCreditToAd(req,res)
)
app.put(
  "/api/advertising/:id/approve",
  AuthMiddleware(UserRole.ADMIN),
  (req, res) => advertisingController.approveAd(req, res)
);

app.put(
  "/api/advertising/:id/reject",
  AuthMiddleware(UserRole.ADMIN),
  (req, res) => advertisingController.rejectAd(req, res)
);

app.get(
  "/api/advertising/:id",
  AuthMiddleware(UserRole.USER),
  (req, res) => advertisingController.getAd(req, res)
);

app.put(
  "/api/advertising/:id",
  AuthMiddleware(UserRole.USER),
  (req, res) => advertisingController.updateAd(req, res)
);

app.delete(
  "/api/advertising/:id",
  AuthMiddleware(UserRole.USER),
  (req, res) => advertisingController.deleteAd(req, res)
);

// facebook Outh
app.get('/api/auth/facebook/callback',(req,res) => userController.facebookOAuth(req,res));

app.get('/api/auth/facebook/generateAuthUrl', AuthMiddleware(UserRole.USER), (req,res) => userController.generateFacebookAuthUrl(req,res))

// get users 
app.get('/api/users',AuthMiddleware(UserRole.ADMIN),(req,res) => userController.getUsers(req,res));

app.get('/api/user/userDetails/:id',AuthMiddleware(UserRole.USER),(req,res) => userController.getUser(req,res));

// delete user
app.delete('/api/users/:id',AuthMiddleware(UserRole.ADMIN),(req,res) => userController.deleteUser(req,res));

// promote user to admin 
app.put('/api/users/promote/:id',AuthMiddleware(UserRole.ADMIN),(req,res) => userController.makeUserAdmin(req,res));

// click on ad
app.put(
  "/api/users/ad/:id/click",
  AuthMiddleware(UserRole.USER),
  (req, res) => userController.createAdClick(req, res)
);

// ============================================
// 10. ERROR HANDLING
// ============================================

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  
  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(err.status || 500).json({
    error: isDevelopment ? err.message : 'Internal server error',
    ...(isDevelopment && { stack: err.stack })
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');  
  process.exit(0);
});

// Local dev listener (ignored on Vercel)
if (process.env.NODE_ENV !== 'production') {
  app.listen(3000, () => console.log('🚀 Secure server running on http://localhost:3000'));
}

export default app;