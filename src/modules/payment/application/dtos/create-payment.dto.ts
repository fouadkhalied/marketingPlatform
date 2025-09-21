export interface CreatePaymentDto {
    userId: string;                      
    amount: number;                      
    currency: string;                    
    method: string;                      
    adId?: string;                      
    stripeSessionId?: string;            
    stripePaymentIntentId?: string;      
}
