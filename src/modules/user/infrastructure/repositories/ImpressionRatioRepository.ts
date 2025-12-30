import { db } from "../../../../infrastructure/db/connection";
import { IImpressionRatio } from "../../domain/repositories/user.repository";

import { eq, sql } from "drizzle-orm";
import { adminImpressionRatio, AdminImpressionRatio } from "../../../../infrastructure/shared/schema/schema";
import { ErrorBuilder } from "../../../../infrastructure/shared/common/errors/errorBuilder";
import { ErrorCode } from "../../../../infrastructure/shared/common/errors/enums/basic.error.enum";

export class ImpressionRatioRepository implements IImpressionRatio {

  // ✅ Get all available ratios
  async getAvaialbeImpressionRatios(): Promise<AdminImpressionRatio[]> {
    try {
      const ratios = await db
        .select()
        .from(adminImpressionRatio)
        .orderBy(adminImpressionRatio.currency);

      return ratios;
    } catch (error) {
      throw ErrorBuilder.build(
        ErrorCode.DATABASE_ERROR,
        "Failed to fetch available impression ratios",
        error instanceof Error ? error.message : error
      );
    }
  }

  // ✅ Update an existing impression ratio
  async updateImpressionRatio(
    adminId: string,
    id: string,
    impressionsPerUnit: number,
    currency: "usd" | "sar"
  ): Promise<AdminImpressionRatio> {
    try {
      const [updated] = await db
        .update(adminImpressionRatio)
        .set({
          impressionsPerUnit,
          currency,
          updatedBy: adminId,
          updatedAt: sql`now()`,
        })
        .where(eq(adminImpressionRatio.id, id))
        .returning();

      if (!updated) {
        throw ErrorBuilder.build(
          ErrorCode.AD_NOT_FOUND,
          `Impression ratio with id ${id} not found`
        );
      }

      return updated;
    } catch (error) {
      throw ErrorBuilder.build(
        ErrorCode.DATABASE_ERROR,
        "Failed to update impression ratio",
        error instanceof Error ? error.message : error
      );
    }
  }
}
