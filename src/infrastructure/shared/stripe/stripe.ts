import Stripe from 'stripe';
import { CheckoutSessionOptions, PaymentVerification, RefundOptions, StripeConfig } from './stripe.interface';

/**
 * Webhook event handler type
 */
type WebhookHandler = (event: Stripe.Event) => Promise<void>;

/**
 * Complete Stripe Payment Handler Class
 * Handles all payment operations with clean, reusable methods
 */
export class StripePaymentHandler {
  private stripe: Stripe;
  public readonly publishableKey: string;
  private readonly webhookSecret?: string;
  private readonly defaultCurrency: string;
  private readonly successUrl: string;
  private readonly cancelUrl: string;
  private webhookHandlers: Map<string, WebhookHandler> = new Map();

  constructor(config: StripeConfig) {
    this.stripe = new Stripe(config.secretKey, {
      apiVersion: '2025-08-27.basil',
    });
    this.publishableKey = config.publishableKey;
    this.webhookSecret = config.webhookSecret;
    this.defaultCurrency = config.defaultCurrency || 'usd';
    this.successUrl = config.successUrl || 'https://yoursite.com/success';
    this.cancelUrl = config.cancelUrl || 'https://yoursite.com/cancel';
  }

  // ============================================
  // CHECKOUT SESSIONS
  // ============================================

  /**
   * Create a checkout session
   */
  async createCheckoutSession(options: CheckoutSessionOptions): Promise<Stripe.Checkout.Session> {
    try {
      const {
        priceId,
        quantity = 1,
        customerEmail,
        metadata = {},
        mode = 'payment',
        successUrl,
        cancelUrl,
        lineItems,
        customPricing
      } = options;

      const sessionConfig: Stripe.Checkout.SessionCreateParams = {
        payment_method_types: ['card'],
        mode: mode,
        success_url: successUrl || `${this.successUrl}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl || this.cancelUrl,
        metadata: metadata
      };

      // Handle line items
      if (lineItems) {
        sessionConfig.line_items = lineItems;
      } else if (priceId) {
        sessionConfig.line_items = [{
          price: priceId,
          quantity: quantity
        }];
      } else if (customPricing) {
        sessionConfig.line_items = [{
          price_data: {
            currency: customPricing.currency || this.defaultCurrency,
            product_data: {
              name: customPricing.name,
              description: customPricing.description
            },
            unit_amount: customPricing.unitAmount
          },
          quantity: quantity
        }];
      } else {
        throw new Error('Either priceId, lineItems, or customPricing must be provided');
      }

      // Add customer email if provided
      if (customerEmail) {
        sessionConfig.customer_email = customerEmail;
      }

      const session = await this.stripe.checkout.sessions.create(sessionConfig);
      return session;

    } catch (error) {
      throw new Error(`Failed to create checkout session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get checkout session details
   */
  async getCheckoutSession(sessionId: string): Promise<Stripe.Checkout.Session> {
    try {
      return await this.stripe.checkout.sessions.retrieve(sessionId);
    } catch (error) {
      throw new Error(`Failed to retrieve checkout session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ============================================
  // PAYMENT VERIFICATION
  // ============================================

  /**
   * Verify payment completion and get details
   */
  async verifyPayment(sessionId: string): Promise<PaymentVerification> {
    try {
      const session = await this.stripe.checkout.sessions.retrieve(sessionId);
      
      const result: PaymentVerification = {
        success: session.payment_status === 'paid',
        paymentStatus: session.payment_status,
        sessionId: sessionId,
        customerEmail: session.customer_details?.email || undefined,
        amountTotal: session.amount_total || undefined,
        currency: session.currency || undefined,
        metadata: session.metadata || undefined
      };

      if (session.payment_intent && typeof session.payment_intent === 'string') {
        result.paymentIntentId = session.payment_intent;
      }

      return result;

    } catch (error) {
      throw new Error(`Failed to verify payment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ============================================
  // PRODUCTS & PRICES
  // ============================================

  /**
   * Create a product
   */
  async createProduct(name: string, description?: string, metadata?: Record<string, string>): Promise<Stripe.Product> {
    try {
      return await this.stripe.products.create({
        name,
        description,
        metadata
      });
    } catch (error) {
      throw new Error(`Failed to create product: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a price for a product
   */
  async createPrice(productId: string, unitAmount: number, currency?: string, recurring?: Stripe.PriceCreateParams.Recurring): Promise<Stripe.Price> {
    try {
      const priceData: Stripe.PriceCreateParams = {
        product: productId,
        unit_amount: unitAmount,
        currency: currency || this.defaultCurrency
      };

      if (recurring) {
        priceData.recurring = recurring;
      }

      return await this.stripe.prices.create(priceData);
    } catch (error) {
      throw new Error(`Failed to create price: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * List all products
   */
  async listProducts(limit: number = 10): Promise<Stripe.Product[]> {
    try {
      const products = await this.stripe.products.list({ limit });
      return products.data;
    } catch (error) {
      throw new Error(`Failed to list products: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ============================================
  // REFUNDS
  // ============================================

  /**
   * Create a refund
   */
  async createRefund(options: RefundOptions): Promise<Stripe.Refund> {
    try {
      const refundData: Stripe.RefundCreateParams = {
        payment_intent: options.paymentIntentId
      };

      if (options.amount) refundData.amount = options.amount;
      if (options.reason) refundData.reason = options.reason;
      if (options.metadata) refundData.metadata = options.metadata;

      return await this.stripe.refunds.create(refundData);
    } catch (error) {
      throw new Error(`Failed to create refund: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ============================================
  // CUSTOMERS
  // ============================================

  /**
   * Create a customer
   */
  async createCustomer(email: string, name?: string, metadata?: Record<string, string>): Promise<Stripe.Customer> {
    try {
      return await this.stripe.customers.create({
        email,
        name,
        metadata
      });
    } catch (error) {
      throw new Error(`Failed to create customer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get customer by ID
   */
  async getCustomer(customerId: string): Promise<Stripe.Customer | Stripe.DeletedCustomer> {
    try {
      return await this.stripe.customers.retrieve(customerId);
    } catch (error) {
      throw new Error(`Failed to retrieve customer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ============================================
  // WEBHOOKS
  // ============================================

  /**
   * Register webhook event handler
   */
  onWebhookEvent(eventType: string, handler: WebhookHandler): void {
    this.webhookHandlers.set(eventType, handler);
  }

  /**
   * Process webhook event
   */
  async processWebhook(body: string | Buffer, signature: string): Promise<void> {
    if (!this.webhookSecret) {
      throw new Error('Webhook secret not configured');
    }

    try {
      const event = this.stripe.webhooks.constructEvent(body, signature, this.webhookSecret);
      
      // Call registered handler for this event type
      const handler = this.webhookHandlers.get(event.type);
      if (handler) {
        await handler(event);
      } else {
        console.log(`Unhandled webhook event: ${event.type}`);
      }

    } catch (error) {
      throw new Error(`Webhook verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ============================================
  // PAYMENT INTENTS (Advanced)
  // ============================================

  /**
   * Create payment intent for custom payment flows
   */
  async createPaymentIntent(amount: number, currency?: string, metadata?: Record<string, string>): Promise<Stripe.PaymentIntent> {
    try {
      return await this.stripe.paymentIntents.create({
        amount,
        currency: currency || this.defaultCurrency,
        metadata
      });
    } catch (error) {
      throw new Error(`Failed to create payment intent: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get payment intent details
   */
  async getPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    try {
      return await this.stripe.paymentIntents.retrieve(paymentIntentId);
    } catch (error) {
      throw new Error(`Failed to retrieve payment intent: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  /**
   * Convert amount from dollars to cents
   */
  static dollarsToCents(dollars: number): number {
    return Math.round(dollars * 100);
  }

  /**
   * Convert amount from cents to dollars
   */
  static centsToDollars(cents: number): number {
    return cents / 100;
  }

  /**
   * Format currency amount
   */
  static formatCurrency(amount: number, currency: string = 'usd'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount);
  }
}
