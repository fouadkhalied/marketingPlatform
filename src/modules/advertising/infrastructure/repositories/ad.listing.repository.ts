import { and, desc, eq, gt, inArray, like, or, sql } from "drizzle-orm";
import { IAdListingRepository } from "../../domain/repositories/ad.listing.repository.interface";
import { db } from "../../../../infrastructure/db/connection";
import { Ad, ads , impressionsEvents } from "../../../../infrastructure/shared/schema/schema";
import { ErrorBuilder } from "../../../../infrastructure/shared/common/errors/errorBuilder";
import { ErrorCode } from "../../../../infrastructure/shared/common/errors/enums/basic.error.enum";
import { PaginatedResponse, PaginationParams } from "../../../../infrastructure/shared/common/pagination.vo";
import { targetAudienceValues } from "../../domain/enums/ads.targetAudence.enum";

export class AdListingRepository implements IAdListingRepository {
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

  async listAdsFeed(
    pagination: PaginationParams,
    targetCities: string[] = [],
    title?: string,
    description?: string,
    targetAudience?: targetAudienceValues,
    source?:string
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
        targetAudience
          ? eq(ads.targetAudience, targetAudience)
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
          targetAudience: ads.targetAudience,
          hasPromoted: ads.hasPromoted,
          tiktokLink:ads.tiktokLink,
          youtubeLink:ads.youtubeLink,
          youtubeVideo:ads.youtubeVideo,
          googleAdsLink:ads.googleAdsLink,
          instagramLink:ads.instagramLink,
          facebookLink:ads.facebookLink,
          snapchatLink:ads.snapchatLink
        })
        .from(ads)
        .where(whereConditions)
        .orderBy(
          desc(ads.hasPromoted), // Promoted ads first (true before false)
          sql`RANDOM()`,
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
          source: source ? source : "web",
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


  async listApprovedAdsForUser(
    pagination: PaginationParams,
    targetCities: string[] = [],
    title?: string,
    description?: string,
    targetAudience?: targetAudienceValues,
    source?:string
  ): Promise<PaginatedResponse<any>> {
    try {
      const { page, limit } = pagination;
      const offset = (page - 1) * limit;

      // ✅ Build WHERE conditions dynamically
      const whereConditions = and(
        eq(ads.status, "approved"),
        eq(ads.active, true),
        eq(ads.userActivation, true),
        eq(ads.impressionsCredit, 0),
        targetCities.length > 0
          ? sql`${ads.targetCities} && ARRAY[${sql.join(
              targetCities.map((city) => sql`${city}`),
              sql`, `
            )}]::ksa_cities[]`
          : undefined,
        targetAudience
          ? eq(ads.targetAudience, targetAudience)
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
          targetAudience: ads.targetAudience,
          hasPromoted: ads.hasPromoted,
          tiktokLink:ads.tiktokLink,
          youtubeLink:ads.youtubeLink,
          youtubeVideo:ads.youtubeVideo,
          googleAdsLink:ads.googleAdsLink,
          instagramLink:ads.instagramLink,
          facebookLink:ads.facebookLink,
          snapchatLink:ads.snapchatLink
        })
        .from(ads)
        .where(whereConditions)
        .orderBy(
          sql`RANDOM()`,
          desc(ads.createdAt)     // Then by creation date (newest first)
        )
        .limit(limit)
        .offset(offset);


        if (results.length > 0) {
          const adIds = results.map((ad) => ad.id);
  
          await db
            .update(ads)
            .set({
              freeViews: sql`${ads.freeViews} + 1`
            })
            .where(inArray(ads.id, adIds));
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
}
