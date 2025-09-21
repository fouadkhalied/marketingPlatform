import { Request, Response } from "express";
import { PaymentService } from "../../application/services/payment.service";

export interface AuthenticatedRequest extends Request {
  user?: { userId: number; email: string; adsId: number };
}

export class PaymentController {
    constructor(
        private readonly paymentService: PaymentService
    ) {}

    async createSession(req: AuthenticatedRequest, res: Response) {
      try {
          console.log('💳 Creating checkout session');
          console.log('👤 User:', req.user);
          console.log('📦 Request body:', req.body);
          
          // Validation: Check if user is authenticated
          if (!req.user?.userId) {
              return res.status(401).json({ error: 'User not authenticated' });
          }

          // Validation: Check required fields in request body
          const { amount, currency, adId } = req.body;

          if (!amount || amount <= 0) {
              return res.status(400).json({ error: 'Valid amount is required' });
          }

          if (!currency) {
              return res.status(400).json({ error: 'Currency is required' });
          }

          if (!adId) {
              return res.status(400).json({ error: 'Ad ID is required' });
          }

          // Call service after validation passes
          await this.paymentService.createCheckoutSession(req, res);
          
      } catch (error: any) {
          console.error('❌ Create session error:', error);
          res.status(500).json({ 
              error: 'Failed to create checkout session',
              details: error.message 
          });
      }
  }

  // Webhook endpoint
  async webhook(req: Request, res: Response) {
      try {
          console.log('🎣 Webhook received');
          const signature = req.headers['stripe-signature'] as string;
          
          if (!signature) {
              console.error('❌ Missing Stripe signature');
              return res.status(400).send('Missing signature');
          }

          await this.paymentService.processWebhook(req.body, signature);
          
          console.log('✅ Webhook processed successfully');
          res.json({ received: true });
      } catch (error: any) {
          console.error('❌ Webhook error:', error);
          res.status(400).send(`Webhook Error: ${error.message}`);
      }
  }

}