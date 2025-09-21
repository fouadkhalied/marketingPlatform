import { Payment } from "../entities/payment.entity";

export interface PaymentRepository {
    save(payment: Payment): Promise<Payment>;
    findById(id: string): Promise<Payment | null>;
}
