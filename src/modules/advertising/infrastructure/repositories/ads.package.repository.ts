import { eq, sql } from "drizzle-orm";
import { IAdsPackageRepository } from "../../domain/repositories/ads.package.repository.interface";
import { db } from "../../../../infrastructure/db/connection";
import { AdsPackage, adsPackages, InsertAdsPackage } from "../../../../infrastructure/shared/schema/schema";
import { ErrorBuilder } from "../../../../infrastructure/shared/common/errors/errorBuilder";
import { ErrorCode } from "../../../../infrastructure/shared/common/errors/enums/basic.error.enum";
import { PaginatedResponse, PaginationParams } from "../../../../infrastructure/shared/common/pagination.vo";

export class AdsPackageRepository implements IAdsPackageRepository {
  async create(adsPackage: InsertAdsPackage): Promise<string> {
    try {
      const result = await db
        .insert(adsPackages)
        .values(adsPackage)
        .returning({ id: adsPackages.id });

      if (!result[0]) {
        throw ErrorBuilder.build(ErrorCode.DATABASE_ERROR, "Failed to insert ads package");
      }

      return result[0].id;
    } catch (error) {
      throw ErrorBuilder.build(
        ErrorCode.DATABASE_ERROR,
        "Failed to create ads package",
        error instanceof Error ? error.message : error
      );
    }
  }

  async findById(id: string): Promise<AdsPackage | null> {
    try {
      const [result] = await db
        .select()
        .from(adsPackages)
        .where(eq(adsPackages.id, id));

      return result ? (result as AdsPackage) : null;
    } catch (error) {
      throw ErrorBuilder.build(
        ErrorCode.DATABASE_ERROR,
        "Failed to fetch ads package by id",
        error instanceof Error ? error.message : error
      );
    }
  }

  async findAll(params: PaginationParams): Promise<PaginatedResponse<AdsPackage>> {
    try {
      const { page, limit } = params;
      const offset = (page - 1) * limit;

      // Count total records
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(adsPackages);

      // Fetch paginated results
      const results = await db
        .select()
        .from(adsPackages)
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
        "Failed to fetch ads packages",
        error instanceof Error ? error.message : error
      );
    }
  }

  async update(id: string, adsPackage: Partial<InsertAdsPackage>): Promise<AdsPackage | null> {
    try {
      const [result] = await db
        .update(adsPackages)
        .set(adsPackage)
        .where(eq(adsPackages.id, id))
        .returning();

      return result ? (result as AdsPackage) : null;
    } catch (error) {
      throw ErrorBuilder.build(
        ErrorCode.DATABASE_ERROR,
        "Failed to update ads package",
        error instanceof Error ? error.message : error
      );
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const result = await db
        .delete(adsPackages)
        .where(eq(adsPackages.id, id))
        .returning({ id: adsPackages.id });

      return result.length > 0;
    } catch (error) {
      throw ErrorBuilder.build(
        ErrorCode.DATABASE_ERROR,
        "Failed to delete ads package",
        error instanceof Error ? error.message : error
      );
    }
  }
}
