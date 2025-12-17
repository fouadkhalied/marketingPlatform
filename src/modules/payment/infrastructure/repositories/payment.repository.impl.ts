import { desc, eq, sql } from "drizzle-orm";
import { db } from "../../../../infrastructure/db/connection";
import { InsertPurchase, Purchase, purchases, User, users } from "../../../../infrastructure/shared/schema/schema";
import { PaymentRepository } from "../../domain/repositories/payment.repository";

export class PaymentRepositoryImpl implements PaymentRepository {
    async save(payment: InsertPurchase): Promise<Purchase> {
        try {
            console.log('💾 Saving payment to database...', {
                userId: payment.userId,
                amount: payment.amount,
                status: payment.status,
                currency: payment.currency,
                method: payment.method,
                stripeSessionId: payment.stripeSessionId
            });

            // Use transaction to ensure both operations succeed or both fail
            const result = await db.transaction(async (tx) => {
                // Check if payment already exists (prevent duplicate processing)
                if (payment.stripeSessionId) {
                    const existingPayment = await tx
                        .select()
                        .from(purchases)
                        .where(eq(purchases.stripeSessionId, payment.stripeSessionId))
                        .limit(1);

                        if (existingPayment.length > 0) {
                            console.log('⚠️ Payment already exists, checking status...');
                            
                            // If existing is pending and new is completed, update it
                            if (existingPayment[0].status === 'pending' && payment.status === 'completed') {
                                console.log('Updating pending payment to completed');
                                
                                const [updatedPayment] = await tx
                                    .update(purchases)
                                    .set({ 
                                        status: 'completed',
                                        stripePaymentIntentId: payment.stripePaymentIntentId,
                                        updatedAt: new Date()
                                    })
                                    .where(eq(purchases.stripeSessionId, payment.stripeSessionId))
                                    .returning();
                                
                                // Add balance
                                const amountToAdd = typeof payment.amount === 'string' 
                                    ? parseFloat(payment.amount) 
                                    : payment.amount;
                                
                                await tx
                                    .update(users)
                                    .set({
                                        balance: sql`${users.balance} + ${amountToAdd}`,
                                        updatedAt: new Date()
                                    })
                                    .where(eq(users.id, payment.userId));
                                
                                return updatedPayment;
                            }
                            
                            return existingPayment[0];
                        }
                }

                // 1. Insert the payment record
                const [savedPayment] = await tx
                    .insert(purchases)
                    .values({
                        userId: payment.userId,
                        amount: payment.amount.toString(),
                        currency: payment.currency,
                        method: payment.method,
                        status: payment.status || 'pending',
                        stripeSessionId: payment.stripeSessionId || null,
                        stripePaymentIntentId: payment.stripePaymentIntentId || null,
                    })
                    .returning();
                
                // 2. Only add balance if payment is completed
                // if (payment.status === 'completed') {
                //     const amountToAdd = typeof payment.amount === 'string' 
                //         ? parseFloat(payment.amount) 
                //         : payment.amount;
                    
                //     await tx
                //         .update(users)
                //         .set({
                //             balance: sql`${users.balance} + ${amountToAdd}`,
                //             updatedAt: new Date()
                //         })
                //         .where(eq(users.id, payment.userId));

                //     console.log('✅ Balance added to user account', {
                //         userId: payment.userId,
                //         amountAdded: amountToAdd
                //     });
                // }

                // console.log('✅ Transaction completed successfully', {
                //     paymentId: savedPayment.id,
                //     userId: payment.userId,
                //     status: savedPayment.status
                // });

                return savedPayment;
            });

            return result;
            
        } catch (error) {
            console.error('❌ Transaction failed - rolling back:', error);
            throw new Error(`Failed to save payment: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async findUserById(id: string): Promise<User | null> {
      try {
          const [result] = await db
              .select()
              .from(users)
              .where(eq(users.id, id))
              .limit(1);

          return result || null;
      } catch (error) {
          console.error('❌ Database find error:', error);
          return null;
      }
  }

    async findById(id: string): Promise<Purchase | null> {
        try {
            const [result] = await db
                .select()
                .from(purchases)
                .where(eq(purchases.id, id))
                .limit(1);

            return result || null;
        } catch (error) {
            console.error('❌ Database find error:', error);
            return null;
        }
    }

    async findBySessionId(sessionId: string): Promise<Purchase | null> {
        try {
            const [result] = await db
                .select()
                .from(purchases)
                .where(eq(purchases.stripeSessionId, sessionId))
                .limit(1);

            return result || null;
        } catch (error) {
            console.error('❌ Database find error:', error);
            return null;
        }
    }

    async updateStatus(
        sessionId: string, 
        status: 'pending' | 'completed' | 'failed' | 'refunded'
    ): Promise<boolean> {
        try {
            await db.transaction(async (tx) => {
                const [payment] = await tx
                    .select()
                    .from(purchases)
                    .where(eq(purchases.stripeSessionId, sessionId))
                    .limit(1);

                if (!payment) {
                    throw new Error('Payment not found');
                }

                // Update payment status
                await tx
                    .update(purchases)
                    .set({ 
                        status,
                        updatedAt: new Date()
                    })
                    .where(eq(purchases.stripeSessionId, sessionId));

                // If changing from pending to completed, add balance
                if (payment.status === 'pending' && status === 'completed') {
                    const amountToAdd = parseFloat(payment.amount);
                    
                    await tx
                        .update(users)
                        .set({
                            balance: sql`${users.balance} + ${amountToAdd}`,
                            updatedAt: new Date()
                        })
                        .where(eq(users.id, payment.userId));

                    console.log('✅ Balance added after status update', {
                        userId: payment.userId,
                        amountAdded: amountToAdd
                    });
                }
            });

            return true;
        } catch (error) {
            console.error('❌ Error updating payment status:', error);
            return false;
        }
    }

    async getUserBalance(userId: string): Promise<number> {
        try {
            const [user] = await db
                .select({ balance: users.balance })
                .from(users)
                .where(eq(users.id, userId))
                .limit(1);

            return user?.balance || 0;
        } catch (error) {
            console.error('❌ Error fetching user balance:', error);
            return 0;
        }
    }

    async getPurchaseHistory(
        filter: { userId: string },
        pagination: { page: number; limit: number; sortBy?: string; sortOrder?: 'asc' | 'desc' }
      ) {
        try {
          const offset = (pagination.page - 1) * pagination.limit;
          const sortOrder = pagination.sortOrder ?? 'desc';
          const sortBy = pagination.sortBy ?? purchases.createdAt;
      
          const [items, totalCount, userBalance] = await Promise.all([
            // purchases for user
            db
              .select()
              .from(purchases)
              .where(eq(purchases.userId, filter.userId))
              .orderBy(
                desc(purchases.createdAt)
              )
              .limit(pagination.limit)
              .offset(offset),
      
            // total count
            db
              .select({ count: sql<number>`count(*)` })
              .from(purchases)
              .where(eq(purchases.userId, filter.userId))
              .then(res => Number(res[0].count)),
      
            // get user balance
            db
              .select({ balance: users.balance })
              .from(users)
              .where(eq(users.id, filter.userId))
              .then(res => Number(res[0]?.balance ?? 0))
          ]);
      
          return {
            balance: userBalance,
            items,
            total: totalCount,
            page: pagination.page,
            limit: pagination.limit,
            totalPages: Math.ceil(totalCount / pagination.limit),
          };
        } catch (error) {
          console.error('❌ Error fetching purchase history:', error);
          throw error;
        }
      }
      

    async getPurchaseHistoryForAdmin(
        pagination: { page: number; limit: number; sortBy?: string; sortOrder?: "asc" | "desc" }
      ): Promise<{
        totalPaidLastMonth: number;
        totalPaidLastYear: number;
        totalUserBalance: number;
        items: Purchase[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }> {
        try {
          const offset = (pagination.page - 1) * pagination.limit;
          const sortBy = pagination.sortBy ?? purchases.createdAt;
          const sortOrder = pagination.sortOrder ?? "desc";
      
          const [rows, totalCount, totals, balanceSum] = await Promise.all([
            // purchases + users but without balance/username
            db
              .select({
                id: purchases.id,
                createdAt: purchases.createdAt,
                updatedAt: purchases.updatedAt,
                userId: purchases.userId,
                status: purchases.status,
                amount: purchases.amount,
                currency: purchases.currency,
                method: purchases.method,
                stripeSessionId: purchases.stripeSessionId,
                stripePaymentIntentId: purchases.stripePaymentIntentId,
              })
              .from(purchases)
              .innerJoin(users, eq(users.id, purchases.userId))
              .orderBy(
                desc(purchases.createdAt)
              )
              .limit(pagination.limit)
              .offset(offset),
      
            // count
            db
              .select({ count: sql<number>`count(*)` })
              .from(purchases)
              .then((res) => Number(res[0].count)),
      
            // totals: last month & last year
            db.execute<{
              last_month: string;
              last_year: string;
            }>(sql`
              SELECT
                COALESCE(SUM(CASE WHEN "created_at" >= now() - interval '1 month' THEN amount END), 0) AS last_month,
                COALESCE(SUM(CASE WHEN "created_at" >= now() - interval '1 year' THEN amount END), 0) AS last_year
              FROM purchases
              WHERE status = 'completed'
            `),
      
            // sum of user balances
            db.execute<{ total_balance: string }>(sql`
              SELECT COALESCE(SUM(balance), 0) AS total_balance
              FROM users
            `),
          ]);
      
          return {
            totalPaidLastMonth: Number(totals.rows?.[0]?.last_month ?? 0),
            totalPaidLastYear: Number(totals.rows?.[0]?.last_year ?? 0),
            totalUserBalance: Number(balanceSum.rows?.[0]?.total_balance ?? 0),
            items: rows,
            total: totalCount,
            page: pagination.page,
            limit: pagination.limit,
            totalPages: Math.ceil(totalCount / pagination.limit),
          };
        } catch (error) {
          console.error("❌ Error fetching purchase history:", error);
          throw error;
        }
      }
      
}