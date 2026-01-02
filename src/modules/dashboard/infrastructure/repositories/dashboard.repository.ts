import { and, eq, gte, lte, inArray, sql, desc, asc } from "drizzle-orm";
import { db } from "../../../../infrastructure/db/connection";
import { ads, users, impressionsEvents, clicksEvents, purchases } from "../../../../infrastructure/shared/schema/schema";
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
  
  /**
   * Get chart data for impressions and clicks over time
   */
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
  
      // Get daily impressions - FIXED: Use inArray instead of ANY
      const dailyImpressions = await db
        .select({
          date: sql<string>`DATE(${impressionsEvents.createdAt})`,
          count: sql<number>`count(*)`,
        })
        .from(impressionsEvents)
        .where(
          and(
            inArray(impressionsEvents.adId, adIds),
            gte(impressionsEvents.createdAt, startDate)
          )
        )
        .groupBy(sql`DATE(${impressionsEvents.createdAt})`)
        .orderBy(sql`DATE(${impressionsEvents.createdAt})`);
  
      // Get daily clicks - FIXED: Use inArray instead of ANY
      const dailyClicks = await db
        .select({
          date: sql<string>`DATE(${clicksEvents.createdAt})`,
          count: sql<number>`count(*)`,
        })
        .from(clicksEvents)
        .where(
          and(
            inArray(clicksEvents.adId, adIds),
            gte(clicksEvents.createdAt, startDate)
          )
        )
        .groupBy(sql`DATE(${clicksEvents.createdAt})`)
        .orderBy(sql`DATE(${clicksEvents.createdAt})`);
  
      // Merge impressions and clicks data
      const impressionMap = new Map(
        dailyImpressions.map(d => [d.date, Number(d.count)])
      );
      const clickMap = new Map(
        dailyClicks.map(d => [d.date, Number(d.count)])
      );
  
      // Create array of all dates in range
      const chartData: ChartData[] = [];
      for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (days - 1 - i));
        const dateStr = date.toISOString().split('T')[0];
  
        chartData.push({
          date: dateStr,
          impressions: impressionMap.get(dateStr) || 0,
          clicks: clickMap.get(dateStr) || 0,
        });
      }
  
      return chartData;
    } catch (error) {
      throw ErrorBuilder.build(
        ErrorCode.DATABASE_ERROR,
        "Failed to fetch chart data",
        error instanceof Error ? error.message : error
      );
    }
  }
  
  /**
   * Get top performing ads for the user
   */async getTopPerformingAds(userId: string, limit: number = 5): Promise<TopPerformingAd[]> {
    try {
      // Subquery for impressions count per ad
      const impressionsSub = db
        .select({
          adId: impressionsEvents.adId,
          impressions: sql<number>`COUNT(*)`.as('impressions'),
        })
        .from(impressionsEvents)
        .groupBy(impressionsEvents.adId)
        .as('impr_sub');
  
      // Subquery for clicks count per ad
      const clicksSub = db
        .select({
          adId: clicksEvents.adId,
          clicks: sql<number>`COUNT(*)`.as('clicks'),
        })
        .from(clicksEvents)
        .groupBy(clicksEvents.adId)
        .as('click_sub');
  
      // Join ads with aggregated subqueries
      const topAds = await db
        .select({
          id: ads.id,
          titleEn: ads.titleEn,
          titleAr: ads.titleAr,
          imageUrl: ads.imageUrl,
          impressions: sql<number>`COALESCE("impr_sub"."impressions", 0)`.as('impressions'),
          clicks: sql<number>`COALESCE("click_sub"."clicks", 0)`.as('clicks'),
        })
        .from(ads)
        .leftJoin(impressionsSub, eq(impressionsSub.adId, ads.id))
        .leftJoin(clicksSub, eq(clicksSub.adId, ads.id))
        .where(eq(ads.userId, userId))
        // ✅ order by clicks DESC (replace with impressions or CTR if desired)
        .orderBy(desc(sql`COALESCE("click_sub"."clicks", 0)`))
        .limit(limit);
  
      // Compute CTR
      return topAds.map(ad => {
        const impressions = Number(ad.impressions) || 0;
        const clicks = Number(ad.clicks) || 0;
        const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
  
        return {
          id: ad.id,
          titleEn: ad.titleEn,
          titleAr: ad.titleAr,
          imageUrl: ad.imageUrl[0],
          impressions,
          clicks,
          ctr: Math.round(ctr * 100) / 100,
        };
      });
    } catch (error) {
      throw ErrorBuilder.build(
        ErrorCode.DATABASE_ERROR,
        'Failed to fetch top performing ads',
        error instanceof Error ? error.message : error
      );
    }
  }
  
  
  
  /**
   * Get recent activity for the user
   */
  async getRecentActivity(userId: string, limit: number = 10): Promise<RecentActivity[]> {
    try {
      // Get user's ads
      const userAds = await db
        .select({ id: ads.id, titleEn: ads.titleEn, titleAr: ads.titleAr })
        .from(ads)
        .where(eq(ads.userId, userId));
  
      const adIds = userAds.map(ad => ad.id);
      const adMap = new Map(userAds.map(ad => [ad.id, ad]));
  
      if (adIds.length === 0) {
        console.log('Dashboard: No ads found for user', { userId });
        return [];
      }
  
      // Get recent impressions
      const recentImpressions = await db
        .select({
          id: impressionsEvents.id,
          adId: impressionsEvents.adId,
          type: sql<string>`'impression'`,
          source: impressionsEvents.source,
          createdAt: impressionsEvents.createdAt,
        })
        .from(impressionsEvents)
        .where(inArray(impressionsEvents.adId, adIds))
        .orderBy(desc(impressionsEvents.createdAt))
        .limit(limit);
  
      // Get recent clicks - clicksEvents has source field
      const recentClicks = await db
        .select({
          id: clicksEvents.id,
          adId: clicksEvents.adId,
          type: sql<string>`'click'`,
          source: clicksEvents.source,
          createdAt: clicksEvents.createdAt,
        })
        .from(clicksEvents)
        .where(inArray(clicksEvents.adId, adIds))
        .orderBy(desc(clicksEvents.createdAt))
        .limit(limit);
  
      console.log('Dashboard: Recent activity results', {
        userId,
        impressionsCount: recentImpressions.length,
        clicksCount: recentClicks.length
      });
  
      // Combine and sort by date
      const activities: RecentActivity[] = [...recentImpressions, ...recentClicks]
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, limit)
        .map(activity => {
          const ad = adMap.get(activity.adId);
          const adTitle = ad?.titleEn || ad?.titleAr || 'Unknown Ad';
          const activityType = activity.type === 'impression' ? 'impression' : 'click';
          const source = activity.source || 'web';

          return {
            id: activity.id,
            title: adTitle,
            type: activityType === 'impression' ? 'impression' as const : 'click' as const,
            description: `${activityType === 'impression' ? 'Impression' : 'Click'} on "${adTitle}" from ${source}`,
            userId: userId,
            createdAt: activity.createdAt
          };
        });
  
      return activities;
    } catch (error) {
      console.error('Dashboard: Recent activity error', {
        userId,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined
      });
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
  
      // ===== TOTAL USERS =====
      const [totalUsersResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(users);
  
      const [currentPeriodUsers] = await db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(gte(users.createdAt, currentPeriodStart));
  
      const [previousPeriodUsers] = await db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(
          and(
            gte(users.createdAt, previousPeriodStart),
            lte(users.createdAt, previousPeriodEnd)
          )
        );
  
      // ===== TOTAL REVENUE =====
      const [totalRevenueResult] = await db
        .select({ 
          total: sql<number>`COALESCE(SUM(CAST(${purchases.amount} AS DECIMAL)), 0)` 
        })
        .from(purchases)
        .where(eq(purchases.status, "completed"));
  
      const [currentPeriodRevenue] = await db
        .select({ 
          total: sql<number>`COALESCE(SUM(CAST(${purchases.amount} AS DECIMAL)), 0)` 
        })
        .from(purchases)
        .where(
          and(
            eq(purchases.status, "completed"),
            gte(purchases.createdAt, currentPeriodStart)
          )
        );
  
      const [previousPeriodRevenue] = await db
        .select({ 
          total: sql<number>`COALESCE(SUM(CAST(${purchases.amount} AS DECIMAL)), 0)` 
        })
        .from(purchases)
        .where(
          and(
            eq(purchases.status, "completed"),
            gte(purchases.createdAt, previousPeriodStart),
            lte(purchases.createdAt, previousPeriodEnd)
          )
        );
  
      // ===== ACTIVE ADS =====
      const [activeAdsResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(ads)
        .where(eq(ads.active, true));
  
      const [currentPeriodAds] = await db
        .select({ count: sql<number>`count(*)` })
        .from(ads)
        .where(
          and(
            eq(ads.active, true),
            gte(ads.createdAt, currentPeriodStart)
          )
        );
  
      const [previousPeriodAds] = await db
        .select({ count: sql<number>`count(*)` })
        .from(ads)
        .where(
          and(
            eq(ads.active, true),
            gte(ads.createdAt, previousPeriodStart),
            lte(ads.createdAt, previousPeriodEnd)
          )
        );
  
      // ===== TOTAL IMPRESSIONS =====
      const [totalImpressionsResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(impressionsEvents);
  
      const [currentPeriodImpressions] = await db
        .select({ count: sql<number>`count(*)` })
        .from(impressionsEvents)
        .where(gte(impressionsEvents.createdAt, currentPeriodStart));
  
      const [previousPeriodImpressions] = await db
        .select({ count: sql<number>`count(*)` })
        .from(impressionsEvents)
        .where(
          and(
            gte(impressionsEvents.createdAt, previousPeriodStart),
            lte(impressionsEvents.createdAt, previousPeriodEnd)
          )
        );
  
      // Calculate totals and growth
      const totalUsers = Number(totalUsersResult.count || 0);
      const currentUsers = Number(currentPeriodUsers.count || 0);
      const prevUsers = Number(previousPeriodUsers.count || 0);
      const userGrowth = prevUsers > 0 ? ((currentUsers - prevUsers) / prevUsers) * 100 : 0;
  
      const totalRevenue = Number(totalRevenueResult.total || 0);
      const currentRevenue = Number(currentPeriodRevenue.total || 0);
      const prevRevenue = Number(previousPeriodRevenue.total || 0);
      const revenueGrowth = prevRevenue > 0 ? ((currentRevenue - prevRevenue) / prevRevenue) * 100 : 0;
  
      const activeAds = Number(activeAdsResult.count || 0);
      const currentAds = Number(currentPeriodAds.count || 0);
      const prevAds = Number(previousPeriodAds.count || 0);
      const adsGrowth = prevAds > 0 ? ((currentAds - prevAds) / prevAds) * 100 : 0;
  
      const totalImpressions = Number(totalImpressionsResult.count || 0);
      const currentImpressions = Number(currentPeriodImpressions.count || 0);
      const prevImpressions = Number(previousPeriodImpressions.count || 0);
      const impressionGrowth = prevImpressions > 0 
        ? ((currentImpressions - prevImpressions) / prevImpressions) * 100 
        : 0;
  
      return {
        totalUsers,
        userGrowth: Math.round(userGrowth * 10) / 10,
        totalRevenue,
        revenueGrowth: Math.round(revenueGrowth * 10) / 10,
        activeAds,
        adsGrowth: Math.round(adsGrowth * 10) / 10,
        totalImpressions,
        impressionGrowth: Math.round(impressionGrowth * 10) / 10,
      };
    } catch (error) {
      throw ErrorBuilder.build(
        ErrorCode.DATABASE_ERROR,
        "Failed to fetch admin dashboard stats",
        error instanceof Error ? error.message : error
      );
    }
  }
  
  /**
   * Get system-wide chart data for impressions and clicks
   */
  async getAdminChartData(months: number = 6): Promise<AdminChartData[]> {
    try {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);
  
      // Get monthly impressions for all ads
      const monthlyImpressions = await db
        .select({
          month: sql<string>`TO_CHAR(${impressionsEvents.createdAt}, 'YYYY-MM')`,
          count: sql<number>`COUNT(*)`,
        })
        .from(impressionsEvents)
        .where(gte(impressionsEvents.createdAt, startDate))
        .groupBy(sql`TO_CHAR(${impressionsEvents.createdAt}, 'YYYY-MM')`)
        .orderBy(sql`TO_CHAR(${impressionsEvents.createdAt}, 'YYYY-MM')`);
  
      // Get monthly clicks for all ads
      const monthlyClicks = await db
        .select({
          month: sql<string>`TO_CHAR(${clicksEvents.createdAt}, 'YYYY-MM')`,
          count: sql<number>`COUNT(*)`,
        })
        .from(clicksEvents)
        .where(gte(clicksEvents.createdAt, startDate))
        .groupBy(sql`TO_CHAR(${clicksEvents.createdAt}, 'YYYY-MM')`)
        .orderBy(sql`TO_CHAR(${clicksEvents.createdAt}, 'YYYY-MM')`);
  
      // Merge data
      const impressionMap = new Map(
        monthlyImpressions.map(d => [d.month, Number(d.count)])
      );
      const clickMap = new Map(
        monthlyClicks.map(d => [d.month, Number(d.count)])
      );
  
      // Create array for all months in range
      const chartData: AdminChartData[] = [];
      const now = new Date();
      for (let i = months - 1; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStr = date.toISOString().slice(0, 7); // YYYY-MM
  
        chartData.push({
          date: monthStr,
          impressions: impressionMap.get(monthStr) || 0,
          clicks: clickMap.get(monthStr) || 0,
        });
      }
  
      return chartData;
    } catch (error) {
      throw ErrorBuilder.build(
        ErrorCode.DATABASE_ERROR,
        "Failed to fetch admin chart data",
        error instanceof Error ? error.message : error
      );
    }
  }
  
  
  /**
   * Get recent system activity for admin
   */
  async getAdminRecentActivity(limit: number = 10): Promise<RecentActivity[]> {
    try {
      const activities: RecentActivity[] = [];
  
      // Get recent user signups
      const recentUsers = await db
        .select({
          id: users.id,
          username: users.username,
          createdAt: users.createdAt,
        })
        .from(users)
        .orderBy(desc(users.createdAt))
        .limit(limit);
  
      recentUsers.forEach(user => {
        activities.push({
          id: user.id,
          type: 'user_signup',
          description: `New user registered: ${user.username}`,
          userId: user.id,
          username: user.username,
          createdAt: user.createdAt,
        });
      });
  
      // Get recent ads
      const recentAds = await db
        .select({
          id: ads.id,
          titleEn: ads.titleEn,
          status: ads.status,
          userId: ads.userId,
          createdAt: ads.createdAt,
        })
        .from(ads)
        .leftJoin(users, eq(ads.userId, users.id))
        .orderBy(desc(ads.createdAt))
        .limit(limit);
  
      recentAds.forEach(ad => {
        const typeMap = {
          'approved': 'ad_approved' as const,
          'rejected': 'ad_rejected' as const,
          'pending': 'ad_created' as const,
        };
  
        activities.push({
          id: ad.id,
          type: typeMap[ad.status] || 'ad_created',
          description: `Ad "${ad.titleEn}" ${ad.status}`,
          userId: ad.userId,
          createdAt: ad.createdAt,
        });
      });
  
      // Get recent purchases
      const recentPurchases = await db
        .select({
          id: purchases.id,
          amount: purchases.amount,
          userId: purchases.userId,
          createdAt: purchases.createdAt,
        })
        .from(purchases)
        .leftJoin(users, eq(purchases.userId, users.id))
        .where(eq(purchases.status, "completed"))
        .orderBy(desc(purchases.createdAt))
        .limit(limit);
  
      recentPurchases.forEach(purchase => {
        activities.push({
          id: purchase.id,
          type: 'purchase',
          description: `Purchase completed: $${purchase.amount}`,
          userId: purchase.userId,
          createdAt: purchase.createdAt,
        });
      });
  
      // Sort all activities by date and limit
      return activities
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, limit);
    } catch (error) {
      throw ErrorBuilder.build(
        ErrorCode.DATABASE_ERROR,
        "Failed to fetch admin recent activity",
        error instanceof Error ? error.message : error
      );
    }
  }
  
  /**
   * Get system statistics overview
   */
  async getSystemOverview() {
    try {
      // Total users count
      const [totalUsers] = await db
        .select({ count: sql<number>`count(*)` })
        .from(users);
  
      // Total ads count
      const [totalAds] = await db
        .select({ count: sql<number>`count(*)` })
        .from(ads);
  
      // Pending ads count
      const [pendingAds] = await db
        .select({ count: sql<number>`count(*)` })
        .from(ads)
        .where(eq(ads.status, "pending"));
  
      // Active ads count
      const [activeAds] = await db
        .select({ count: sql<number>`count(*)` })
        .from(ads)
        .where(eq(ads.active, true));
  
      // Total impressions
      const [totalImpressions] = await db
        .select({ count: sql<number>`count(*)` })
        .from(impressionsEvents);
  
      // Total clicks
      const [totalClicks] = await db
        .select({ count: sql<number>`count(*)` })
        .from(clicksEvents);
  
      // Total revenue
      const [totalRevenue] = await db
        .select({ 
          total: sql<number>`COALESCE(SUM(CAST(${purchases.amount} AS DECIMAL)), 0)` 
        })
        .from(purchases)
        .where(eq(purchases.status, "completed"));
  
      return {
        totalUsers: Number(totalUsers.count || 0),
        totalAds: Number(totalAds.count || 0),
        pendingAds: Number(pendingAds.count || 0),
        activeAds: Number(activeAds.count || 0),
        totalImpressions: Number(totalImpressions.count || 0),
        totalClicks: Number(totalClicks.count || 0),
        totalRevenue: Number(totalRevenue.total || 0),
        ctr: Number(totalImpressions.count) > 0 
          ? (Number(totalClicks.count) / Number(totalImpressions.count)) * 100 
          : 0,
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
