
export interface CreatePaymentDto {
    userId: string;
    amount: number;
    currency: string;
    method: string;
    impressionsAllocated?: number; // Credits/impressions to add to user balance
    status?: 'pending' | 'completed' | 'failed' | 'refunded';
    stripeSessionId?: string;
    stripePaymentIntentId?: string;
    adsId?: string; // Associated ad ID if payment is for specific ad
}

export interface newPaymentDto {
    amount: number;
    currency: string;
    adId: string; // Required - the ad this payment is for
    impressions?: number; // Optional - custom impressions amount
}