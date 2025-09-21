import { PaymentRepository } from "../../domain/repositories/payment.repository";
import { Payment } from "../../domain/entities/payment.entity";

export class PaymentRepositoryImpl implements PaymentRepository {
    private payments: Payment[] = [];

    async save(payment: Payment): Promise<Payment> {
        payment.id = (Math.random() * 100000).toFixed(0);
        this.payments.push(payment);
        return payment;
    }

    async findById(id: string): Promise<Payment | null> {
        return this.payments.find(p => p.id === id) || null;
    }
}
