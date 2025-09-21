// api/index.ts
import express from 'express';

import { createUserController } from "../src/modules/user/interfaces/factories/user.factories";
import { createPaymentController } from "../src/modules/payment/interfaces/factories/payment.factory";

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

app.post('/webhook', (req,res) => paymentController.webhook(req,res))

// Local dev listener (ignored on Vercel)
app.listen(4000, () => console.log('Server running on http://localhost:4000'));

export default app;