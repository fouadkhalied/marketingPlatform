import { Request, Response } from "express";
import { PaymentService } from "../../application/services/payment.service";
import { appConfig } from "../../../../infrastructure/config/app.config";

export class PaymentController {
    constructor(
        private readonly paymentService: PaymentService
    ) {}

    async createSession(req: Request, res: Response) {
        try {
            console.log('💳 Creating checkout session');
            console.log('👤 User:', req.user);
            console.log('📦 Request body:', req.body);
            
            // Validation: Check if user is authenticated
            if (!req.user?.id) {
                return res.status(401).json({ error: 'User not authenticated' });
            }

            // Validation: Check required fields in request body
            const { amount, currency } = req.body;

            if (!amount || amount <= 0) {
                return res.status(400).json({ error: 'Valid amount is required' });
            }

            if (!currency) {
                return res.status(400).json({ error: 'Currency is required' });
            }

            // Call service after validation passes
            const serviceResponse = await this.paymentService.createCheckoutSession(req, res);

            if (serviceResponse.success) {
                res.status(200).send(serviceResponse);
            } else {
                const statusCode = serviceResponse.error?.details.httpStatus || 500;
                res.status(statusCode).send(serviceResponse);
            } 
        } catch (error: any) {
            console.error('❌ Create session error:', error);
            res.status(500).json({ 
                error: 'Failed to create checkout session',
                details: error.message 
            });
        }
    }

    async webhook(req: Request, res: Response) {
        try {
            console.log("🎣 Paymob webhook received");

            // Paymob sends POST requests with x-www-form-urlencoded payload
            const payload = req.body;

            console.log("Webhook payload:", payload);

            await this.paymentService.processWebhook(payload);

            console.log("✅ Webhook processed successfully");
            return res.status(200).json({ status: "received" });
        } catch (error: any) {
            console.error("❌ Webhook error:", error);
            
            // Return appropriate status based on error type
            if (error.message.includes('signature') || error.message.includes('HMAC')) {
                return res.status(401).json({ error: 'Webhook verification failed' });
            }
            
            return res.status(400).json({ error: `Webhook Error: ${error.message}` });
        }
    }

    async handleRedirect(req: Request, res: Response) {
        try {
            const query = req.query;

            // Extract order/session ID from query
            const orderId = query.order as string;
            if (!orderId) {
                return res.status(400).json({ error: "Missing order ID in query params" });
            }

            console.log(`🔄 Processing redirect for order: ${orderId}`);

            // Check if already processed by webhook
            const existingPayment = await this.paymentService.getPaymentStatus(orderId);
            if (existingPayment?.status === 'completed') {
                console.log('✅ Payment already completed via webhook');
                return res.redirect(`/payment/success?order=${orderId}`);
            }

            // Verify payment via service (server-to-server call)
            const paymentStatus = await this.paymentService.verifyPayment(orderId);

            // Respond or redirect frontend accordingly
            if (paymentStatus.success) {
                // Mark as completed if webhook hasn't processed it yet
                if (!existingPayment || (existingPayment.status as any) !== 'completed') {
                    await this.paymentService.handleCheckoutCompleted({
                        id: orderId,
                        amount_total: paymentStatus.amountTotal,
                        currency: paymentStatus.currency,
                        metadata: paymentStatus.metadata
                    });
                }
                res.redirect(`${appConfig.PAYMOB_SUCCESS_URL}/?order=${orderId}`);
            } else {
                await this.paymentService.markPaymentAsRejected(orderId);
                res.redirect(`${appConfig.PAYMOB_CANCEL_URL}?order=${orderId}`);
            }
        } catch (error: any) {
            console.error("❌ GET /webhook error:", error);
            
            // Fallback to failure page on error
            const orderId = req.query.order as string;
            if (orderId) {
                await this.paymentService.markPaymentAsRejected(orderId).catch(console.error);
                return res.redirect(`/payment/fail?order=${orderId}`);
            }
            
            res.status(500).json({ error: error.message });
        }
    }
    async getPurchaseHistory(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.user!.id;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;

            // Validate pagination params
            if (page < 1 || limit < 1 || limit > 100) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid pagination parameters'
                });
                return;
            }

            const result = await this.paymentService.getPurchaseHistory(userId, page, limit);
            res.status(200).json(result);

        } catch (error) {
            console.error('❌ Controller error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch purchase history'
            });
        }
    }

    async getPurchaseHistoryForAdmin(req: Request, res: Response): Promise<void> {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;

            // Validate pagination params
            if (page < 1 || limit < 1 || limit > 100) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid pagination parameters'
                });
                return;
            }

            const result = await this.paymentService.getPurchaseHistoryForAdmin(page, limit);
            res.status(200).json(result);

        } catch (error) {
            console.error('❌ Controller error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch purchase history'
            });
        }
    }
}