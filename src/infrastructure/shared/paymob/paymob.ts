import axios, { AxiosInstance } from "axios";
import { CheckoutSessionOptions, PaymentVerification, PaymobBillingData, PaymobCheckoutSession, PaymobConfig, PaymobOrder, PaymobWebhookData, PaymobWebhookEvent, RefundOptions, WebhookHandler } from "./paymob.interface";
import crypto from "crypto";


export class PaymobPaymentHandler {
    private apiClient: AxiosInstance;
    private readonly apiKey: string;
    private readonly integrationId: number;
    private readonly iframeId?: number;
    private readonly hmacSecret?: string;
    public readonly publishableKey?: string;
    private readonly defaultCurrency: string;
    private readonly successUrl: string;
    private readonly cancelUrl: string;
    private authToken?: string;
    private tokenExpiry?: number;
    private webhookHandlers: Map<string, WebhookHandler> = new Map();
  
    private readonly BASE_URL = 'https://accept.paymob.com/api';
  
    // Store sessions in memory (in production, use Redis or DB)
    private sessions: Map<string, PaymobCheckoutSession> = new Map();
  
    constructor(config: PaymobConfig) {
      this.apiKey = config.apiKey;
      this.integrationId = config.integrationId;
      this.iframeId = config.iframeId;
      this.hmacSecret = config.hmacSecret;
      this.publishableKey = config.publicKey;
      this.defaultCurrency = config.defaultCurrency || 'EGP';
      this.successUrl = config.successUrl || 'https://yoursite.com/success';
      this.cancelUrl = config.cancelUrl || 'https://yoursite.com/cancel';
  
      this.apiClient = axios.create({
        baseURL: this.BASE_URL,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
  
    // ============================================
    // AUTHENTICATION
    // ============================================
  
    private async authenticate(): Promise<string> {
      if (this.authToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
        return this.authToken;
      }
  
      try {
        const response = await this.apiClient.post<{ token: string }>('/auth/tokens', {
          api_key: this.apiKey,
        });
  
        this.authToken = response.data.token;
        this.tokenExpiry = Date.now() + 50 * 60 * 1000;
  
        return this.authToken;
      } catch (error:any) {
        throw new Error(`Failed to authenticate with Paymob: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  
    // ============================================
    // CHECKOUT SESSIONS (Stripe-compatible)
    // ============================================
  
    /**
     * Create a checkout session (Stripe-compatible interface)
     */async createCheckoutSession(options: CheckoutSessionOptions): Promise<PaymobCheckoutSession> {
  try {
    const token = await this.authenticate();

    // 1️⃣ Extract amount and currency (no order object anymore)
    const amountInCents = Math.round(options.amount * 100);
    const currency = options.currency || this.defaultCurrency;

    // 2️⃣ Prepare billing data (Paymob requires it)
    const billingData: PaymobBillingData = {
      email: options.customerEmail || 'customer@example.com',
      first_name: 'Customer',
      last_name: 'Name',
      phone_number: '+201000000000',
      apartment: 'NA',
      floor: 'NA',
      street: 'NA',
      building: 'NA',
      shipping_method: 'NA',
      postal_code: 'NA',
      city: 'NA',
      country: 'EG',
      state: 'NA',
    };

    // 3️⃣ Create Payment Key directly (no order)
    const paymentKeyResponse = await this.apiClient.post<{ token: string }>('/acceptance/payment_keys', {
      auth_token: token,
      amount_cents: amountInCents,
      currency: currency,
      billing_data: billingData,
      integration_id: this.integrationId,
      lock_order_when_paid: 'true',
    });

    const paymentToken = paymentKeyResponse.data.token;

    // 4️⃣ Build iframe payment URL
    const paymentUrl = this.iframeId
      ? `https://accept.paymob.com/api/acceptance/iframes/${this.iframeId}?payment_token=${paymentToken}`
      : `https://accept.paymob.com/api/acceptance/payments/pay?payment_token=${paymentToken}`;

    // 5️⃣ Generate session metadata
    const session: PaymobCheckoutSession = {
      id: crypto.randomUUID(),
      url: paymentUrl,
      payment_status: 'unpaid',
      amount_total: amountInCents,
      currency: currency,
      customer_details: options.customerEmail ? { email: options.customerEmail } : undefined,
      metadata: options.metadata,
    };

    // Store session in memory
    this.sessions.set(session.id, session);

    return session;

  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      throw new Error(`Failed to create checkout session: ${error.response?.data?.message || error.message}`);
    }
    throw new Error(`Failed to create checkout session: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

  
    /**
     * Get checkout session details (Stripe-compatible)
     */
    async getCheckoutSession(sessionId: string): Promise<PaymobCheckoutSession> {
      try {
        // First check in-memory cache
        const cachedSession = this.sessions.get(sessionId);
        if (cachedSession) {
          return cachedSession;
        }
  
        // Fallback to API call
        const token = await this.authenticate();
        const response = await this.apiClient.get<PaymobOrder>(`/ecommerce/orders/${sessionId}`, {
          params: { token },
        });
  
        const order = response.data;
        const session: PaymobCheckoutSession = {
          id: order.id.toString(),
          url: '',
          payment_status: order.paid_amount_cents > 0 ? 'paid' : 'unpaid',
          amount_total: order.amount_cents,
          currency: order.currency,
          metadata: order.data,
        };
  
        return session;
  
      } catch (error:any) {
        throw new Error(`Failed to retrieve checkout session: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  
    // ============================================
    // PAYMENT VERIFICATION (Stripe-compatible)
    // ============================================
  
    /**
     * Verify payment completion (Stripe-compatible interface)
     */
    async verifyPayment(sessionId: string): Promise<PaymentVerification> {
      try {
        const token = await this.authenticate();
  
        const response = await this.apiClient.get<PaymobOrder>(`/ecommerce/orders/${sessionId}`, {
          params: { token },
        });
  
        const order = response.data;
        const isPaid = order.paid_amount_cents > 0;
  
        return {
          success: isPaid,
          paymentStatus: isPaid ? 'paid' : 'unpaid',
          sessionId: order.id.toString(),
          orderId: order.merchant_order_id,
          amountTotal: order.amount_cents,
          currency: order.currency,
          metadata: order.data,
        };
  
      } catch (error:any) {
        if (axios.isAxiosError(error)) {
          throw new Error(`Failed to verify payment: ${error.response?.data?.message || error.message}`);
        }
        throw new Error(`Failed to verify payment: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  
    // ============================================
    // REFUNDS (Stripe-compatible)
    // ============================================
  
    /**
     * Create a refund (Stripe-compatible interface)
     */
    async createRefund(options: RefundOptions): Promise<any> {
      try {
        const token = await this.authenticate();
  
        const refundData: Record<string, any> = {
          auth_token: token,
          transaction_id: options.paymentIntentId,
        };
  
        if (options.amount) {
          refundData.amount_cents = Math.round(options.amount);
        }
  
        const response = await this.apiClient.post('/acceptance/void_refund/refund', refundData);
  
        return response.data;
  
      } catch (error:any) {
        if (axios.isAxiosError(error)) {
          throw new Error(`Failed to create refund: ${error.response?.data?.message || error.message}`);
        }
        throw new Error(`Failed to create refund: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  
    // ============================================
    // WEBHOOKS (Stripe-compatible)
    // ============================================
  
    /**
     * Register webhook event handler (Stripe-compatible)
     */
    onWebhookEvent(eventType: string, handler: WebhookHandler): void {
      this.webhookHandlers.set(eventType, handler);
      console.log(`✅ Registered webhook handler for: ${eventType}`);
    }
  
    /**
     * Process webhook event (Stripe-compatible)
     */
    async processWebhook(body: string | Buffer | any, signature: string): Promise<void> {
      if (!this.hmacSecret) {
        console.warn('⚠️ HMAC secret not configured, skipping signature verification');
      }
  
      try {
        // Parse body if it's a string or buffer
        let webhookData: PaymobWebhookData;
        if (typeof body === 'string') {
          webhookData = JSON.parse(body);
        } else if (Buffer.isBuffer(body)) {
          webhookData = JSON.parse(body.toString());
        } else {
          webhookData = body;
        }
  
        // Verify signature if HMAC secret is configured
        if (this.hmacSecret) {
          const isValid = this.verifyWebhookSignature(webhookData);
          if (!isValid) {
            throw new Error('Invalid webhook signature');
          }
        }
  
        // Map Paymob events to Stripe-like event types
        const eventType = this.mapPaymobEventType(webhookData);
        
        console.log(`🎯 Processing Paymob webhook: ${eventType}`);
  
        // Create Stripe-like event object
        const event: PaymobWebhookEvent = {
          type: eventType,
          data: {
            obj: webhookData,
            object: this.convertToStripeFormat(webhookData),
          },
        };
  
        // Update session status in memory
        if (webhookData.order?.id) {
          const sessionId = webhookData.order.id.toString();
          const session = this.sessions.get(sessionId);
          if (session) {
            session.payment_status = webhookData.success ? 'paid' : 'failed';
            this.sessions.set(sessionId, session);
          }
        }
  
        // Call registered handler
        const handler = this.webhookHandlers.get(eventType);
        if (handler) {
          await handler(event);
        } else {
          console.log(`ℹ️ No handler registered for: ${eventType}`);
        }
  
      } catch (error:any) {
        throw new Error(`Webhook verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  
    /**
     * Verify webhook signature using HMAC
     */
    private verifyWebhookSignature(webhookData: PaymobWebhookData): boolean {
      if (!this.hmacSecret) {
        return true; // Skip verification if no secret
      }
  
      try {
        const concatenatedString = [
          webhookData.amount_cents,
          webhookData.created_at,
          webhookData.currency,
          webhookData.error_occured,
          webhookData.has_parent_transaction,
          webhookData.id,
          webhookData.integration_id,
          webhookData.is_3d_secure,
          webhookData.is_auth,
          webhookData.is_capture,
          webhookData.is_refunded,
          webhookData.is_standalone_payment,
          webhookData.is_voided,
          webhookData.order?.id || '',
          webhookData.owner,
          webhookData.pending,
          webhookData.source_data?.pan || '',
          webhookData.source_data?.sub_type || '',
          webhookData.source_data?.type || '',
          webhookData.success,
        ].join('');
  
        const calculatedHmac = crypto
          .createHmac('sha512', this.hmacSecret)
          .update(concatenatedString)
          .digest('hex');
  
        return calculatedHmac === webhookData.hmac;
  
      } catch (error:any) {
        console.error('❌ Error verifying webhook signature:', error);
        return false;
      }
    }
  
    /**
     * Map Paymob transaction status to Stripe event types
     */
    private mapPaymobEventType(webhookData: PaymobWebhookData): string {
      const success = webhookData.success === 'true' || webhookData.success === true;
      
      if (success) {
        return 'checkout.session.completed';
      } else {
        return 'payment_intent.payment_failed';
      }
    }
  
    /**
     * Convert Paymob webhook data to Stripe-like format
     */
    private convertToStripeFormat(webhookData: PaymobWebhookData): any {
      const success = webhookData.success === 'true' || webhookData.success === true;
      const amountCents = typeof webhookData.amount_cents === 'number' 
        ? webhookData.amount_cents 
        : parseInt(webhookData.amount_cents as string, 10);
  
      return {
        id: webhookData.order?.id?.toString() || webhookData.id.toString(),
        payment_status: success ? 'paid' : 'failed',
        payment_intent: webhookData.order?.merchant_order_id || webhookData.id.toString(),
        amount_total: amountCents,
        currency: webhookData.currency,
        customer_details: {
          email: webhookData.billing_data?.email,
        },
        metadata: webhookData.data || {},
      };
    }
}