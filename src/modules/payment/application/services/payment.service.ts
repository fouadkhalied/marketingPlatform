import { CreatePaymentDto } from "../dtos/create-payment.dto";
import { PaymentRepository } from "../../domain/repositories/payment.repository";
import { Payment } from "../../domain/entities/payment.entity";
import { stripe } from "../../../../infrastructure/config/stripe.config";
import { StripePaymentHandler } from "../../../../infrastructure/shared/stripe/stripe";

export class PaymentService {
    private readonly stripeHandler: StripePaymentHandler;

    constructor(
        private readonly paymentRepo: PaymentRepository,
        stripeHandler?: StripePaymentHandler
    ) {
        // Use default instance if none provided
        this.stripeHandler = stripeHandler || stripe;
        this.setupWebhookHandlers();
    }

    async createStripePayment(dto: CreatePaymentDto): Promise<Payment> {
        console.log('🔄 Creating payment with data:', dto);
        
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
        console.log('✅ Payment saved to database:', savedPayment.id);
        
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

    // Move webhook handling logic here to avoid circular dependency
    async handleCheckoutCompleted(sessionData: any): Promise<void> {
        try {
            console.log('📦 Processing checkout completed:', sessionData.id);
            console.log('📦 Session metadata:', sessionData.metadata);
            
            // Validate required data
            if (!sessionData.metadata?.userId) {
                console.error('❌ Missing userId in session metadata');
                throw new Error('Missing userId in session metadata');
            }

            // Construct the payment DTO
            const paymentDto: CreatePaymentDto = {
                userId: sessionData.metadata.userId,
                amount: sessionData.amount_total / 100, // convert cents to dollars
                currency: sessionData.currency,
                method: 'stripe', // since this is a Stripe checkout
                adId: sessionData.metadata?.adId, // optional, if tracking ad purchases
                stripeSessionId: sessionData.id,
                stripePaymentIntentId: sessionData.payment_intent || null,
            };

            // Save payment through PaymentService
            const payment = await this.createStripePayment(paymentDto);
            console.log('✅ Payment recorded successfully:', payment.id);
            
        } catch (error) {
            console.error('❌ Error handling checkout completed:', error);
            throw error; // Re-throw so webhook can return error status
        }
    }

    async processWebhook(payload: any, signature: string): Promise<void> {
        console.log('📨 Processing webhook...');
        await this.stripeHandler.processWebhook(payload, signature);
    }
}