import { and, eq } from "drizzle-orm";
import { db } from "../../../../infrastructure/db/connection";
import { auditLogs, socialMediaPages } from "../../../../infrastructure/shared/schema/schema";
import { FacebookPageRepository } from "../../domain/repositories/facebook.interface";

export class FacebookPageRepositoryImpl implements FacebookPageRepository {

    async savePageAccessToken(
    userId: string, 
    pageId: string, 
    accessToken: string, 
    pageName: string
  ): Promise<void> {
    try {
      // Check if page already exists for this user
      const existingPage = await db
        .select()
        .from(socialMediaPages)
        .where(
          and(
            eq(socialMediaPages.userId, userId),
            eq(socialMediaPages.pageId, pageId),
            eq(socialMediaPages.pageType, 'facebook') // Assuming enum value
          )
        )
        .limit(1);

      if (existingPage.length > 0) {
        // Update existing page
        await db
          .update(socialMediaPages)
          .set({
            pageName,
            pageAccessToken: accessToken,
            isActive: true,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(socialMediaPages.userId, userId),
              eq(socialMediaPages.pageId, pageId),
              eq(socialMediaPages.pageType, 'facebook')
            )
          );
      } else {
        // Insert new page record
        await db
          .insert(socialMediaPages)
          .values({
            userId,
            pageType: 'facebook', 
            pageId,
            pageName,
            pageAccessToken: accessToken,
            isActive: true,
          });
      }
    } catch (error) {
      console.error('Error saving Facebook page access token:', error);
      throw new Error('Failed to save page access token to database');
    }
  }

  async logApiUsage(userId: string, endpoint: string, timestamp: Date): Promise<void> {
    try {
      await db
        .insert(auditLogs)
        .values({
          userId,
          action: 'FACEBOOK_API_CALL',
          resourceType: 'facebook_api',
          resourceId: endpoint,
          details: {
            endpoint,
            timestamp: timestamp.toISOString(),
            service: 'facebook_page_service'
          }
        });
    } catch (error) {
      console.error('Error logging Facebook API usage:', error);
      // Don't throw error for logging failures
    }
  }
}