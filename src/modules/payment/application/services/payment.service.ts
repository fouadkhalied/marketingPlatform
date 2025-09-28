// Updated PaymentService with new Payment entity structure
import { Request, Response } from 'express';
import { newPaymentDto, CreatePaymentDto } from "../dtos/create-payment.dto";
import { PaymentRepository } from "../../domain/repositories/payment.repository";
import { Payment } from "../../domain/entities/payment.entity";
import { stripe } from "../../../../infrastructure/config/stripe.config";
import { StripePaymentHandler } from "../../../../infrastructure/shared/stripe/stripe";
import { ApiResponseInterface } from '../../../../infrastructure/shared/common/apiResponse/interfaces/apiResponse.interface';
import { ResponseBuilder } from '../../../../infrastructure/shared/common/apiResponse/apiResponseBuilder';
import { ErrorCode } from '../../../../infrastructure/shared/common/errors/enums/basic.error.enum';
import { ErrorBuilder } from '../../../../infrastructure/shared/common/errors/errorBuilder';

export class PaymentService {
    private readonly stripeHandler: StripePaymentHandler;
    private readonly CREDITS_PER_DOLLAR = 1000; // Configure based on your pricing model

    constructor(
        private readonly paymentRepo: PaymentRepository,
        stripeHandler?: StripePaymentHandler
    ) {
        this.stripeHandler = stripeHandler || stripe;
        this.setupWebhookHandlers();
    }

    async createCheckoutSession(req: Request, res: Response): Promise<ApiResponseInterface<{url : string , sessionId : string}>> {
        try {
            const paymentDto: newPaymentDto = req.body;
            const userId = req.user!.id.toString();

            // Calculate impressions/credits that will be allocated
            const impressionsToAllocate = Math.floor(paymentDto.amount * this.CREDITS_PER_DOLLAR);

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
                    impressionsAllocated: impressionsToAllocate.toString(),
                    adId: paymentDto.adId?.toString() || '',
                }
            });

            if (!session.url) {
                return ErrorBuilder.build(
                    ErrorCode.EXTERNAL_SERVICE_ERROR,
                    'Failed to create payment session. Please try again.'
                );
            }

            // Create pending payment record
            const pendingPayment = new Payment(
                userId,
                paymentDto.amount,
                paymentDto.currency,
                'stripe',
                impressionsToAllocate,
                'pending',
                session.id,
                undefined, // payment intent will be set later
                paymentDto.adId
            );

            // Save pending payment (without credits allocation yet)
            await this.createPendingPayment(pendingPayment);

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

    async createPendingPayment(payment: Payment): Promise<Payment> {
        try {
            // For pending payments, we don't want to add credits yet
            // This will be handled in the webhook when payment is confirmed
            return await this.paymentRepo.save(payment);
        } catch (error) {
            console.error('❌ Error creating pending payment:', error);
            throw new Error('Failed to create pending payment record');
        }
    }

    async createStripePayment(dto: CreatePaymentDto): Promise<Payment> {
        try {
            const impressionsAllocated = dto.impressionsAllocated || 
                Math.floor(dto.amount * this.CREDITS_PER_DOLLAR);

            const payment = new Payment(
                dto.userId,
                dto.amount,
                dto.currency,
                dto.method,
                impressionsAllocated,
                'completed', // Mark as completed since this is called from webhook
                dto.stripeSessionId,
                dto.stripePaymentIntentId,
                dto.adsId
            );
            
            // This will trigger the transaction in repository (save payment + add credits)
            const savedPayment = await this.paymentRepo.save(payment);
            
            console.log('✅ Payment completed and credits added:', {
                paymentId: savedPayment.id,
                userId: dto.userId,
                creditsAdded: impressionsAllocated,
                amount: dto.amount
            });

            return savedPayment;
        } catch (error) {
            console.error('❌ Error creating stripe payment:', error);
            throw new Error(`Failed to process payment: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private setupWebhookHandlers(): void {
        this.stripeHandler.onWebhookEvent('checkout.session.completed', async (event) => {
            await this.handleCheckoutCompleted(event.data.object);
        });

        this.stripeHandler.onWebhookEvent('customer.subscription.created', async (event) => {
            await this.handleSubscriptionCreated(event.data.object);
        });

        this.stripeHandler.onWebhookEvent('invoice.payment_succeeded', async (event) => {
            await this.handleInvoicePaymentSucceeded(event.data.object);
        });

        this.stripeHandler.onWebhookEvent('payment_intent.payment_failed', async (event) => {
            await this.handlePaymentFailed(event.data.object);
        });
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

            const impressionsAllocated = sessionData.metadata?.impressionsAllocated ? 
                parseInt(sessionData.metadata.impressionsAllocated) : 
                Math.floor((sessionData.amount_total / 100) * this.CREDITS_PER_DOLLAR);

            const paymentDto: CreatePaymentDto = {
                userId: sessionData.metadata.userId,
                amount: sessionData.amount_total / 100,
                currency: sessionData.currency,
                method: 'stripe',
                stripeSessionId: sessionData.id,
                stripePaymentIntentId: sessionData.payment_intent || undefined,
                adsId: sessionData.metadata?.adId || undefined,
                impressionsAllocated
            };

            await this.createStripePayment(paymentDto);
            
        } catch (error) {
            console.error('❌ Error handling checkout completed:', error);
            // You might want to implement retry logic or alert administrators
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
            const paymentId = paymentIntentData.metadata?.paymentId;
            if (paymentId) {
                const payment = await this.paymentRepo.findById(paymentId);
                if (payment && payment.canProcess()) {
                    payment.markAsFailed();
                    await this.paymentRepo.save(payment);
                }
            }
            console.log('❌ Payment failed:', paymentIntentData.id);
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

    // Helper method to get payment status
    // async getPaymentStatus(sessionId: string): Promise<Payment | null> {
    //     try {
    //         // You might want to add a method to find by session ID in your repository
    //         return await this.paymentRepo.findBySessionId?.(sessionId) || null;
    //     } catch (error) {
    //         console.error('❌ Error getting payment status:', error);
    //         return null;
    //     }
    // }
}