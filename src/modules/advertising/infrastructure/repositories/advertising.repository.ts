import { and, eq, gt, inArray, like, or, sql } from "drizzle-orm";
import { IAdvertisingRepository } from "../../domain/repositories/advertising.repository.interface";
import { db } from "../../../../infrastructure/db/connection";
import { Ad, adminImpressionRatio, ads , InsertAd, socialMediaPages, users } from "../../../../infrastructure/shared/schema/schema";
import { ErrorBuilder } from "../../../../infrastructure/shared/common/errors/errorBuilder";
import { ErrorCode } from "../../../../infrastructure/shared/common/errors/enums/basic.error.enum";
import { PaginatedResponse, PaginationParams } from "../../../../infrastructure/shared/common/pagination.vo";
import { autheticatedPage } from "../../application/dto/authenticatedPage.dto";
import { ApproveAdData } from "../../application/dto/approveAdData";

export class AdvertisingRepository implements IAdvertisingRepository {
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
  

    async addPhotoToAd(id: string, photo: string): Promise<boolean> {
      try {
        const [updated] = await db
          .update(ads)
          .set({ imageUrl: photo }) 
          .where(eq(ads.id, id))
          .returning({ id: ads.id });
    
        if (!updated) {
          throw ErrorBuilder.build(
            ErrorCode.DATABASE_ERROR,
            `Failed to add photo to ad with id ${id}`
          );
        }
    
        return true;
      } catch (error) {
        throw ErrorBuilder.build(
          ErrorCode.DATABASE_ERROR,
          "Failed to add photo to ad",
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
          "Failed to fetch ads by title",
          error instanceof Error ? error.message : error
        );
      }
    }
    
  
    async findAllAdsForAdmin(
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

        console.log(whereCondition, status);
    
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
    
    async findAllAdsForUser(
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
        // Clone and sanitize the update data
        const updateData: any = { ...ad };
        
        // Convert date fields from strings to Date objects
        const dateFields = ['createdAt', 'updatedAt'] as const;
        
        dateFields.forEach(field => {
          if (updateData[field]) {
            // If it's a string, convert to Date
            if (typeof updateData[field] === 'string') {
              updateData[field] = new Date(updateData[field]);
            }
            // If it's already a Date, leave it as is
            // Drizzle will handle the conversion to ISO string
          }
        });
    
        const [result] = await db
          .update(ads)
          .set(updateData)
          .where(eq(ads.id, id))
          .returning();
          
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

    
async approveAd(id: string, data?: ApproveAdData): Promise<Ad> {
  try {
    // Build the update object dynamically
    const updateData: any = {
      status: "approved" as const,
      updatedAt: sql`now()`,
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


    async getAllPagesForUser(
      isActive: boolean,
      userId: string,
      params: PaginationParams
    ): Promise<PaginatedResponse<autheticatedPage>> {
      try {
        const { page, limit } = params;
        const offset = (page - 1) * limit;
    
        const whereCondition = and(
          eq(socialMediaPages.userId, userId),
          eq(socialMediaPages.isActive, isActive) 
        );
        
    
        // ✅ Count total records
        const [{ count }] = await db
          .select({ count: sql<number>`count(*)` })
          .from(socialMediaPages)
          .where(whereCondition);
    
        // ✅ Fetch paginated results
        const results = await db
          .select({
            pageId: socialMediaPages.pageId,
            pageName: socialMediaPages.pageName,
            pageType: socialMediaPages.pageType,
            connectedAt: socialMediaPages.connectedAt,
            updatedAt: socialMediaPages.updatedAt,
          })
          .from(socialMediaPages)
          .where(whereCondition)
          .limit(limit)
          .offset(offset);
    
        const totalCount = Number(count);
        const totalPages = Math.ceil(totalCount / limit);
    
        return {
          data: results as autheticatedPage[],
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
          "Failed to fetch authenticated pages for user",
          error instanceof Error ? error.message : error
        );
      }
    }

    async getPageAccessTokenById(
      userId: string,
      pageId: string
    ): Promise<string | null> {
      try {
        const result = await db
          .select({
            accessToken: socialMediaPages.pageAccessToken,
          })
          .from(socialMediaPages)
          .where(
            and(
              eq(socialMediaPages.userId, userId),
              eq(socialMediaPages.pageId, pageId),
              eq(socialMediaPages.isActive, true) 
            )
          )
          .limit(1);
    
        if (result.length === 0) {
          return null; // no token found
        }
    
        return result[0].accessToken;
      } catch (error) {
        throw ErrorBuilder.build(
          ErrorCode.DATABASE_ERROR,
          "Failed to fetch page access token",
          error instanceof Error ? error.message : error
        );
      }
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
        .where(eq(adminImpressionRatio.currency, 'sar'));  
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

    async listApprovedAdsForUser(
      pagination: PaginationParams
    ): Promise<PaginatedResponse<Ad>> {
      try {
        const { page } = pagination;
        const limit: number = 6;
        const offset = (page - 1) * limit;
    
        // Count total records
        const countQuery = db
          .select({ count: sql<number>`count(*)` })
          .from(ads)
          .where(
            and(
              eq(ads.status, "approved"),
              eq(ads.active, true),
              gt(ads.impressionsCredit, 0) 
            )
          );
    
        const [{ count }] = await countQuery;
    
        // Select paginated ads
        const resultsQuery = db
          .select({
            id: ads.id,
            imageUrl: ads.imageUrl,
            titleEn: ads.titleEn,
            titleAr: ads.titleAr,
            descriptionEn: ads.descriptionEn,
            descriptionAr: ads.descriptionAr,
            likesCount: ads.likesCount
          })
          .from(ads)
          .where(
            and(
              eq(ads.status, "approved"),
              eq(ads.active, true),
              gt(ads.impressionsCredit, 0)
            )
          )
          .limit(limit)
          .offset(offset);
    
        const results = await resultsQuery;
    
        // ✅ Decrement impression credits for fetched ads
        if (results.length > 0) {
          await db
            .update(ads)
            .set({
              impressionsCredit: sql`${ads.impressionsCredit} - 1`, // ✅ Use sql template
            })
            .where(
              inArray(
                ads.id,
                results.map((ad) => ad.id)
              ) 
            );
        }
    
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

    // Add to your repository
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