// api/index.ts
import express, { Request } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import compression from 'compression';
import hpp from 'hpp';
import multer from "multer";
import fs from "fs";
import https from "https";
import http from "http";

import { createPaymentController } from "../src/modules/payment/interfaces/factories/payment.factory";
import { AuthMiddleware } from "../src/infrastructure/shared/common/auth/module/authModule";
import { UserRole } from "../src/infrastructure/shared/common/auth/enums/userRole";
import { createAllAdvertisingControllers } from "../src/modules/advertising/interfaces/factories/advertising.factory";
import { setupAdvertisingRoutes } from "../src/modules/advertising/interfaces/routes/advertising.routes";
import { createAuthController } from "../src/modules/auth/interfaces/factories/auth.controller.factory";
import { connectMongoDB } from "../src/infrastructure/db/mongodb-connection";
import { createBlogComponentsWithPhoto } from "../src/modules/blogs/interfaces/factories/blog.factory";
import { setupBlogRoutes } from "../src/modules/blogs/interfaces/routes/blog.routes";
import { setupDashboardRoutes } from "../src/modules/dashboard/interfaces/routes/dashboard.routes";
import { createAllUserControllers } from "../src/modules/user/interfaces/factories/user.factory";
import { setupUserRoutes } from "../src/modules/user/interfaces/routes/user.routes";
import {createNotificationFactory} from "../src/infrastructure/shared/notification/interfaces/factories/notification.factory"
import {setupNotificationRoutes} from "../src/infrastructure/shared/notification/interfaces/routes/notifications.routes"
import passport from 'passport';

const app = express();
const upload = multer();

// certificate options
const options = {
  key: fs.readFileSync("/etc/letsencrypt/live/octopusad.com/privkey.pem"),
  cert: fs.readFileSync("/etc/letsencrypt/live/octopusad.com/fullchain.pem"),
};

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
  max: 10000, // Limit auth attempts
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
  max: 10000, // Only 3 registration attempts per hour per IP
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
      "http://octopusad.com",
      "https://octopusad.com",
      "https://octopusad.com/"
    ];
    
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ["GET", "POST","PATCH", "PUT", "DELETE", "OPTIONS"],
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
const notificationResult = createNotificationFactory();
const { notificationService, sseChannel, notificationController } = notificationResult;

if (!notificationService) {
  console.error("❌ Failed to create NotificationService", notificationResult);
  throw new Error("NotificationService initialization failed");
}

if (!sseChannel) {
  console.error("❌ Failed to create NotificationService", notificationResult);
  throw new Error("NotificationService initialization failed");
}

console.log("✅ NotificationService created successfully:", {
  hasNotificationService: !!notificationService,
  hasSseChannel: !!sseChannel
});

const authController = createAuthController();
authController.setGoogleStrategy();

const userControllers = createAllUserControllers();
const paymentController = createPaymentController();
const advertisingController = createAllAdvertisingControllers(notificationService);


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

app.get('/webhook', (req,res) => paymentController.handleRedirect(req,res));

app.post('/api/payment/createSessionUrl',
  AuthMiddleware(UserRole.USER),
  (req, res) => paymentController.createSession(req, res)
);

app.get('/api/payment/history',AuthMiddleware(UserRole.USER),
(req, res) => paymentController.getPurchaseHistory(req, res));

app.get('/api/payment/getPurchaseHistoryForAdmin',AuthMiddleware(UserRole.ADMIN),
(req, res) => paymentController.getPurchaseHistoryForAdmin(req, res));

app.post('/api/sensor-data', (req,res) => {
  console.log('\n╔════════════════════════════════════════════════════╗');
  console.log('║         📊 NEW SENSOR DATA RECEIVED                ║');
  console.log('╚════════════════════════════════════════════════════╝');
  
  const data = req.body;
  const health = data.sensor_health;
  
  // Display timestamp and uptime
  console.log('\n⏰ TIMING INFO:');
  console.log('─────────────────────────────────────────────────────');
  console.log(`   Received at: ${new Date().toISOString()}`);
  console.log(`   ESP32 Timestamp: ${data.timestamp}ms`);
  console.log(`   ESP32 Uptime: ${health.uptime_seconds}s (${Math.floor(health.uptime_seconds / 60)}m ${health.uptime_seconds % 60}s)`);
  
  // Display sensor health status
  console.log('\n🏥 SENSOR HEALTH STATUS:');
  console.log('─────────────────────────────────────────────────────');
  
  // DS18B20 Temperature Sensor
  const tempIcon = health.ds18b20_connected ? '✅' : '❌';
  console.log(`   ${tempIcon} DS18B20 Temperature Sensor: ${health.ds18b20_connected ? 'CONNECTED' : 'DISCONNECTED'}`);
  console.log(`      • Devices found: ${health.ds18b20_device_count}`);
  console.log(`      • Reading valid: ${health.temperature_valid ? 'Yes ✅' : 'No ❌'}`);
  
  if (!health.ds18b20_connected) {
    console.log('      ⚠️  TROUBLESHOOTING:');
    console.log('         - Check wiring (VCC→3.3V, DATA→GPIO4, GND→GND)');
    console.log('         - Verify 4.7kΩ pull-up resistor between DATA and VCC');
    console.log('         - Test with multimeter (DATA pin should read 3.3V)');
  }
  
  // Turbidity Sensor
  const turbIcon = health.turbidity_connected ? '✅' : '❌';
  console.log(`   ${turbIcon} Turbidity Sensor: ${health.turbidity_connected ? 'CONNECTED' : 'DISCONNECTED'}`);
  console.log(`      • Reading valid: ${health.turbidity_valid ? 'Yes ✅' : 'No ❌'}`);
  
  if (!health.turbidity_connected) {
    console.log('      ⚠️  TROUBLESHOOTING:');
    console.log('         - Check wiring (VCC→5V, ANALOG→GPIO19, GND→GND)');
    console.log('         - Sensor must be powered BEFORE WiFi connects');
    console.log('         - GPIO 19 is ADC2 (reading saved before WiFi)');
  }
  
  // WiFi Status
  const wifiIcon = health.wifi_rssi > -70 ? '📶' : '📉';
  const wifiQuality = health.wifi_rssi > -50 ? 'Excellent' : 
                      health.wifi_rssi > -60 ? 'Good' : 
                      health.wifi_rssi > -70 ? 'Fair' : 'Weak';
  console.log(`   ${wifiIcon} WiFi Signal: ${health.wifi_rssi} dBm (${wifiQuality})`);
  
  // Display sensor readings
  console.log('\n📊 SENSOR READINGS:');
  console.log('─────────────────────────────────────────────────────');
  
  // Temperature Reading
  const tempStatus = health.temperature_valid ? '✅' : '⚠️';
  console.log(`   ${tempStatus} Temperature: ${data.temperature}°C`);
  if (data.temperature === -127) {
    console.log('      ❌ ERROR: -127°C indicates sensor disconnected!');
  } else if (!health.temperature_valid) {
    console.log('      ⚠️  WARNING: Temperature out of valid range (-55 to 125°C)');
  }
  
  // Turbidity Readings
  const turbStatus = health.turbidity_valid ? '✅' : '⚠️';
  console.log(`   ${turbStatus} Turbidity Raw: ${data.turbidity_raw}`);
  console.log(`      • Voltage: ${data.turbidity_voltage.toFixed(3)}V`);
  console.log(`      • NTU: ${data.turbidity_ntu.toFixed(2)}`);
  
  if (data.turbidity_raw === 0) {
    console.log('      ❌ ERROR: Raw value is 0 - sensor not connected!');
  } else if (data.turbidity_raw === 4095) {
    console.log('      ⚠️  WARNING: Raw value maxed out (4095)');
  }
  
  // Overall System Status
  console.log('\n🔍 OVERALL SYSTEM STATUS:');
  console.log('─────────────────────────────────────────────────────');
  
  const allSensorsWorking = health.ds18b20_connected && health.turbidity_connected;
  const anyIssues = !health.temperature_valid || !health.turbidity_valid || 
                    !health.ds18b20_connected || !health.turbidity_connected;
  
  if (allSensorsWorking && !anyIssues) {
    console.log('   ✅ ALL SYSTEMS OPERATIONAL');
  } else {
    console.log('   ⚠️  SYSTEM ISSUES DETECTED:');
    
    if (!health.ds18b20_connected) {
      console.log('      • Temperature sensor disconnected');
    }
    if (!health.turbidity_connected) {
      console.log('      • Turbidity sensor disconnected');
    }
    if (!health.temperature_valid) {
      console.log('      • Temperature reading invalid');
    }
    if (!health.turbidity_valid) {
      console.log('      • Turbidity reading invalid');
    }
  }
  
  // Complete JSON dump
  console.log('\n📦 COMPLETE JSON PAYLOAD:');
  console.log('─────────────────────────────────────────────────────');
  console.log(JSON.stringify(data, null, 2));
  console.log('─────────────────────────────────────────────────────\n');
  
  // Send success response
  res.status(200).json({
    success: true,
    message: allSensorsWorking ? 'All sensors operational' : 'Sensor issues detected',
    received_at: new Date().toISOString(),
    system_status: {
      all_sensors_connected: allSensorsWorking,
      issues_detected: anyIssues,
      temperature_sensor: health.ds18b20_connected ? 'OK' : 'DISCONNECTED',
      turbidity_sensor: health.turbidity_connected ? 'OK' : 'DISCONNECTED'
    },
    data: data
  });
});


// User routes
const userRoutes = setupUserRoutes(userControllers);
app.use(userRoutes);

// Advertising routes
const advertisingRoutes = setupAdvertisingRoutes(advertisingController);
app.use(advertisingRoutes);

// Blog routes with photo support
const blogComponents = createBlogComponentsWithPhoto();
const blogRoutes = setupBlogRoutes(blogComponents.controllers.blog, blogComponents.controllers.photo);
app.use(blogRoutes);

// Dashboard routes
const dashboardRoutes = setupDashboardRoutes();
app.use(dashboardRoutes);



// notifications routes and seeChannel
const notificationRoutes = setupNotificationRoutes(notificationController,sseChannel)
app.use(notificationRoutes)

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

// Initialize MongoDB connection and start server
async function startServer() {
  try {
    // Connect to MongoDB
    await connectMongoDB();

    // Start HTTPS server on port 3000
    const httpsServer = https.createServer(options, app);

    httpsServer.on("clientError", (err, socket) => {
      socket.destroy();
    });
    
    // ✅ ADD THIS - Actually start the HTTPS server!
    httpsServer.listen(3000, () => {
      console.log("✅ HTTPS Server running on port 3000");
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

const httpApp = express();

httpApp.use('*', (req, res) => {
  const httpsUrl = `https://octopusad.com`;
  console.log(`Redirecting HTTP request to: ${httpsUrl}`);
  res.redirect(301, httpsUrl);
});

// Start HTTP server on port 80
http.createServer(httpApp).listen(4000, () => {
  console.log("✅ HTTP Server running on port 80 (redirecting to HTTPS)");
});

export default app;