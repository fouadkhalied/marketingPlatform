
export interface CreatePaymentDto {
    userId: string;
    amount: number;
    currency: string;
    method: string;
    adId: string; // Now required, not optional
    stripeSessionId?: string;
    stripePaymentIntentId?: string;
    adsId?: string; // Add adsId field
}

export interface newPaymentDto {
    amount: number;
    currency: string;
    adId: string; // Now required, not optional
}