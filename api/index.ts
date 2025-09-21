// api/index.ts
import express from 'express';

import { createUserController } from "../src/modules/user/interfaces/factories/user.factories";
import { createPaymentController } from "../src/modules/payment/interfaces/factories/payment.factory";
import { AuthenticatedRequest } from "../src/modules/payment/interfaces/controllers/payment.controller";
import { authenticateToken } from "../src/modules/user/application/services/auth-app.service";

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


// payment with stripe

app.post('/webhook', (req,res) => paymentController.webhook(req,res))

app.post('/api/payment/createSessionUrl' , authenticateToken ,(req ,res) => paymentController.createSession(req as AuthenticatedRequest ,res))

// Local dev listener (ignored on Vercel)
app.listen(3000, () => console.log('Server running on http://localhost:3000'));

export default app;