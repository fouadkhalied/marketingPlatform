import { InsertPurchase, Purchase } from "../../../../infrastructure/shared/schema/schema";

export interface PaymentRepository {
    save(payment: InsertPurchase): Promise<Purchase>;
    findById(id: string): Promise<Purchase | null>;
    findBySessionId(sessionId: string): Promise<Purchase | null>;
    updateStatus(sessionId: string, status: 'pending' | 'completed' | 'failed' | 'refunded'): Promise<boolean>;
    getUserBalance(userId: string): Promise<number>;
    getPurchaseHistory(
        filter: { userId: string },
        pagination: { page: number; limit: number; sortBy?: string; sortOrder?: 'asc' | 'desc' }
    ): Promise<{
        items: Purchase[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getPurchaseHistoryForAdmin(
        pagination: { page: number; limit: number; sortBy?: string; sortOrder?: 'asc' | 'desc' }
    ): Promise<{
        items: Purchase[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
}