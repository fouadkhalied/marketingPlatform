import { and, eq, sql } from "drizzle-orm";
import { IAdvertisingRepository } from "../../domain/repositories/advertising.repository.interface";
import { db } from "../../../../infrastructure/db/connection";
import { Ad, ads , InsertAd } from "../../../../infrastructure/shared/schema/schema";
import { ErrorBuilder } from "../../../../infrastructure/shared/common/errors/errorBuilder";
import { ErrorCode } from "../../../../infrastructure/shared/common/errors/enums/basic.error.enum";
import { AdStatus } from "../../domain/enums/ads.status.enum";
import { PaginatedResponse, PaginationParams } from "../../../../infrastructure/shared/common/pagination.vo";

export class AdvertisingRepository implements IAdvertisingRepository {
    async create(ad: InsertAd): Promise<string> {
      try {
        const [result] = await db.insert(ads).values(ad).returning({ id: ads.id });
        if (!result) {
          throw ErrorBuilder.build(
            ErrorCode.DATABASE_ERROR,
            "Failed to insert ad"
          );
        }
        return result.id;
      } catch (error) {
        throw ErrorBuilder.build(
          ErrorCode.DATABASE_ERROR,
          "Failed to insert ad",
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

    
    async findAllForAdmin(
      status: string, // still string from request
      pagination: PaginationParams
    ): Promise<PaginatedResponse<Ad>> {
      try {
        const { page, limit } = pagination;
        const offset = (page - 1) * limit;
    
        // 👇 define allowed enum values
        const allowedStatuses = ["pending", "approved", "rejected"] as const;
        type AdStatus = (typeof allowedStatuses)[number];
    
        // 👇 check if status is valid enum value
        const isValidStatus = (s: string): s is AdStatus =>
          allowedStatuses.includes(s as AdStatus);
    
        let whereCondition;
        if (status !== "all" && isValidStatus(status)) {
          whereCondition = eq(ads.status, status);
        }
    
        // Count total records
        const countQuery = db
          .select({ count: sql<number>`count(*)` })
          .from(ads);
    
        if (whereCondition) countQuery.where(whereCondition);
    
        const [{ count }] = await countQuery;
    
        // Fetch paginated results
        const resultsQuery = db
          .select()
          .from(ads)
          .limit(limit)
          .offset(offset);
    
        if (whereCondition) resultsQuery.where(whereCondition);
    
        const results = await resultsQuery;
    
        const totalCount = Number(count);
        const totalPages = Math.ceil(totalCount / limit);
    
        return {
          data: results as Ad[],
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
          "Failed to fetch ads for admin",
          error instanceof Error ? error.message : error
        );
      }
    }
    
    
    async findAllForUser(
      status: string | undefined, // 👈 request input is plain string
      userId: string,
      pagination: PaginationParams
    ): Promise<PaginatedResponse<Ad>> {
      try {
        const { page, limit } = pagination;
        const offset = (page - 1) * limit;
    
        // 👇 define allowed statuses
        const allowedStatuses = ["pending", "approved", "rejected"] as const;
        type AdStatus = (typeof allowedStatuses)[number];
    
        const isValidStatus = (s: string): s is AdStatus =>
          allowedStatuses.includes(s as AdStatus);
    
        // ✅ Build condition
        let whereCondition;
        if (status && isValidStatus(status)) {
          whereCondition = and(eq(ads.status, status), eq(ads.userId, userId));
        } else {
          whereCondition = eq(ads.userId, userId);
        }
    
        // ✅ Count total records
        const [{ count }] = await db
          .select({ count: sql<number>`count(*)` })
          .from(ads)
          .where(whereCondition);
    
        // ✅ Fetch paginated results
        const results = await db
          .select()
          .from(ads)
          .where(whereCondition)
          .limit(limit)
          .offset(offset);
    
        const totalCount = Number(count);
        const totalPages = Math.ceil(totalCount / limit);
    
        return {
          data: results as Ad[],
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
          "Failed to fetch ads for user",
          error instanceof Error ? error.message : error
        );
      }
    }
    
    
    async update(id: string, ad: Partial<InsertAd>): Promise<Ad | null> {
      try {
        const [result] = await db.update(ads).set(ad).where(eq(ads.id, id)).returning();
        return result ? (result as Ad) : null;
      } catch (error) {
        throw ErrorBuilder.build(
          ErrorCode.DATABASE_ERROR,
          "Failed to update ad",
          error instanceof Error ? error.message : error
        );
      }
    }
  
    async delete(id: string): Promise<boolean> {
      try {
        const result = await db.delete(ads).where(eq(ads.id, id)).returning({ id: ads.id });
        return result.length > 0;
      } catch (error) {
        throw ErrorBuilder.build(
          ErrorCode.DATABASE_ERROR,
          "Failed to delete ad",
          error instanceof Error ? error.message : error
        );
      }
    }

    async approveAd(id: string): Promise<Ad> {
      try {
        const [result] = await db
          .update(ads)
          .set({ 
            status: "approved",
            updatedAt: new Date()
          })
          .where(eq(ads.id, id))
          .returning();
        
        if (!result) {
          throw ErrorBuilder.build(
            ErrorCode.DATABASE_ERROR,
            "Ad not found or failed to approve"
          );
        }
        
        return result as Ad;
      } catch (error) {
        throw ErrorBuilder.build(
          ErrorCode.DATABASE_ERROR,
          "Failed to approve ad",
          error instanceof Error ? error.message : error
        );
      }
    }

    async rejectAd(id: string, reason?: string): Promise<Ad> {
      try {
        const updateData: any = {
          status: "rejected",
          updatedAt: new Date()
        };

        // Add rejection reason if provided
        if (reason) {
          updateData.rejectionReason = reason;
        }

        const [result] = await db
          .update(ads)
          .set(updateData)
          .where(eq(ads.id, id))
          .returning();
        
        if (!result) {
          throw ErrorBuilder.build(
            ErrorCode.DATABASE_ERROR,
            "Ad not found or failed to reject"
          );
        }
        
        return result as Ad;
      } catch (error) {
        throw ErrorBuilder.build(
          ErrorCode.DATABASE_ERROR,
          "Failed to reject ad",
          error instanceof Error ? error.message : error
        );
      }
    }
}