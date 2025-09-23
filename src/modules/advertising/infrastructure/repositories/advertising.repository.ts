import { and, eq, sql } from "drizzle-orm";
import { IAdvertisingRepository } from "../../domain/repositories/advertising.repository.interface";
import { db } from "../../../../infrastructure/db/connection";
import { Ad, ads , InsertAd } from "../../../../infrastructure/shared/schema/schema";
import { ErrorBuilder } from "../../../../infrastructure/shared/common/errors/errorBuilder";
import { ErrorCode } from "../../../../infrastructure/shared/common/errors/enums/basic.error.enum";
import { AdStatus } from "../../domain/entities/enums/ads.status.enum";
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
    async findAllForAdmin(status: AdStatus, pagination: PaginationParams): Promise<PaginatedResponse<Ad>> {
      try {
        const { page, limit } = pagination;
        const offset = (page - 1) * limit;
    
        // Count total records
        const [{ count }] = await db
          .select({ count: sql<number>`count(*)` })
          .from(ads)
          .where(eq(ads.status, status));
    
        const results = await db
          .select()
          .from(ads)
          .where(eq(ads.status, status))
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
          "Failed to fetch ads for admin",
          error instanceof Error ? error.message : error
        );
      }
    }
    
    async findAllForUser(status: AdStatus, userId: string, pagination: PaginationParams): Promise<PaginatedResponse<Ad>> {
      try {
        const { page, limit } = pagination;
        const offset = (page - 1) * limit;
    
        // Count total records
        const [{ count }] = await db
          .select({ count: sql<number>`count(*)` })
          .from(ads)
          .where(and(eq(ads.status, status), eq(ads.userId, userId)));
    
        const results = await db
          .select()
          .from(ads)
          .where(and(eq(ads.status, status), eq(ads.userId, userId)))
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
  }
  