import Stripe from "stripe";

export interface StripeConfig {
    secretKey: string;
    publishableKey: string;
    webhookSecret?: string;
    defaultCurrency?: string;
    successUrl?: string;
    cancelUrl?: string;
  }
  
  /**
   * Checkout session creation options
   */
  export interface CheckoutSessionOptions {
    priceId?: string;
    quantity?: number;
    customerEmail?: string;
    metadata?: Record<string, string>;
    mode?: 'payment' | 'subscription' | 'setup';
    successUrl?: string;
    cancelUrl?: string;
    lineItems?: Stripe.Checkout.SessionCreateParams.LineItem[];
    customPricing?: {
      name: string;
      description?: string;
      unitAmount: number;
      currency?: string;
    };
  }
  
  /**
   * Payment verification result
   */
  export interface PaymentVerification {
    success: boolean;
    paymentStatus: string;
    sessionId: string;
    paymentIntentId?: string;
    customerEmail?: string;
    amountTotal?: number;
    currency?: string;
    metadata?: Record<string, string>;
  }
  
  /**
   * Refund options
   */
  export interface RefundOptions {
    paymentIntentId: string;
    amount?: number;
    reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer';
    metadata?: Record<string, string>;
  }
  