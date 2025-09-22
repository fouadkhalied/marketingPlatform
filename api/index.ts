// api/index.ts
import express from 'express';

import { createUserController } from "../src/modules/user/interfaces/factories/user.factories";
import { createPaymentController } from "../src/modules/payment/interfaces/factories/payment.factory";
import { AuthMiddleware } from "../src/infrastructure/shared/common/auth/module/authModule";
import { UserRole } from "../src/infrastructure/shared/common/auth/enums/userRole";
import { CheckVerificationRequest } from "../src/modules/user/interfaces/controllers/user.controller";

const app = express();

// Apply raw body parser specifically to webhook route BEFORE other middleware
app.use('/webhook', express.raw({ type: 'application/json' }));

// Then apply JSON parsing to other routes
app.use((req, res, next) => {
    if (req.path !== '/webhook') {
        express.json()(req, res, next);
    } else {
        next();
    }
});

app.use(express.urlencoded({ extended: true })); 

const userController = createUserController();
const paymentController = createPaymentController();

// Health check
app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/api/auth/register' , (req,res) => userController.createUser(req,res));

app.post('/api/auth/verify', (req,res) => userController.verifyUser(req,res));
app.post('/api/auth/resend-otp', (req,res) => userController.resendVerificationOTP(req,res));
app.get('/api/auth/verification-status', (req,res) => userController.checkVerificationStatus(req as CheckVerificationRequest ,res));
app.post('/api/auth/login', (req,res) => userController.login(req,res))

// payment with stripe

app.post('/webhook', (req,res) => paymentController.webhook(req,res))

app.post('/api/payment/createSessionUrl' , AuthMiddleware(UserRole.ADVERTISER) , (req ,res) => paymentController.createSession(req ,res))

// Local dev listener (ignored on Vercel)
app.listen(3000, () => console.log('Server running on http://localhost:3000'));

export default app;