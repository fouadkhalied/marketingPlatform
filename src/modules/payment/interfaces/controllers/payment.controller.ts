import { Request, Response } from "express";
import { PaymentService } from "../../application/services/payment.service";
import { WebhookService } from "../../application/services/webhook.service";

export class PaymentController {
    constructor(
        private readonly paymentService: PaymentService
    ) {}

    async webhook(req : Request, res : Response) {
        try {
            const signature = req.headers['stripe-signature'] as string;
            await this.paymentService.processWebhook(req.body, signature)
            res.json({ received: true });
          } catch (error) {
            console.error('Webhook error:', error);
            res.status(400).send('Webhook Error');
          }
        }
    }

