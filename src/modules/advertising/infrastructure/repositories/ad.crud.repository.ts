import { and, eq, like, or, sql } from "drizzle-orm";
import { IAdCrudRepository } from "../../domain/repositories/ad.crud.repository.interface";
import { db } from "../../../../infrastructure/db/connection";
import { Ad, adminImpressionRatio, ads, users } from "../../../../infrastructure/shared/schema/schema";
import { ErrorBuilder } from "../../../../infrastructure/shared/common/errors/errorBuilder";
import { ErrorCode } from "../../../../infrastructure/shared/common/errors/enums/basic.error.enum";
import { PaginatedResponse, PaginationParams } from "../../../../infrastructure/shared/common/pagination.vo";
import { InsertAd } from "../../../../infrastructure/shared/schema/schema";

export class AdCrudRepository implements IAdCrudRepository {
  async create(ad: InsertAd): Promise<string> {
    try {
      const result = await db.transaction(async (tx) => {
        // 1️⃣ Insert the ad
        const [insertedAd] = await tx.insert(ads).values(ad).returning({ id: ads.id });

        if (!insertedAd) {
          throw ErrorBuilder.build(ErrorCode.DATABASE_ERROR, "Failed to insert ad");
        }

        // 2️⃣ Increment user's adsCount
        await tx
          .update(users)
          .set({ adsCount: sql`${users.adsCount} + 1` })
          .where(eq(users.id, ad.userId));

        // ✅ Return the new ad ID
        return insertedAd.id;
      });

      return result;
    } catch (error) {
      throw ErrorBuilder.build(
        ErrorCode.DATABASE_ERROR,
        "Failed to insert ad or update user ads count",
        error instanceof Error ? error.message : error
      );
    }
  }

  async findById(id: string): Promise<Ad | null> {
    try {
      const [result] = await db.select().from(ads).where(eq(ads.id, id));
      return result ? (result as Ad) : null;
    } catch (error) {
      throw ErrorBuilder.build(
        ErrorCode.DATABASE_ERROR,
        "Failed to fetch ad by id",
        error instanceof Error ? error.message : error
      );
    }
  }

  async findByTitle(
    title: string,
    pagination: PaginationParams
  ): Promise<PaginatedResponse<Ad>> {
    try {
      const { page, limit } = pagination;
      const offset = (page - 1) * limit;

      // ✅ Count total records matching title (Arabic OR English)
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(ads)
        .where(
          or(
            like(ads.titleEn, `%${title}%`),
            like(ads.titleAr, `%${title}%`)
          )
        );

      // ✅ Fetch paginated results
      const results = await db
        .select()
        .from(ads)
        .where(
          or(
            like(ads.titleEn, `%${title}%`),
            like(ads.titleAr, `%${title}%`)
          )
        )
        .limit(limit)
        .offset(offset);

      const totalCount = Number(count);
      const totalPages = Math.ceil(totalCount / limit);

      return {
        data: results,
        pagination: {
          currentPage: page,
          limit,
          totalCount,
          totalPages,
          hasNext: page < totalPages,
          hasPrevious: page > 1,
        },
      };
    } catch (error) {
      throw ErrorBuilder.build(
        ErrorCode.DATABASE_ERROR,
        "Failed to fetch ads by title",
        error instanceof Error ? error.message : error
      );
    }
  }

  async update(id: string, ad: Partial<InsertAd>): Promise<Ad | null> {
    try {
      // Clone and sanitize the update data
      const updateData: any = { ...ad };

      // Convert date fields from strings to Date objects
      const dateFields = ['createdAt', 'updatedAt'] as const;

      dateFields.forEach(field => {
        if (updateData[field]) {
          if (typeof updateData[field] === 'string') {
            updateData[field] = new Date(updateData[field]);
          }
        }
      });

      // Always set status to pending when updating
      updateData.status = 'pending';

      const result = await db.transaction(async(tx) => {
        const [updated] = await tx
          .update(ads)
          .set(updateData)
          .where(eq(ads.id, id))
          .returning();

        return updated;
      });

      return result || null;
    } catch (error) {
      throw ErrorBuilder.build(
        ErrorCode.DATABASE_ERROR,
        "Failed to update ad",
        error instanceof Error ? error.message : error
      );
    }
  }

  async delete(id: string, userId: string, role: string): Promise<boolean> {
    try {
      return await db.transaction(async (tx) => {
        // 1. First, get the ad details to calculate refund
        const [adToDelete] = await tx
          .select({
            id: ads.id,
            userId: ads.userId,
            impressionsCredit: ads.impressionsCredit,
            hasPromoted: ads.hasPromoted,
          })
          .from(ads)
          .where(
            role === 'admin'
              ? eq(ads.id, id)
              : and(eq(ads.id, id), eq(ads.userId, userId))
          );
  
        if (!adToDelete) {
          return false;
        }
  
        // 2. Get the conversion ratio based on promotion status
        const [ratio] = await tx
          .select({ impressionsPerUnit: adminImpressionRatio.impressionsPerUnit })
          .from(adminImpressionRatio)
          .where(
            and(
              eq(adminImpressionRatio.currency, 'sar'),
              eq(adminImpressionRatio.promoted, adToDelete.hasPromoted)
            )
          );
  
        if (!ratio) {
          throw ErrorBuilder.build(
            ErrorCode.VALIDATION_ERROR,
            "Conversion ratio not found"
          );
        }
  
        // 3. Calculate refund amount
        const impressionsRemaining = adToDelete.impressionsCredit ?? 0;
        const refundAmount = Math.floor(impressionsRemaining / Number(ratio.impressionsPerUnit));
  
        // 4. Return credit to user's balance (only if there's a refund)
        if (refundAmount > 0) {
          // Get current balance first
          const [currentUser] = await tx
            .select({ balance: users.balance })
            .from(users)
            .where(eq(users.id, adToDelete.userId));
  
          if (currentUser) {
            const newBalance = (currentUser.balance ?? 0) + refundAmount;
            
            await tx
              .update(users)
              .set({
                balance: newBalance,
              })
              .where(eq(users.id, adToDelete.userId));
          }
        }
  
        // 5. Delete the ad
        const result = await tx
          .delete(ads)
          .where(eq(ads.id, id))
          .returning({ id: ads.id });
  
        return result.length > 0;
      });
    } catch (error) {
      console.error('Delete ad error:', error); // Add logging
      throw ErrorBuilder.build(
        ErrorCode.DATABASE_ERROR,
        "Failed to delete ad",
        error instanceof Error ? error.message : String(error)
      );
    }
  }
}
