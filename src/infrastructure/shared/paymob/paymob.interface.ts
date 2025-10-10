export interface PaymobConfig {
    apiKey: string;
    secretKey: string;
    integrationId: number;
    iframeId?: number;
    hmacSecret?: string;
    publicKey?: string;
    defaultCurrency?: string;
    successUrl?: string;
    cancelUrl?: string;
  }
  
  /**
   * Checkout Session Options (matching Stripe interface)
   */
  export interface CheckoutSessionOptions {
    amount: number;
    currency:string;
    priceId?: string;
    quantity?: number;
    customerEmail?: string;
    metadata?: Record<string, string>;
    mode?: 'payment' | 'subscription';
    successUrl?: string;
    cancelUrl?: string;
    lineItems?: any[];
  }
  
  /**
   * Payment Verification Result
   */
  export interface PaymentVerification {
    success: boolean;
    paymentStatus: string;
    sessionId?: string;
    transactionId?: string;
    orderId?: string;
    customerEmail?: string;
    amountTotal?: number;
    currency?: string;
    metadata?: Record<string, any>;
    paymentIntentId?: string;
  }
  
  /**
   * Refund Options Interface
   */
  export interface RefundOptions {
    paymentIntentId: string;
    amount?: number;
    reason?: string;
    metadata?: Record<string, string>;
  }
  
  /**
   * Paymob Order Item Interface
   */
  export interface PaymobOrderItem {
    name: string;
    amount_cents: number;
    quantity: number;
    description?: string;
  }
  
  /**
   * Paymob Billing Data export Interface
   */
  export interface PaymobBillingData {
    email: string;
    first_name: string;
    last_name: string;
    phone_number: string;
    apartment: string;
    floor: string;
    street: string;
    building: string;
    shipping_method: string;
    postal_code: string;
    city: string;
    country: string;
    state: string;
  }
  
  /**
   * Paymob Transaction Response export Interface
   */
  export interface PaymobTransaction {
    id: number;
    success: boolean;
    amount_cents: number;
    currency: string;
    order?: {
      id: number;
      merchant_order_id: string;
    };
    billing_data?: {
      email: string;
    };
    data?: Record<string, any>;
  }
  
  /**
   * Paymob Order Response export Interface
   */
  export interface PaymobOrder {
    id: number;
    merchant_order_id: string;
    amount_cents: number;
    paid_amount_cents: number;
    currency: string;
    data?: Record<string, any>;
  }
  
  /**
   * Paymob Checkout Session (matching Stripe interface)
   */
  export interface PaymobCheckoutSession {
    id: string;
    url: string;
    payment_status: string;
    amount_total: number;
    currency: string;
    customer_details?: {
      email?: string;
    };
    metadata?: Record<string, string>;
    payment_intent?: string;
  }
  
  /**
   * Paymob Webhook Data Interface
   */
  export interface PaymobWebhookData {
    amount_cents: string | number;
    created_at: string;
    currency: string;
    error_occured: string | boolean;
    has_parent_transaction: string | boolean;
    id: number;
    integration_id: number;
    is_3d_secure: string | boolean;
    is_auth: string | boolean;
    is_capture: string | boolean;
    is_refunded: string | boolean;
    is_standalone_payment: string | boolean;
    is_voided: string | boolean;
    order?: {
      id: number;
      merchant_order_id: string;
    };
    owner: number;
    pending: string | boolean;
    source_data?: {
      pan?: string;
      sub_type?: string;
      type?: string;
    };
    success: string | boolean;
    hmac: string;
    billing_data?: {
      email: string;
    };
    data?: Record<string, any>;
  }
  
  /**
   * Webhook event handler type
   */
  export type WebhookHandler = (event: PaymobWebhookEvent) => Promise<void>;
  
  /**
   * Paymob Webhook Event
   */
  export interface PaymobWebhookEvent {
    type: string;
    data: {
      obj: PaymobWebhookData;
      object: any;
    };
  }