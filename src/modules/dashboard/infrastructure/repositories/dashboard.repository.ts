import { and, eq, gte, lte, inArray, sql, desc, asc } from "drizzle-orm";
import { db } from "../../../../infrastructure/db/connection";
import { ads, users, impressionsEvents, clicksEvents } from "../../../../infrastructure/shared/schema/schema";
import { ErrorBuilder } from "../../../../infrastructure/shared/common/errors/errorBuilder";
import { ErrorCode } from "../../../../infrastructure/shared/common/errors/enums/basic.error.enum";
import { AdminChartData, AdminDashboardStats, ChartData, DashboardStats, RecentActivity, TopPerformingAd } from "../../application/dtos/dashboard.interfaces";
import { IDashboardRepository } from "../../domain/repositories/dashboard.repository.interface";

export class DashboardRepository implements IDashboardRepository {
  async getDashboardStats(userId: string, days: number = 7): Promise<DashboardStats> {
    try {
      const currentPeriodStart = new Date();
      currentPeriodStart.setDate(currentPeriodStart.getDate() - days);

      const previousPeriodStart = new Date();
      previousPeriodStart.setDate(previousPeriodStart.getDate() - (days * 2));

      const previousPeriodEnd = new Date(currentPeriodStart);

      // Get user's ads
      const userAds = await db
        .select({ id: ads.id })
        .from(ads)
        .where(eq(ads.userId, userId));

      const adIds = userAds.map(ad => ad.id);

         // Get user balance
         const [userBalance] = await db
         .select({
           balance: users.balance,
           freeViewsCredits: users.freeViewsCredits
         })
         .from(users)
         .where(eq(users.id, userId));

      if (adIds.length === 0) {
        return {
          totalImpressions: 0,
          impressionGrowth: 0,
          totalClicks: 0,
          clickGrowth: 0,
          clickThroughRate: 0,
          ctrGrowth: 0,
          remainingBalance: userBalance?.balance || 0,
          balanceGrowth: 0,
        };
      }

      // Current period impressions - FIXED: Use inArray instead of ANY
      const currentImpressions = await db
        .select({ count: sql<number>`count(*)` })
        .from(impressionsEvents)
        .where(
          and(
            inArray(impressionsEvents.adId, adIds),
            gte(impressionsEvents.createdAt, currentPeriodStart)
          )
        );

      // Previous period impressions - FIXED: Use inArray instead of ANY
      const previousImpressions = await db
        .select({ count: sql<number>`count(*)` })
        .from(impressionsEvents)
        .where(
          and(
            inArray(impressionsEvents.adId, adIds),
            gte(impressionsEvents.createdAt, previousPeriodStart),
            lte(impressionsEvents.createdAt, previousPeriodEnd)
          )
        );

      // Current period clicks - FIXED: Use inArray instead of ANY
      const currentClicks = await db
        .select({ count: sql<number>`count(*)` })
        .from(clicksEvents)
        .where(
          and(
            inArray(clicksEvents.adId, adIds),
            gte(clicksEvents.createdAt, currentPeriodStart)
          )
        );

      // Previous period clicks - FIXED: Use inArray instead of ANY
      const previousClicks = await db
        .select({ count: sql<number>`count(*)` })
        .from(clicksEvents)
        .where(
          and(
            inArray(clicksEvents.adId, adIds),
            gte(clicksEvents.createdAt, previousPeriodStart),
            lte(clicksEvents.createdAt, previousPeriodEnd)
          )
        );

      const totalImpressions = Number(currentImpressions[0]?.count || 0);
      const prevImpressions = Number(previousImpressions[0]?.count || 0);
      const totalClicks = Number(currentClicks[0]?.count || 0);
      const prevClicks = Number(previousClicks[0]?.count || 0);

      // Calculate growth percentages
      const impressionGrowth = prevImpressions > 0
        ? ((totalImpressions - prevImpressions) / prevImpressions) * 100
        : 0;

      const clickGrowth = prevClicks > 0
        ? ((totalClicks - prevClicks) / prevClicks) * 100
        : 0;

      // Calculate CTR
      const currentCTR = totalImpressions > 0
        ? (totalClicks / totalImpressions) * 100
        : 0;

      const previousCTR = prevImpressions > 0
        ? (prevClicks / prevImpressions) * 100
        : 0;

      const ctrGrowth = previousCTR > 0
        ? ((currentCTR - previousCTR) / previousCTR) * 100
        : 0;

      const remainingBalance = (userBalance?.balance || 0);

      return {
        totalImpressions,
        impressionGrowth: Math.round(impressionGrowth * 10) / 10,
        totalClicks,
        clickGrowth: Math.round(clickGrowth * 10) / 10,
        clickThroughRate: Math.round(currentCTR * 100) / 100,
        ctrGrowth: Math.round(ctrGrowth * 10) / 10,
        remainingBalance,
        balanceGrowth: 0, // You can implement balance growth if tracking history
      };
    } catch (error) {
      throw ErrorBuilder.build(
        ErrorCode.DATABASE_ERROR,
        "Failed to fetch dashboard stats",
        error instanceof Error ? error.message : error
      );
    }
  }

  async getChartData(userId: string, days: number = 7): Promise<ChartData[]> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get user's ads
      const userAds = await db
        .select({ id: ads.id })
        .from(ads)
        .where(eq(ads.userId, userId));

      const adIds = userAds.map(ad => ad.id);

      if (adIds.length === 0) {
        return [];
      }

      // Get daily impressions and clicks for the last N days
      const dailyData = await db
        .select({
          date: sql<string>`DATE(${impressionsEvents.createdAt})`,
          impressions: sql<number>`COUNT(DISTINCT ${impressionsEvents.id})`,
          clicks: sql<number>`COUNT(DISTINCT ${clicksEvents.id})`
        })
        .from(impressionsEvents)
        .leftJoin(clicksEvents, and(
          eq(impressionsEvents.adId, clicksEvents.adId),
          sql`DATE(${impressionsEvents.createdAt}) = DATE(${clicksEvents.createdAt})`
        ))
        .where(
          and(
            inArray(impressionsEvents.adId, adIds),
            gte(impressionsEvents.createdAt, startDate)
          )
        )
        .groupBy(sql`DATE(${impressionsEvents.createdAt})`)
        .orderBy(asc(sql`DATE(${impressionsEvents.createdAt})`));

      return dailyData.map(row => ({
        date: row.date,
        clicks: Number(row.clicks || 0),
        impressions: Number(row.impressions || 0)
      }));
    } catch (error) {
      throw ErrorBuilder.build(
        ErrorCode.DATABASE_ERROR,
        "Failed to fetch chart data",
        error instanceof Error ? error.message : error
      );
    }
  }

  async getTopPerformingAds(userId: string, limit: number = 5): Promise<TopPerformingAd[]> {
    try {
      // Get user's ads with performance metrics
      const adsWithPerformance = await db
        .select({
          id: ads.id,
          titleEn: ads.titleEn,
          titleAr: ads.titleAr,
          imageUrl: ads.imageUrl,
          impressions: sql<number>`COUNT(DISTINCT ${impressionsEvents.id})`,
          clicks: sql<number>`COUNT(DISTINCT ${clicksEvents.id})`
        })
        .from(ads)
        .leftJoin(impressionsEvents, eq(ads.id, impressionsEvents.adId))
        .leftJoin(clicksEvents, eq(ads.id, clicksEvents.adId))
        .where(eq(ads.userId, userId))
        .groupBy(ads.id, ads.titleEn, ads.titleAr, ads.imageUrl)
        .orderBy(desc(sql<number>`COUNT(DISTINCT ${impressionsEvents.id})`))
        .limit(limit);

      return adsWithPerformance.map(ad => ({
        id: ad.id,
        titleEn: ad.titleEn || '',
        titleAr: ad.titleAr || '',
        imageUrl: ad.imageUrl,
        impressions: Number(ad.impressions || 0),
        clicks: Number(ad.clicks || 0),
        ctr: Number(ad.impressions || 0) > 0
          ? (Number(ad.clicks || 0) / Number(ad.impressions || 0)) * 100
          : 0
      }));
    } catch (error) {
      throw ErrorBuilder.build(
        ErrorCode.DATABASE_ERROR,
        "Failed to fetch top performing ads",
        error instanceof Error ? error.message : error
      );
    }
  }

  async getRecentActivity(userId: string, limit: number = 10): Promise<RecentActivity[]> {
    try {
      // Get recent activity for the user
      // This is a simplified implementation - you might want to create a dedicated activity log table
      const recentAds = await db
        .select({
          id: ads.id,
          type: sql<string>`'ad_created'`,
          description: sql<string>`CONCAT('Created ad: ', ${ads.titleEn})`,
          createdAt: ads.createdAt,
          userId: ads.userId
        })
        .from(ads)
        .where(eq(ads.userId, userId))
        .orderBy(desc(ads.createdAt))
        .limit(limit);

      return recentAds.map(activity => ({
        id: activity.id,
        type: activity.type as any,
        description: activity.description,
        userId: activity.userId,
        createdAt: activity.createdAt
      }));
    } catch (error) {
      throw ErrorBuilder.build(
        ErrorCode.DATABASE_ERROR,
        "Failed to fetch recent activity",
        error instanceof Error ? error.message : error
      );
    }
  }

  async getAdminDashboardStats(days: number = 7): Promise<AdminDashboardStats> {
    try {
      const currentPeriodStart = new Date();
      currentPeriodStart.setDate(currentPeriodStart.getDate() - days);

      const previousPeriodStart = new Date();
      previousPeriodStart.setDate(previousPeriodStart.getDate() - (days * 2));

      const previousPeriodEnd = new Date(currentPeriodStart);

      // Get user stats
      const [currentUsers] = await db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(gte(users.createdAt, currentPeriodStart));

      const [previousUsers] = await db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(
          and(
            gte(users.createdAt, previousPeriodStart),
            lte(users.createdAt, previousPeriodEnd)
          )
        );

      const [totalUsers] = await db
        .select({ count: sql<number>`count(*)` })
        .from(users);

      // Get revenue stats (simplified - you might have a payments table)
      const totalRevenue = 0; // Placeholder
      const revenueGrowth = 0; // Placeholder

      // Get ads stats
      const [currentAds] = await db
        .select({ count: sql<number>`count(*)` })
        .from(ads)
        .where(gte(ads.createdAt, currentPeriodStart));

      const [previousAds] = await db
        .select({ count: sql<number>`count(*)` })
        .from(ads)
        .where(
          and(
            gte(ads.createdAt, previousPeriodStart),
            lte(ads.createdAt, previousPeriodEnd)
          )
        );

      const [totalAds] = await db
        .select({ count: sql<number>`count(*)` })
        .from(ads);

      // Get impression stats
      const [currentImpressions] = await db
        .select({ count: sql<number>`count(*)` })
        .from(impressionsEvents)
        .where(gte(impressionsEvents.createdAt, currentPeriodStart));

      const [previousImpressions] = await db
        .select({ count: sql<number>`count(*)` })
        .from(impressionsEvents)
        .where(
          and(
            gte(impressionsEvents.createdAt, previousPeriodStart),
            lte(impressionsEvents.createdAt, previousPeriodEnd)
          )
        );

      const userGrowth = Number(previousUsers?.count || 0) > 0
        ? ((Number(currentUsers?.count || 0) - Number(previousUsers?.count || 0)) / Number(previousUsers?.count || 0)) * 100
        : 0;

      const adsGrowth = Number(previousAds?.count || 0) > 0
        ? ((Number(currentAds?.count || 0) - Number(previousAds?.count || 0)) / Number(previousAds?.count || 0)) * 100
        : 0;

      const impressionGrowth = Number(previousImpressions?.count || 0) > 0
        ? ((Number(currentImpressions?.count || 0) - Number(previousImpressions?.count || 0)) / Number(previousImpressions?.count || 0)) * 100
        : 0;

      return {
        totalUsers: Number(totalUsers?.count || 0),
        userGrowth: Math.round(userGrowth * 10) / 10,
        totalRevenue,
        revenueGrowth: Math.round(revenueGrowth * 10) / 10,
        activeAds: Number(totalAds?.count || 0),
        adsGrowth: Math.round(adsGrowth * 10) / 10,
        totalImpressions: Number(currentImpressions?.count || 0),
        impressionGrowth: Math.round(impressionGrowth * 10) / 10
      };
    } catch (error) {
      throw ErrorBuilder.build(
        ErrorCode.DATABASE_ERROR,
        "Failed to fetch admin dashboard stats",
        error instanceof Error ? error.message : error
      );
    }
  }

  async getAdminChartData(days: number = 7): Promise<AdminChartData[]> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get daily impressions and clicks for admin view
      const dailyData = await db
        .select({
          date: sql<string>`DATE(${impressionsEvents.createdAt})`,
          impressions: sql<number>`COUNT(DISTINCT ${impressionsEvents.id})`,
          clicks: sql<number>`COUNT(DISTINCT ${clicksEvents.id})`
        })
        .from(impressionsEvents)
        .leftJoin(clicksEvents, and(
          eq(impressionsEvents.adId, clicksEvents.adId),
          sql`DATE(${impressionsEvents.createdAt}) = DATE(${clicksEvents.createdAt})`
        ))
        .where(gte(impressionsEvents.createdAt, startDate))
        .groupBy(sql`DATE(${impressionsEvents.createdAt})`)
        .orderBy(asc(sql`DATE(${impressionsEvents.createdAt})`));

      return dailyData.map(row => ({
        date: row.date,
        clicks: Number(row.clicks || 0),
        impressions: Number(row.impressions || 0)
      }));
    } catch (error) {
      throw ErrorBuilder.build(
        ErrorCode.DATABASE_ERROR,
        "Failed to fetch admin chart data",
        error instanceof Error ? error.message : error
      );
    }
  }

  async getAdminRecentActivity(limit: number = 10): Promise<RecentActivity[]> {
    try {
      // Get recent system activity for admin
      const recentAds = await db
        .select({
          id: ads.id,
          type: sql<string>`'ad_created'`,
          description: sql<string>`CONCAT('New ad created: ', ${ads.titleEn})`,
          createdAt: ads.createdAt,
          userId: ads.userId,
          username: users.username
        })
        .from(ads)
        .leftJoin(users, eq(ads.userId, users.id))
        .orderBy(desc(ads.createdAt))
        .limit(limit);

      const recentUsers = await db
        .select({
          id: users.id,
          type: sql<string>`'user_signup'`,
          description: sql<string>`CONCAT('New user registered: ', ${users.username})`,
          createdAt: users.createdAt,
          userId: users.id,
          username: users.username
        })
        .from(users)
        .orderBy(desc(users.createdAt))
        .limit(limit);

      // Combine and sort activities
      const allActivities = [...recentAds, ...recentUsers]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit);

      return allActivities.map(activity => ({
        id: activity.id,
        type: activity.type as any,
        description: activity.description,
        userId: activity.userId,
        username: activity.username,
        createdAt: activity.createdAt
      }));
    } catch (error) {
      throw ErrorBuilder.build(
        ErrorCode.DATABASE_ERROR,
        "Failed to fetch admin recent activity",
        error instanceof Error ? error.message : error
      );
    }
  }

  async getSystemOverview(): Promise<any> {
    try {
      // Get basic system overview stats
      const [totalUsers] = await db
        .select({ count: sql<number>`count(*)` })
        .from(users);

      const [totalAds] = await db
        .select({ count: sql<number>`count(*)` })
        .from(ads);

      const [totalImpressions] = await db
        .select({ count: sql<number>`count(*)` })
        .from(impressionsEvents);

      const [totalClicks] = await db
        .select({ count: sql<number>`count(*)` })
        .from(clicksEvents);

      return {
        totalUsers: Number(totalUsers?.count || 0),
        totalAds: Number(totalAds?.count || 0),
        totalImpressions: Number(totalImpressions?.count || 0),
        totalClicks: Number(totalClicks?.count || 0)
      };
    } catch (error) {
      throw ErrorBuilder.build(
        ErrorCode.DATABASE_ERROR,
        "Failed to fetch system overview",
        error instanceof Error ? error.message : error
      );
    }
  }
}
