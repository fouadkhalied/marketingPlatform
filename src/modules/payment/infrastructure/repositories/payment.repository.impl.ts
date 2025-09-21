import { PaymentRepository } from "../../domain/repositories/payment.repository";
import { Payment } from "../../domain/entities/payment.entity";
import { db } from "../../../../infrastructure/db/connection";
import { purchases } from "../../../../infrastructure/shared/schema/schema";

export class PaymentRepositoryImpl implements PaymentRepository {
    private payments: Payment[] = [];

    async save(payment: Payment): Promise<Payment> {
        const [savedPayment] = await db
            .insert(purchases)
            .values({
                userId: payment.userId,
                adId: payment.adId || null,
                amount: payment.amount.toString(), // number -> string for DB
                currency: payment.currency,
                method: payment.method,
                stripeSessionId: payment.stripeSessionId || null,
                stripePaymentIntentId: payment.stripePaymentIntentId || null,
                createdAt: payment.createdAt || new Date()
            })
            .returning();
    
        // Convert amount back to number for the entity
        return {
            ...savedPayment,
            amount: parseFloat(savedPayment.amount),
        } as Payment;
    }
    
    
    async findById(id: string): Promise<Payment | null> {
        return this.payments.find(p => p.id === id) || null;
    }
}
