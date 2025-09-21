import { PaymentRepository } from "../../domain/repositories/payment.repository";
import { Payment } from "../../domain/entities/payment.entity";
import { db } from "../../../../infrastructure/db/connection";
import { purchases } from "../../../../infrastructure/shared/schema/schema";
import { eq } from "drizzle-orm";

export class PaymentRepositoryImpl implements PaymentRepository {
    async save(payment: Payment): Promise<Payment> {
        try {
            console.log('💾 Saving payment to database...', {
                userId: payment.userId,
                amount: payment.amount,
                currency: payment.currency,
                method: payment.method,
                stripeSessionId: payment.stripeSessionId
            });

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
                    impressionsAllocated: 0, // Add required field with default value
                    createdAt: payment.createdAt || new Date()
                })
                .returning();

            console.log('✅ Payment saved successfully:', savedPayment.id);

            // Convert amount back to number for the entity
            return {
                ...savedPayment,
                amount: parseFloat(savedPayment.amount),
            } as Payment;
            
        } catch (error) {
            console.error('❌ Database save error:', error);
            throw error;
        }
    }

    async findById(id: string): Promise<Payment | null> {
        // This should query the database, not the in-memory array
        try {
            const result = await db
                .select()
                .from(purchases)
                .where(eq(purchases.id, id))
                .limit(1);

            if (result.length === 0) {
                return null;
            }

            const payment = result[0];
            return {
                ...payment,
                amount: parseFloat(payment.amount),
            } as Payment;
        } catch (error) {
            console.error('❌ Database find error:', error);
            return null;
        }
    }
}
