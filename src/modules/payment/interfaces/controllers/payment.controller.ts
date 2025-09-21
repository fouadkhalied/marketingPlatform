import { Request, Response } from "express";
import { PaymentService } from "../../application/services/payment.service";

export class PaymentController {
    constructor(private readonly paymentService: PaymentService) {}

    async createPayment(req: Request, res: Response) {
        try {
            const payment = await this.paymentService.createPayment(req.body);
            res.status(201).json(payment);
        } catch (err: any) {
            res.status(400).json({ error: err.message });
        }
    }

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

