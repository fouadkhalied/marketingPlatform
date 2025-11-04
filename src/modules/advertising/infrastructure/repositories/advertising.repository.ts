import { and, desc, eq, gt, inArray, like, ne, or, sql } from "drizzle-orm";
import { IAdvertisingRepository } from "../../domain/repositories/advertising.repository.interface";
import { db } from "../../../../infrastructure/db/connection";
import { Ad, adminImpressionRatio, ads , impressionsEvents, InsertAd, pixels, socialMediaPages, targetAudienceEnum, users } from "../../../../infrastructure/shared/schema/schema";
import { ErrorBuilder } from "../../../../infrastructure/shared/common/errors/errorBuilder";
import { ErrorCode } from "../../../../infrastructure/shared/common/errors/enums/basic.error.enum";
import { PaginatedResponse, PaginationParams } from "../../../../infrastructure/shared/common/pagination.vo";
import { autheticatedPage } from "../../application/dto/authenticatedPage.dto";
import { ApproveAdData } from "../../application/dto/approveAdData";
import { pixel } from "../../../../infrastructure/shared/common/pixel/interface/pixelBody.interface";
import { targetAudienceValues } from "../../domain/enums/ads.targetAudence.enum";

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
  

  async addPhotoToAd(id: string, photos: string[]): Promise<boolean> {
    try {
      // Fetch current imageUrls
      const [current] = await db
        .select({ imageUrls: ads.imageUrl })
        .from(ads)
        .where(eq(ads.id, id));
  
      if (!current) {
        throw ErrorBuilder.build(
          ErrorCode.DATABASE_ERROR,
          `Ad with id ${id} not found`
        );
      }
  
      // Merge existing URLs with new ones
      const updatedUrls = [...(current.imageUrls || []), ...photos];
  
      // Update with merged array
      const [updated] = await db
        .update(ads)
        .set({ imageUrl: updatedUrls }) 
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
  
  async deletePhotoFromAd(id: string, userId: string, photoUrl: string): Promise<boolean> {
    // First, get the current ad to access its imageUrl
    const [ad] = await db
      .select({ imageUrl: ads.imageUrl })
      .from(ads)
      .where(and(eq(ads.id, id), eq(ads.userId, userId)))
      .limit(1);
    
    if (!ad || !ad.imageUrl) {
      throw ErrorBuilder.build(
        ErrorCode.AD_NOT_FOUND,
        `Ad with id ${id} not found or has no images`
      );
    }
    
    // Check if the photo URL exists in the array
    if (!ad.imageUrl.includes(photoUrl)) {
      throw ErrorBuilder.build(
        ErrorCode.PHOTO_NOT_FOUND,
        `Photo URL not found in ad with id ${id}`
      );
    }
    
    // Remove the photo at the specified URL
    const updatedImageUrl = ad.imageUrl.filter((url) => url !== photoUrl);
    
    // Update the ad with the new imageUrl array
    const [updated] = await db
      .update(ads)
      .set({ imageUrl: updatedImageUrl })
      .where(and(eq(ads.id, id), eq(ads.userId, userId)))
      .returning({ id: ads.id });
    
    if (!updated) {
      throw ErrorBuilder.build(
        ErrorCode.DATABASE_ERROR,
        `Failed to delete photo from ad with id ${id}`
      );
    }
    
    return true;
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
      active : true,
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

    async listApprovedAdsForUser(
      pagination: PaginationParams,
      targetCities: string[] = [],
      title?: string,
      description?: string,
      targetAudience: string[] = []
    ): Promise<PaginatedResponse<any>> {
      try {
        const { page, limit } = pagination;
        const offset = (page - 1) * limit;
    
        // ✅ Build WHERE conditions dynamically
        const whereConditions = and(
          eq(ads.status, "approved"),
          eq(ads.active, true),
          eq(ads.userActivation, true),
          gt(ads.impressionsCredit, 0),
          targetCities.length > 0
            ? sql`${ads.targetCities} && ARRAY[${sql.join(
                targetCities.map((city) => sql`${city}`),
                sql`, `
              )}]::ksa_cities[]`
            : undefined,
          targetAudience.length > 0
            ? sql`${ads.targetCities} && ARRAY[${sql.join(
              targetAudience.map((audience) => sql`${audience}`),
              sql`, `
            )}]::target_audience[]`
            : undefined,
          // ✅ Search in both titleEn and titleAr if title is provided
          title
            ? or(
                sql`LOWER(${ads.titleEn}) LIKE LOWER(${`%${title}%`})`,
                sql`LOWER(${ads.titleAr}) LIKE LOWER(${`%${title}%`})`
              )
            : undefined,
            // ✅ Search in both descriptionEn and descriptionAr if description is provided
          description
            ? or(
                sql`LOWER(${ads.descriptionEn}) LIKE LOWER(${`%${description}%`})`,
                sql`LOWER(${ads.descriptionAr}) LIKE LOWER(${`%${description}%`})`
              )
            : undefined
        );
    
        // ✅ Count total
        const [{ count }] = await db
          .select({ count: sql<number>`count(*)` })
          .from(ads)
          .where(whereConditions);
    
        // ✅ Fetch paginated ads with promoted ads first
        const results = await db
          .select({
            id: ads.id,
            imageUrl: ads.imageUrl,
            titleEn: ads.titleEn,
            titleAr: ads.titleAr,
            descriptionEn: ads.descriptionEn,
            descriptionAr: ads.descriptionAr,
            likesCount: ads.likesCount,
            impressions: ads.totalImpressionsOnAdd,
            targetCities: ads.targetCities,
            websiteUrl: ads.websiteUrl,
            websiteClicks: ads.websiteClicks,
            phoneNumber: ads.phoneNumber,
            hasPromoted: ads.hasPromoted,
            tiktokLink:ads.tiktokLink,
            youtubeLink:ads.youtubeLink, 
            googleAdsLink:ads.googleAdsLink, 
            instagramLink:ads.instagramLink, 
            facebookLink:ads.facebookLink, 
            snapchatLink:ads.snapchatLink 
          })
          .from(ads)
          .where(whereConditions)
          .orderBy(
            desc(ads.hasPromoted), // Promoted ads first (true before false)
            desc(ads.createdAt)     // Then by creation date (newest first)
          )
          .limit(limit)
          .offset(offset);
    
        // ✅ Decrement impression credits and increment total impressions
        if (results.length > 0) {
          const adIds = results.map((ad) => ad.id);
    
          await db
            .update(ads)
            .set({
              impressionsCredit: sql`${ads.impressionsCredit} - 1`,
              totalImpressionsOnAdd: sql`${ads.totalImpressionsOnAdd} + 1`,
            })
            .where(inArray(ads.id, adIds));
    
          // ✅ Insert an impression event per ad
          const impressionEventsData = adIds.map((adId) => ({
            eventId: `impression_${adId}_${Date.now()}_${Math.random()}`,
            adId,
          }));
    
          await db.insert(impressionsEvents).values(impressionEventsData);
        }
    
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
          "Failed to fetch ads for user",
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
async updatePhotoFromAd(
  id: string, 
  userId: string, 
  newPhotoUrl: string,
  oldPhotoUrl: string,
  role: string
): Promise<boolean> {
  try {
    let ad: any;

    // Corrected logic: admins can access any ad, users only their own
    if (role === "admin") {
      ad = await db
        .select({ imageUrl: ads.imageUrl })
        .from(ads)
        .where(eq(ads.id, id))
        .limit(1);
    } else {
      ad = await db
        .select({ imageUrl: ads.imageUrl })
        .from(ads)
        .where(and(eq(ads.id, id), eq(ads.userId, userId)))
        .limit(1);
    }
    
    if (!ad || ad.length === 0 || !ad[0].imageUrl) {
      throw ErrorBuilder.build(
        ErrorCode.AD_NOT_FOUND,
        `Ad with id ${id} not found or has no images`
      );
    }
    
    // Access the first element since select returns an array
    const currentAd = ad[0];
    
    if (!currentAd.imageUrl.includes(oldPhotoUrl)) {
      throw ErrorBuilder.build(
        ErrorCode.PHOTO_NOT_FOUND,
        `Photo URL not found in ad with id ${id}`
      );
    }
    
    const updatedImageUrl = currentAd.imageUrl.map((url: string) => 
      url === oldPhotoUrl ? newPhotoUrl : url
    );
    
    // Apply same role-based logic to update
    const updateCondition = role === "admin" 
      ? eq(ads.id, id)
      : and(eq(ads.id, id), eq(ads.userId, userId));
    
    const [updated] = await db
      .update(ads)
      .set({ imageUrl: updatedImageUrl })
      .where(updateCondition)
      .returning({ id: ads.id });
    
    if (!updated) {
      throw ErrorBuilder.build(
        ErrorCode.DATABASE_ERROR,
        `Failed to update photo in ad with id ${id}`
      );
    }
    
    return true;
  } catch (error) {
    if (error instanceof Error && error.name === 'CustomError') {
      throw error;
    }
    
    throw ErrorBuilder.build(
      ErrorCode.DATABASE_ERROR,
      "Failed to update photo in ad",
      error instanceof Error ? error.message : String(error)
    );
  }
}
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

async createPixel(pixelData: pixel): Promise<any> {
    // ✅ 1. Check if a pixel with the same platform + pixelId already exists
    const [existingPixel] = await db
      .select()
      .from(pixels)
      .where(
        and(
          eq(pixels.pixelId, pixelData.pixelId),
          eq(pixels.platform, pixelData.platform)
        )
      )
      .limit(1);

    if (existingPixel) {
      throw ErrorBuilder.build(
        ErrorCode.VALIDATION_ERROR,
        `A pixel with ID "${pixelData.pixelId}" already exists for platform "${pixelData.platform}"`
      );
    }

    // ✅ 2. Insert new pixel
    const [createdPixel] = await db
      .insert(pixels)
      .values({
        name: pixelData.name,
        pixelId: pixelData.pixelId,
        platform: pixelData.platform,
      })
      .returning();

    // ✅ 3. Check insertion result
    if (!createdPixel) {
      throw ErrorBuilder.build(
        ErrorCode.DATABASE_ERROR,
        'Failed to create pixel record'
      );
    }

    return createdPixel;
}

// Repository Layer - Add to your repository file

async getPixelById(pixelId: string): Promise<pixel | null> {
  const [foundPixel] = await db
    .select()
    .from(pixels)
    .where(eq(pixels.id, pixelId))
    .limit(1);

  return foundPixel || null;
}

async getAllPixels(pagination: PaginationParams): Promise<PaginatedResponse<pixel>> {
  const { page = 1, limit = 10 } = pagination;
  const offset = (page - 1) * limit;

  // Get total count
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(pixels);

  // Get paginated data
  const pixelsList = await db
    .select()
    .from(pixels)
    .limit(limit)
    .offset(offset)
    .orderBy(desc(pixels.createdAt));

  const totalPages = Math.ceil(count / limit);

  return {
    data: pixelsList,
    pagination: {
      currentPage : page,
      limit,
      totalCount: count,
      totalPages: totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    },
  };
}

async updatePixel(
  pixelId: string,
  updateData: Partial<pixel>
): Promise<pixel> {
  // Check if pixel exists
  const [existingPixel] = await db
    .select()
    .from(pixels)
    .where(eq(pixels.id, pixelId))
    .limit(1);

  if (!existingPixel) {
    throw ErrorBuilder.build(
      ErrorCode.PIXEL_NOT_FOUND,
      `Pixel with ID "${pixelId}" not found`
    );
  }

  // If updating pixelId or platform, check for duplicates
  if (updateData.pixelId || updateData.platform) {
    const checkPixelId = updateData.pixelId || existingPixel.pixelId;
    const checkPlatform = updateData.platform || existingPixel.platform;

    const [duplicate] = await db
      .select()
      .from(pixels)
      .where(
        and(
          eq(pixels.pixelId, checkPixelId),
          eq(pixels.platform, checkPlatform),
          ne(pixels.id, pixelId) // Exclude current pixel
        )
      )
      .limit(1);

    if (duplicate) {
      throw ErrorBuilder.build(
        ErrorCode.VALIDATION_ERROR,
        `A pixel with ID "${checkPixelId}" already exists for platform "${checkPlatform}"`
      );
    }
  }

  // Update pixel
  const [updatedPixel] = await db
    .update(pixels)
    .set({
      ...updateData,
      updatedAt: new Date(),
    })
    .where(eq(pixels.id, pixelId))
    .returning();

  if (!updatedPixel) {
    throw ErrorBuilder.build(
      ErrorCode.DATABASE_ERROR,
      "Failed to update pixel"
    );
  }

  return updatedPixel;
}

async deletePixel(pixelId: string): Promise<boolean> {
  // Check if pixel exists
  const [existingPixel] = await db
    .select()
    .from(pixels)
    .where(eq(pixels.id, pixelId))
    .limit(1);

  if (!existingPixel) {
    throw ErrorBuilder.build(
      ErrorCode.PIXEL_NOT_FOUND,
      `Pixel with ID "${pixelId}" not found`
    );
  }

  // Delete pixel
  const [deletedPixel] = await db
    .delete(pixels)
    .where(eq(pixels.id, pixelId))
    .returning({ id: pixels.id });

  if (!deletedPixel) {
    throw ErrorBuilder.build(
      ErrorCode.DATABASE_ERROR,
      "Failed to delete pixel"
    );
  }

  return true;
}


}