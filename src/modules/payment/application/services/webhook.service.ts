// modules/payment/application/services/webhook.service.ts
import { UserAppService } from '../../../user/application/services/user-app.service';
import { PaymentService } from './payment.service';

export class WebhookService {
    constructor(
        //private readonly userService: UserAppService
    ) {}

    // This class can now focus on non-payment webhook handling
    // or be removed entirely if not needed
    
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