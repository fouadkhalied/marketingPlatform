// modules/payment/application/services/webhook.service.ts
import { UserAppService } from '../../../user/application/services/user-app.service';
import { PaymentService } from './payment.service';

export class WebhookService {
    constructor(
        private readonly paymentService: PaymentService,
        private readonly userService: UserAppService
    ) {}

    async handleCheckoutCompleted(sessionData: any): Promise<void> {
        // Construct the payment DTO
        const paymentDto = {
            userId: sessionData.metadata?.userId,
            amount: sessionData.amount_total / 100, // convert cents to dollars
            currency: sessionData.currency,
            method: 'stripe', // since this is a Stripe checkout
            adId: sessionData.metadata?.adId, // optional, if tracking ad purchases
            stripeSessionId: sessionData.id,
            stripePaymentIntentId: sessionData.payment_intent || null,
        };
    
        // Save payment through PaymentService
        const payment = await this.paymentService.createStripePayment(paymentDto);
    
        console.log('✅ Payment recorded:', payment.id);
    }
    
    // async handleSubscriptionCreated(subscriptionData: any): Promise<void> {
    //     // Business logic for subscription
    //     await this.userService.activateSubscription({
    //         customerId: subscriptionData.customer,
    //         subscriptionId: subscriptionData.id,
    //         planId: subscriptionData.items.data[0].price.id
    //     });

    //     console.log('✅ Subscription activated:', subscriptionData.id);
    // }

    // async handleInvoicePaymentSucceeded(invoiceData: any): Promise<void> {
    //     // Handle recurring payment
    //     await this.paymentService.recordSubscriptionPayment({
    //         subscriptionId: invoiceData.subscription,
    //         amount: invoiceData.amount_paid / 100,
    //         invoiceId: invoiceData.id
    //     });

    //     console.log('✅ Subscription payment recorded:', invoiceData.id);
    // }
}