import { Request, Response } from 'express';
import { newPaymentDto, CreatePaymentDto } from "../dtos/create-payment.dto";
import { PaymentRepository } from "../../domain/repositories/payment.repository";
import { InsertPurchase } from "../../../../infrastructure/shared/schema/schema";
import { stripe } from "../../../../infrastructure/config/stripe.config";
import { StripePaymentHandler } from "../../../../infrastructure/shared/stripe/stripe";
import { ApiResponseInterface } from '../../../../infrastructure/shared/common/apiResponse/interfaces/apiResponse.interface';
import { ResponseBuilder } from '../../../../infrastructure/shared/common/apiResponse/apiResponseBuilder';
import { ErrorCode } from '../../../../infrastructure/shared/common/errors/enums/basic.error.enum';
import { ErrorBuilder } from '../../../../infrastructure/shared/common/errors/errorBuilder';

export class PaymentService {
    private readonly stripeHandler: StripePaymentHandler;

    constructor(
        private readonly paymentRepo: PaymentRepository,
        stripeHandler?: StripePaymentHandler
    ) {
        this.stripeHandler = stripeHandler || stripe;
        this.setupWebhookHandlers();
    }

    async createCheckoutSession(req: Request, res: Response): Promise<ApiResponseInterface<{url: string, sessionId: string}>> {
        try {
            const paymentDto: newPaymentDto = req.body;
            const userId = req.user!.id.toString();

            const session = await this.stripeHandler.createCheckoutSession({
                customPricing: {
                    name: 'Ad Campaign Credits',
                    currency: paymentDto.currency,
                    unitAmount: Math.round(paymentDto.amount * 100), // Convert dollars to cents
                },
                quantity: 1,
                mode: 'payment',
                successUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/success?session_id={CHECKOUT_SESSION_ID}`,
                cancelUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/cancel`,
                metadata: {
                    userId,
                    amount: paymentDto.amount.toString(),
                }
            });

            if (!session.url) {
                return ErrorBuilder.build(
                    ErrorCode.EXTERNAL_SERVICE_ERROR,
                    'Failed to create payment session. Please try again.'
                );
            }

            // Create pending payment record
            const pendingPaymentData: InsertPurchase = {
                userId,
                amount: paymentDto.amount.toString(),
                currency: paymentDto.currency,
                method: 'stripe',
                status: 'pending',
                stripeSessionId: session.id,
            };

            // Save pending payment (without credits allocation yet)
            await this.paymentRepo.save(pendingPaymentData);

            return ResponseBuilder.success({
                url: session.url,
                sessionId: session.id
            });

        } catch (error) {
            console.error('❌ Error creating checkout session:', error);
            return ErrorBuilder.build(
                ErrorCode.INTERNAL_SERVER_ERROR,
                'Failed to create checkout session'
            );
        }
    }

    async createCompletedPayment(dto: CreatePaymentDto): Promise<void> {
        try {
            const paymentData: InsertPurchase = {
                userId: dto.userId,
                amount: dto.amount.toString(),
                currency: dto.currency,
                method: dto.method,
                status: 'completed',
                stripeSessionId: dto.stripeSessionId,
                stripePaymentIntentId: dto.stripePaymentIntentId,
            };
            
            // This will trigger the transaction in repository (save payment + add credits)
            await this.paymentRepo.save(paymentData);
            
            console.log('✅ Payment completed and credits added:', {
                userId: dto.userId,
                amount: dto.amount
            });

        } catch (error) {
            console.error('❌ Error creating completed payment:', error);
            throw new Error(`Failed to process payment: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private setupWebhookHandlers(): void {
        console.log('🔧 Setting up webhook handlers...');
        
        this.stripeHandler.onWebhookEvent('checkout.session.completed', async (event) => {
            console.log('🎯 checkout.session.completed event received!');
            await this.handleCheckoutCompleted(event.data.object);
        });

        this.stripeHandler.onWebhookEvent('payment_intent.payment_failed', async (event) => {
            console.log('🎯 payment_intent.payment_failed event received!');
            await this.handlePaymentFailed(event.data.object);
        });

        console.log('✅ Webhook handlers registered:', Array.from(this.stripeHandler['webhookHandlers'].keys()));
    }

    async handleCheckoutCompleted(sessionData: any): Promise<void> {
        try {
            // Validate required data from Stripe webhook
            if (!sessionData.metadata?.userId) {
                throw new Error('Missing userId in session metadata');
            }

            if (!sessionData.amount_total) {
                throw new Error('Missing amount_total in session data');
            }

            // Check if payment already processed (idempotency check)
            const existingPayment = await this.paymentRepo.findBySessionId(sessionData.id);
            if (existingPayment && existingPayment.status === 'completed') {
                console.log('⚠️ Payment already processed, skipping:', sessionData.id);
                return;
            }

            const paymentDto: CreatePaymentDto = {
                userId: sessionData.metadata.userId,
                amount: sessionData.amount_total / 100, // Convert cents to dollars
                currency: sessionData.currency,
                method: 'stripe',
                stripeSessionId: sessionData.id,
                stripePaymentIntentId: sessionData.payment_intent || undefined,
            };

            await this.createCompletedPayment(paymentDto);
            
        } catch (error) {
            console.error('❌ Error handling checkout completed:', error);
            throw error;
        }
    }

    async handleSubscriptionCreated(subscriptionData: any): Promise<void> {
        // Handle subscription-based payments if needed
        console.log('🔄 Subscription created:', subscriptionData.id);
    }

    async handleInvoicePaymentSucceeded(invoiceData: any): Promise<void> {
        // Handle recurring subscription payments
        console.log('💰 Invoice payment succeeded:', invoiceData.id);
    }

    async handlePaymentFailed(paymentIntentData: any): Promise<void> {
        try {
            // Mark payment as failed if it exists
            const sessionId = paymentIntentData.metadata?.sessionId;
            if (sessionId) {
                await this.paymentRepo.updateStatus(sessionId, 'failed');
                console.log('❌ Payment marked as failed:', paymentIntentData.id);
            }
        } catch (error) {
            console.error('❌ Error handling payment failure:', error);
        }
    }

    async processWebhook(payload: any, signature: string): Promise<void> {
        try {
            await this.stripeHandler.processWebhook(payload, signature);
        } catch (error) {
            console.error('❌ Webhook processing error:', error);
            throw error;
        }
    }

    async getPaymentStatus(sessionId: string) {
        try {
            return await this.paymentRepo.findBySessionId(sessionId);
        } catch (error) {
            console.error('❌ Error getting payment status:', error);
            return null;
        }
    }

    async getPurchaseHistory(userId: string, page: number = 1, limit: number = 10) {
        try {
            const result = await this.paymentRepo.getPurchaseHistory(
                { userId },
                { page, limit, sortBy: 'createdAt', sortOrder: 'desc' }
            );

            return ResponseBuilder.success(result);
        } catch (error) {
            console.error('❌ Error getting purchase history:', error);
            return ErrorBuilder.build(
                ErrorCode.INTERNAL_SERVER_ERROR,
                'Failed to fetch purchase history'
            );
        }
    }
}