export class Payment {
    constructor(
        public userId: string,
        public amount: number,
        public currency: string,
        public method: string,              // 'stripe', 'subscription', etc.
        public adId?: string,               // Optional: link to ad if purchase is ad-related
        public stripeSessionId?: string,    // Checkout session
        public stripePaymentIntentId?: string, // Payment intent ID
        public id?: string,                 // DB ID
        public createdAt?: Date
    ) {
        this.createdAt = this.createdAt || new Date();
    }
}
