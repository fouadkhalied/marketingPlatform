import { PaymentRepository } from "../../domain/repositories/payment.repository";
import { Payment } from "../../domain/entities/payment.entity";
import { db } from "../../../../infrastructure/db/connection";
import { purchases, users } from "../../../../infrastructure/shared/schema/schema";
import { eq, sql } from "drizzle-orm";

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

            // Use transaction to ensure both operations succeed or both fail
            const result = await db.transaction(async (tx) => {
                // 1. Insert the payment record
                const [savedPayment] = await tx
                    .insert(purchases)
                    .values({
                        userId: payment.userId,
                        amount: payment.amount.toString(), // number -> string for DB
                        currency: payment.currency,
                        method: payment.method,
                        status: 'completed', // Add status if needed
                        stripeSessionId: payment.stripeSessionId || null,
                        stripePaymentIntentId: payment.stripePaymentIntentId || null,
                        impressionsAllocated: payment.impressionsAllocated || 0,
                        createdAt: payment.createdAt || new Date()
                    })
                    .returning();

                // 2. Update user balance (add credits)
                // Assuming you want to add impressions based on the payment amount
                // You might want to calculate credits based on your pricing logic
                const creditsToAdd = payment.impressionsAllocated || Math.floor(payment.amount * 100); // Example: $1 = 100 credits
                
                await tx
                    .update(users)
                    .set({
                        freeViewsCredits: sql`${users.freeViewsCredits} + ${creditsToAdd}`,
                        totalSpend: sql`${users.totalSpend} + ${Math.floor(payment.amount * 100)}`, // Store as cents
                        updatedAt: new Date()
                    })
                    .where(eq(users.id, payment.userId));

                console.log('✅ Transaction completed successfully', {
                    paymentId: savedPayment.id,
                    creditsAdded: creditsToAdd,
                    userId: payment.userId
                });

                return savedPayment;
            });

            // Convert amount back to number for the entity
            return {
                ...result,
                amount: parseFloat(result.amount),
            } as Payment;
            
        } catch (error) {
            console.error('❌ Transaction failed - rolling back:', error);
            throw new Error(`Failed to save payment and update user balance: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async findById(id: string): Promise<Payment | null> {
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

    // Optional: Method to get user's current balance
    async getUserBalance(userId: string): Promise<number> {
        try {
            const [user] = await db
                .select({ freeViewsCredits: users.freeViewsCredits })
                .from(users)
                .where(eq(users.id, userId))
                .limit(1);

            return user?.freeViewsCredits || 0;
        } catch (error) {
            console.error('❌ Error fetching user balance:', error);
            return 0;
        }
    }
}