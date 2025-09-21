export interface CreatePaymentDto {
    amount: number;
    currency: string;
    userId: string;
    method: string;
}
