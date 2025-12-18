import { and, eq, sql } from "drizzle-orm";
import { IAdPromotionRepository } from "../../domain/repositories/ad.promotion.repository.interface";
import { db } from "../../../../infrastructure/db/connection";
import { Ad, adminImpressionRatio, ads, users } from "../../../../infrastructure/shared/schema/schema";
import { ErrorBuilder } from "../../../../infrastructure/shared/common/errors/errorBuilder";
import { ErrorCode } from "../../../../infrastructure/shared/common/errors/enums/basic.error.enum";

export class AdPromotionRepository implements IAdPromotionRepository {
  async promoteAd(id: string, userId: string): Promise<Ad> {
    return await db.transaction(async (tx) => {
      // Verify the ad exists and belongs to the user
      const [existingAd] = await tx
        .select()
        .from(ads)
        .where(and(eq(ads.id, id), eq(ads.userId, userId)))
        .limit(1);

      if (!existingAd) {
        throw ErrorBuilder.build(
          ErrorCode.AD_NOT_FOUND,
          "Ad not found or you don't have permission to promote this ad"
        );
      }

      // Check if already promoted
      if (existingAd.hasPromoted) {
        throw ErrorBuilder.build(
          ErrorCode.VALIDATION_ERROR,
          "Ad is already promoted"
        );
      }

      // Get promotion ratio
      const [ratio] = await tx
        .select({ impressionsPerUnit: adminImpressionRatio.impressionsPerUnit })
        .from(adminImpressionRatio)
        .where(
          and(
            eq(adminImpressionRatio.currency, 'sar'),
            eq(adminImpressionRatio.promoted, true)
          )
        );

      if (!ratio) {
        throw ErrorBuilder.build(
          ErrorCode.VALIDATION_ERROR,
          "Ratio for promoted ads not found"
        );
      }

      // Calculate promotion cost (rounded to integer)
      const promotionCost = Math.round(existingAd.impressionsCredit / ratio.impressionsPerUnit);
      console.log('Promotion cost:', promotionCost);

      // Get user's current balance
      const [user] = await tx
        .select({ balance: users.balance })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user || user.balance === null || user.balance < promotionCost) {
        throw ErrorBuilder.build(
          ErrorCode.INSUFFICIENT_BALANCE,
          `Insufficient balance. Promotion costs ${promotionCost} credits`
        );
      }

      // Deduct balance from user
      await tx
        .update(users)
        .set({
          balance: sql`${users.balance} - ${promotionCost}`
        })
        .where(eq(users.id, userId));

      // Promote the ad and update spend in a single query
      const [promotedAd] = await tx
        .update(ads)
        .set({
          hasPromoted: true,
          spended: sql`${ads.spended} + ${promotionCost}`,
          updatedAt: new Date()
        })
        .where(eq(ads.id, id))
        .returning();

      if (!promotedAd) {
        throw ErrorBuilder.build(
          ErrorCode.DATABASE_ERROR,
          "Failed to promote ad"
        );
      }

      return promotedAd;
    });
  }

  async dePromoteAd(id: string, userId: string): Promise<Ad> {
    return await db.transaction(async (tx) => {
      // Verify the ad exists and belongs to the user
      const [existingAd] = await tx
        .select()
        .from(ads)
        .where(and(eq(ads.id, id), eq(ads.userId, userId)))
        .limit(1);

      if (!existingAd) {
        throw ErrorBuilder.build(
          ErrorCode.AD_NOT_FOUND,
          "Ad not found or you don't have permission to depromote this ad"
        );
      }

      // Check if already depromoted
      if (!existingAd.hasPromoted) {
        throw ErrorBuilder.build(
          ErrorCode.VALIDATION_ERROR,
          "Ad is already depromoted"
        );
      }

      // Get promotion ratio
      const [ratio] = await tx
        .select({ impressionsPerUnit: adminImpressionRatio.impressionsPerUnit })
        .from(adminImpressionRatio)
        .where(
          and(
            eq(adminImpressionRatio.currency, 'sar'),
            eq(adminImpressionRatio.promoted, true)
          )
        );

      if (!ratio) {
        throw ErrorBuilder.build(
          ErrorCode.VALIDATION_ERROR,
          "Ratio for promoted ads not found"
        );
      }

      // Calculate refund amount (rounded to integer)
      const refundAmount = Math.round(existingAd.impressionsCredit / ratio.impressionsPerUnit);
      console.log('Refund amount:', refundAmount);

      // Refund balance to user
      await tx
        .update(users)
        .set({
          balance: sql`${users.balance} + ${refundAmount}`
        })
        .where(eq(users.id, userId));

      // Depromote the ad and update spend in a single query
      const [dePromotedAd] = await tx
        .update(ads)
        .set({
          hasPromoted: false,
          spended: sql`${ads.spended} - ${refundAmount}`,
          updatedAt: new Date()
        })
        .where(eq(ads.id, id))
        .returning();

      if (!dePromotedAd) {
        throw ErrorBuilder.build(
          ErrorCode.DATABASE_ERROR,
          "Failed to depromote ad"
        );
      }

      return dePromotedAd;
    });
  }

  async assignCreditToAd(userId: string, adId: string, credit: number): Promise<Ad | null> {
    return await db.transaction(async (tx) => {
      // 1. Subtract from user balance
      await tx
        .update(users)
        .set({ balance: sql`${users.balance} - ${credit}` })
        .where(eq(users.id, userId));


      const [ratio] = await tx
        .select({ impressionsPerUnit: adminImpressionRatio.impressionsPerUnit })
        .from(adminImpressionRatio)
        .where(and(eq(adminImpressionRatio.currency, 'sar'), eq(adminImpressionRatio.promoted,false)));
      // Calculate total impressions
      const totalImpressions = credit * Number(ratio.impressionsPerUnit);

      // 2. Add to ad balance
      const [updatedAd] = await tx
        .update(ads)
        .set({
          impressionsCredit: sql`${ads.impressionsCredit} + ${totalImpressions}`,
          spended: sql`${ads.spended} + ${credit}`,
          updatedAt: new Date(),
        })
        .where(eq(ads.id, adId))
        .returning();

      // 3. Add impressions to add

      return updatedAd ?? null;
    });
  }

  async hasSufficientBalance(userId: string, credit: number): Promise<boolean> {
    const [user] = await db
      .select({ balance: users.balance })
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      throw new Error("User not found");
    }

    const balance = user.balance ?? 0; // treat null as 0

    return balance >= credit;
  }
}
