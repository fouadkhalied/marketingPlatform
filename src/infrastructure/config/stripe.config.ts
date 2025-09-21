import { StripePaymentHandler } from "../shared/stripe/stripe";

const stripeConfig = {
    secretKey: process.env.STRIPE_SECRET_KEY!,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY!,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    defaultCurrency: 'usd',
    successUrl: `${process.env.BASE_URL || 'http://localhost:3000'}/success`,
    cancelUrl: `${process.env.BASE_URL || 'http://localhost:3000'}/cancel`
};

// CREATE the stripe instance FIRST
export const stripe = new StripePaymentHandler(stripeConfig);

// THEN add the event handlers
stripe.onWebhookEvent('checkout.session.completed', async (event) => {
    const session = event.data.object as any;
    console.log('✅ Payment completed:', session.id);
    // Handle one-time payment
});

stripe.onWebhookEvent('invoice.payment_succeeded', async (event) => {
    const invoice = event.data.object as any;
    console.log('✅ Subscription payment succeeded:', invoice.id);
    // Handle recurring payment
});

stripe.onWebhookEvent('customer.subscription.created', async (event) => {
    const subscription = event.data.object as any;
    console.log('✅ New subscription created:', subscription.id);
    // Handle new subscriber
});