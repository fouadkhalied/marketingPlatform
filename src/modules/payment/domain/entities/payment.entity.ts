export class Payment {
    constructor(
        public userId: string,
        public amount: number,
        public currency: string,
        public method: string,              // 'stripe', 'subscription', etc.
        public status: 'pending' | 'completed' | 'failed' | 'refunded' = 'pending',
        public stripeSessionId?: string,    // Checkout session
        public stripePaymentIntentId?: string, // Payment intent ID
        public createdAt?: Date,
        public updatedAt?: Date
    ) {
        this.createdAt = this.createdAt || new Date();
        this.updatedAt = this.updatedAt || new Date();
    }

    // Helper method to calculate credits based on amount
    public calculateCredits(ratePerDollar: number = 100): number {
        return Math.floor(this.amount * ratePerDollar);
    }

    // Helper method to check if payment is successful
    public isSuccessful(): boolean {
        return this.status === 'completed';
    }

    // Helper method to check if payment can be processed
    public canProcess(): boolean {
        return this.status === 'pending' && this.amount > 0;
    }

    // Helper method to mark payment as failed
    public markAsFailed(): void {
        this.status = 'failed';
        this.updatedAt = new Date();
    }

    // Helper method to get amount in cents (for Stripe)
    public getAmountInCents(): number {
        return Math.round(this.amount * 100);
    }
}