import { Request, Response } from "express";
import { PaymentService } from "../../application/services/payment.service";

export class PaymentController {
    constructor(
        private readonly paymentService: PaymentService
    ) {}

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