import { and, eq, sql } from "drizzle-orm";
import { ISocialMediaPageRepository } from "../../domain/repositories/social.media.page.repository.interface";
import { db } from "../../../../infrastructure/db/connection";
import { socialMediaPages } from "../../../../infrastructure/shared/schema/schema";
import { ErrorBuilder } from "../../../../infrastructure/shared/common/errors/errorBuilder";
import { ErrorCode } from "../../../../infrastructure/shared/common/errors/enums/basic.error.enum";
import { PaginatedResponse, PaginationParams } from "../../../../infrastructure/shared/common/pagination.vo";
import { autheticatedPage } from "../../application/dto/authenticatedPage.dto";

export class SocialMediaPageRepository implements ISocialMediaPageRepository {
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
}
