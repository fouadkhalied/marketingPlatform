// Updated PaymentService with validation removed
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

    constructor(
        private readonly paymentRepo: PaymentRepository,
        stripeHandler?: StripePaymentHandler
    ) {
        this.stripeHandler = stripeHandler || stripe;
        this.setupWebhookHandlers();
    }

    async createCheckoutSession(req: Request, res: Response): Promise<ApiResponseInterface<{url : string , sessionId : string}>> {
        // Validation is now handled in controller, service just processes the business logic
        const paymentDto: newPaymentDto = req.body;

        const session = await this.stripeHandler.createCheckoutSession({
            customPricing: {
                name: 'Ad Campaign',
                currency: paymentDto.currency,
                unitAmount: Math.round(paymentDto.amount * 100), // Convert dollars to cents
            },
            quantity: 1,
            mode: 'payment',
            successUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancelUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/cancel`,
            metadata: {
                userId: req.user!.id.toString(), // Safe to use ! since validation is in controller
                adId: paymentDto.adId,
                amount: paymentDto.amount.toString(),
                adsId: paymentDto.adId
            }
        });

        if (!session.url) {
            return ErrorBuilder.build(
                ErrorCode.EXTERNAL_SERVICE_ERROR,
                'Failed to create payment session. Please try again.'
            )
        }

        return ResponseBuilder.success({
            url : session.url , 
            sessionId : session.id
        })
    }

    async createStripePayment(dto: CreatePaymentDto): Promise<Payment> {
        const payment = new Payment(
            dto.userId,
            dto.amount,
            dto.currency,
            dto.method,
            dto.adId,
            dto.stripeSessionId,
            dto.stripePaymentIntentId
        );
        
        const savedPayment = await this.paymentRepo.save(payment);
        return savedPayment;
    }

    private setupWebhookHandlers(): void {
        this.stripeHandler.onWebhookEvent('checkout.session.completed', async (event) => {
            await this.handleCheckoutCompleted(event.data.object);
        });

        this.stripeHandler.onWebhookEvent('customer.subscription.created', async (event) => {
            await this.handleCheckoutCompleted(event.data.object);
        });

        this.stripeHandler.onWebhookEvent('invoice.payment_succeeded', async (event) => {
            await this.handleCheckoutCompleted(event.data.object);
        });
    }

    async handleCheckoutCompleted(sessionData: any): Promise<void> {
        // Validate required data from Stripe webhook
        if (!sessionData.metadata?.userId) {
            throw new Error('Missing userId in session metadata');
        }

        if (!sessionData.amount_total) {
            throw new Error('Missing amount_total in session data');
        }

        const paymentDto: CreatePaymentDto = {
            userId: sessionData.metadata.userId,
            amount: sessionData.amount_total / 100,
            currency: sessionData.currency,
            method: 'stripe',
            adId: sessionData.metadata?.adId,
            stripeSessionId: sessionData.id,
            stripePaymentIntentId: sessionData.payment_intent || undefined,
            adsId: sessionData.metadata?.adsId
        };

        const payment = await this.createStripePayment(paymentDto);
    }

    async processWebhook(payload: any, signature: string): Promise<void> {
        await this.stripeHandler.processWebhook(payload, signature);
    }
}