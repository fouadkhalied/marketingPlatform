import { CreatePaymentDto } from "../dtos/create-payment.dto";
import { PaymentRepository } from "../../domain/repositories/payment.repository";
import { Payment } from "../../domain/entities/payment.entity";
import { stripe } from "../../../../infrastructure/config/stripe.config";
import { StripePaymentHandler } from "../../../../infrastructure/shared/stripe/stripe";

export class PaymentService {
    private readonly stripeHandler: StripePaymentHandler;

    constructor(private readonly paymentRepo: PaymentRepository, stripeHandler?: StripePaymentHandler) {
        // Use default instance if none provided
        this.stripeHandler = stripeHandler || stripe;
    }

    async createPayment(dto: CreatePaymentDto): Promise<Payment> {
        const payment = new Payment(dto.userId, dto.amount, dto.currency, dto.method);
        return this.paymentRepo.save(payment);
    }

    async processWebhook(payload: any, signature: string): Promise<void> {
        await this.stripeHandler.processWebhook(payload, signature);
    }
}
