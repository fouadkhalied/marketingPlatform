import { and, eq, sql } from "drizzle-orm";
import { IAdStatusRepository } from "../../domain/repositories/ad.status.repository.interface";
import { db } from "../../../../infrastructure/db/connection";
import { Ad, ads } from "../../../../infrastructure/shared/schema/schema";
import { ErrorBuilder } from "../../../../infrastructure/shared/common/errors/errorBuilder";
import { ErrorCode } from "../../../../infrastructure/shared/common/errors/enums/basic.error.enum";
import { ApproveAdData } from "../../application/dto/approveAdData";

export class AdStatusRepository implements IAdStatusRepository {
  async approveAd(id: string, data?: ApproveAdData): Promise<Ad> {
    try {
      // Build the update object dynamically
      const updateData: any = {
        active : true,
        status: "approved" as const,
        updatedAt: sql`now()`,
        rejectionReason: ''
      };

      // Add social media links only if they are provided
      if (data?.tiktokLink) updateData.tiktokLink = data.tiktokLink;
      if (data?.youtubeLink) updateData.youtubeLink = data.youtubeLink;
      if (data?.googleAdsLink) updateData.googleAdsLink = data.googleAdsLink;
      if (data?.instagramLink) updateData.instagramLink = data.instagramLink;
      if (data?.facebookLink) updateData.facebookLink = data.facebookLink;
      if (data?.snapchatLink) updateData.snapchatLink = data.snapchatLink;

      const [result] = await db
        .update(ads)
        .set(updateData)
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

  async activateAd(id: string): Promise<Ad> {
    // First, fetch the ad to check its status
    const [existingAd] = await db
      .select()
      .from(ads)
      .where(eq(ads.id, id))
      .limit(1);

    // Check if ad exists
    if (!existingAd) {
      throw ErrorBuilder.build(
        ErrorCode.AD_NOT_FOUND,
        "Ad not found"
      );
    }

    // Check if ad is approved
    if (existingAd.status !== "approved") {
      throw ErrorBuilder.build(
        ErrorCode.VALIDATION_ERROR,
        `Cannot activate ad. Ad must be approved first. Current status: ${existingAd.status}`
      );
    }

    // Check if ad has sufficient credits
    if (existingAd.budgetType === "impressions" && existingAd.impressionsCredit <= 0) {
      throw ErrorBuilder.build(
        ErrorCode.VALIDATION_ERROR,
        "Cannot activate ad: insufficient impression credits"
      );
    }

    // Update to active
    const [result] = await db
      .update(ads)
      .set({
        active: true,
        updatedAt: new Date()
      })
      .where(eq(ads.id, id))
      .returning();

    if (!result) {
      throw ErrorBuilder.build(
        ErrorCode.DATABASE_ERROR,
        "Failed to activate ad"
      );
    }

    return result as Ad;
  }

  async activateUserAd(id: string, userId:string): Promise<Ad> {
    // Verify the ad belongs to the user
    const [existingAd] = await db
      .select()
      .from(ads)
      .where(
        and(
          eq(ads.id, id),
          eq(ads.userId, userId)
        )
      )
      .limit(1);

    if (!existingAd) {
      throw ErrorBuilder.build(
        ErrorCode.AD_NOT_FOUND,
        "Ad not found or you don't have permission to activate this ad"
      );
    }

    // Check if already inactive
    if (existingAd.userActivation) {
      throw ErrorBuilder.build(
        ErrorCode.VALIDATION_ERROR,
        "Ad is already active"
      );
    }
    // Update to active
    const [result] = await db
      .update(ads)
      .set({
        userActivation: true,
        updatedAt: new Date()
      })
      .where(eq(ads.id, id))
      .returning();

    if (!result) {
      throw ErrorBuilder.build(
        ErrorCode.DATABASE_ERROR,
        "Failed to activate ad for user"
      );
    }

    return result as Ad;
  }

  async deactivateUserAd(userId: string, adId: string): Promise<Ad> {
    // Verify the ad belongs to the user
    const [existingAd] = await db
      .select()
      .from(ads)
      .where(
        and(
          eq(ads.id, adId),
          eq(ads.userId, userId)
        )
      )
      .limit(1);

    if (!existingAd) {
      throw ErrorBuilder.build(
        ErrorCode.AD_NOT_FOUND,
        "Ad not found or you don't have permission to deactivate this ad"
      );
    }

    // Check if already inactive
    if (!existingAd.userActivation) {
      throw ErrorBuilder.build(
        ErrorCode.VALIDATION_ERROR,
        "Ad is already inactive"
      );
    }

    // Deactivate the ad
    const [deactivatedAd] = await db
      .update(ads)
      .set({
        userActivation: false,
        updatedAt: new Date()
      })
      .where(eq(ads.id, adId))
      .returning();

    if (!deactivatedAd) {
      throw ErrorBuilder.build(
        ErrorCode.DATABASE_ERROR,
        "Failed to deactivate ad"
      );
    }

    return deactivatedAd;
  }

  async deactivateUserAdByAdmin(userId: string, adId: string): Promise<Ad> {
    // Verify the ad belongs to the user
    const [existingAd] = await db
      .select()
      .from(ads)
      .where(
        and(
          eq(ads.id, adId),
        )
      )
      .limit(1);

    if (!existingAd) {
      throw ErrorBuilder.build(
        ErrorCode.AD_NOT_FOUND,
        "Ad not found or you don't have permission to deactivate this ad"
      );
    }

    // Check if already inactive
    if (!existingAd.active) {
      throw ErrorBuilder.build(
        ErrorCode.VALIDATION_ERROR,
        "Ad is already inactive"
      );
    }

    // Deactivate the ad
    const [deactivatedAd] = await db
      .update(ads)
      .set({
        active: false,
        updatedAt: new Date()
      })
      .where(eq(ads.id, adId))
      .returning();

    if (!deactivatedAd) {
      throw ErrorBuilder.build(
        ErrorCode.DATABASE_ERROR,
        "Failed to deactivate ad"
      );
    }

    return deactivatedAd;
  }
}
