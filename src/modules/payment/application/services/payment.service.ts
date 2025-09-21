import { CreatePaymentDto } from "../dtos/create-payment.dto";
import { PaymentRepository } from "../../domain/repositories/payment.repository";
import { Payment } from "../../domain/entities/payment.entity";
import { stripe } from "../../../../infrastructure/config/stripe.config";
import { StripePaymentHandler } from "../../../../infrastructure/shared/stripe/stripe";
import { WebhookService } from "./webhook.service";

export class PaymentService {
    private readonly stripeHandler: StripePaymentHandler;

    constructor(
        private readonly paymentRepo: PaymentRepository,
        private readonly webhookService: WebhookService,
        stripeHandler?: StripePaymentHandler
    ) {
        // Use default instance if none provided
        this.stripeHandler = stripeHandler || stripe;
        this.setupWebhookHandlers()
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
        return this.paymentRepo.save(payment);
    }

    private setupWebhookHandlers(): void {
        this.stripeHandler.onWebhookEvent('checkout.session.completed', async (event) => {
            await this.webhookService.handleCheckoutCompleted(event.data.object);
        });

        this.stripeHandler.onWebhookEvent('customer.subscription.created', async (event) => {
            await this.webhookService.handleCheckoutCompleted(event.data.object);
        });

        this.stripeHandler.onWebhookEvent('invoice.payment_succeeded', async (event) => {
            await this.webhookService.handleCheckoutCompleted(event.data.object);
        });
    }

    async processWebhook(payload: any, signature: string): Promise<void> {
        
        await this.stripeHandler.processWebhook(payload, signature);
    }
}
