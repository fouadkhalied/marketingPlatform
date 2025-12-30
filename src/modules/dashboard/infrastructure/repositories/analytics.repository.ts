import { and, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "../../../../infrastructure/db/connection";
import { ads, impressionsEvents, clicksEvents, adminImpressionRatio } from "../../../../infrastructure/shared/schema/schema";
import { ErrorBuilder } from "../../../../infrastructure/shared/common/errors/errorBuilder";
import { ErrorCode } from "../../../../infrastructure/shared/common/errors/enums/basic.error.enum";
import { AdAnalyticsFullDetails, ChartData } from "../../../advertising/application/dtos/analytics.dto";
import { IAnalyticsRepository } from "../../../advertising/domain/repositories/analytics.repository.interface";

export class AnalyticsRepository implements IAnalyticsRepository {

  async checkAdOwnership(adId: string, userId: string): Promise<boolean> {
    try {
      const [ad] = await db
        .select()
        .from(ads)
        .where(and(eq(ads.id, adId), eq(ads.userId, userId)));

      return !!ad;
    } catch (error) {
      console.error('Analytics repository: Error checking ad ownership', {
        adId,
        userId,
        error: error instanceof Error ? error.message : error
      });
      throw ErrorBuilder.build(
        ErrorCode.DATABASE_ERROR,
        "Failed to verify ad ownership",
        error instanceof Error ? error.message : error
      );
    }
  }

  async getAdAnalyticsFullDetails(adId: string): Promise<AdAnalyticsFullDetails | undefined> {
    try {
      // Get basic ad details
      const [ad] = await db
        .select()
        .from(ads)
        .where(eq(ads.id, adId));

      if (!ad) {
        console.log('Analytics repository: Ad not found', { adId });
        return undefined;
      }

      // Get analytics data for the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Get total impressions for this ad
      const [impressionsResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(impressionsEvents)
        .where(
          and(
            eq(impressionsEvents.adId, adId),
            gte(impressionsEvents.createdAt, thirtyDaysAgo)
          )
        );

      // Get total clicks for this ad
      const [clicksResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(clicksEvents)
        .where(
          and(
            eq(clicksEvents.adId, adId),
            gte(clicksEvents.createdAt, thirtyDaysAgo)
          )
        );

      // Get daily breakdown for chart data
      const dailyImpressions = await db
        .select({
          date: sql<string>`DATE(${impressionsEvents.createdAt})`,
          count: sql<number>`count(*)`,
        })
        .from(impressionsEvents)
        .where(
          and(
            eq(impressionsEvents.adId, adId),
            gte(impressionsEvents.createdAt, thirtyDaysAgo)
          )
        )
        .groupBy(sql`DATE(${impressionsEvents.createdAt})`)
        .orderBy(sql`DATE(${impressionsEvents.createdAt})`);

      const dailyClicks = await db
        .select({
          date: sql<string>`DATE(${clicksEvents.createdAt})`,
          count: sql<number>`count(*)`,
        })
        .from(clicksEvents)
        .where(
          and(
            eq(clicksEvents.adId, adId),
            gte(clicksEvents.createdAt, thirtyDaysAgo)
          )
        )
        .groupBy(sql`DATE(${clicksEvents.createdAt})`)
        .orderBy(sql`DATE(${clicksEvents.createdAt})`);

      // Define all possible platforms
      const allPlatforms = ['web', 'facebook', 'instagram', 'tiktok', 'snapchat', 'youtube', 'google_ads', 'twitter'];

      // Get source analytics from impressions
      const sourceAnalyticsQuery = await db
        .select({
          source: impressionsEvents.source,
          views: sql<number>`count(*)`,
        })
        .from(impressionsEvents)
        .where(
          and(
            eq(impressionsEvents.adId, adId),
            gte(impressionsEvents.createdAt, thirtyDaysAgo)
          )
        )
        .groupBy(impressionsEvents.source);

      // Create a map of existing analytics
      const sourceMap = new Map(sourceAnalyticsQuery.map(item => [item.source, Number(item.views)]));

      // Ensure all platforms are included with their counts (0 if no impressions)
      const sourceAnalytics = allPlatforms.map(platform => ({
        source: platform,
        views: sourceMap.get(platform) || 0,
      }));

      // Get current impression pricing ratio
      const [currentRatio] = await db
        .select({
          impressionsPerUnit: adminImpressionRatio.impressionsPerUnit,
          currency: adminImpressionRatio.currency,
        })
        .from(adminImpressionRatio)
        .where(eq(adminImpressionRatio.promoted, ad.hasPromoted))
        .orderBy(sql`desc(${adminImpressionRatio.createdAt})`)
        .limit(1);

      // Calculate growth metrics (compare last 15 days vs previous 15 days)
      const fifteenDaysAgo = new Date();
      fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

      const thirtyDaysAgoFromFifteen = new Date(fifteenDaysAgo);
      thirtyDaysAgoFromFifteen.setDate(thirtyDaysAgoFromFifteen.getDate() - 15);

      const [currentImpressions] = await db
        .select({ count: sql<number>`count(*)` })
        .from(impressionsEvents)
        .where(
          and(
            eq(impressionsEvents.adId, adId),
            gte(impressionsEvents.createdAt, fifteenDaysAgo)
          )
        );

      const [previousImpressions] = await db
        .select({ count: sql<number>`count(*)` })
        .from(impressionsEvents)
        .where(
          and(
            eq(impressionsEvents.adId, adId),
            gte(impressionsEvents.createdAt, thirtyDaysAgoFromFifteen),
            lte(impressionsEvents.createdAt, fifteenDaysAgo)
          )
        );

      const [currentClicks] = await db
        .select({ count: sql<number>`count(*)` })
        .from(clicksEvents)
        .where(
          and(
            eq(clicksEvents.adId, adId),
            gte(clicksEvents.createdAt, fifteenDaysAgo)
          )
        );

      const [previousClicks] = await db
        .select({ count: sql<number>`count(*)` })
        .from(clicksEvents)
        .where(
          and(
            eq(clicksEvents.adId, adId),
            gte(clicksEvents.createdAt, thirtyDaysAgoFromFifteen),
            lte(clicksEvents.createdAt, fifteenDaysAgo)
          )
        );

      // Merge daily impressions and clicks data
      const impressionMap = new Map(
        dailyImpressions.map(d => [d.date, Number(d.count)])
      );
      const clickMap = new Map(
        dailyClicks.map(d => [d.date, Number(d.count)])
      );

      // Create chart data for last 30 days
      const chartData: ChartData[] = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        chartData.push({
          date: dateStr,
          impressions: impressionMap.get(dateStr) || 0,
          clicks: clickMap.get(dateStr) || 0,
        });
      }

      // Calculate metrics
      const totalImpressions = Number(impressionsResult?.count || 0);
      const totalClicks = Number(clicksResult?.count || 0);
      const currentImpressionsCount = Number(currentImpressions?.count || 0);
      const previousImpressionsCount = Number(previousImpressions?.count || 0);
      const currentClicksCount = Number(currentClicks?.count || 0);
      const previousClicksCount = Number(previousClicks?.count || 0);

      const clickThroughRate = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

      const impressionGrowth = previousImpressionsCount > 0
        ? ((currentImpressionsCount - previousImpressionsCount) / previousImpressionsCount) * 100
        : 0;

      const clickGrowth = previousClicksCount > 0
        ? ((currentClicksCount - previousClicksCount) / previousClicksCount) * 100
        : 0;

      const previousCTR = previousImpressionsCount > 0
        ? (previousClicksCount / previousImpressionsCount) * 100
        : 0;
      const currentCTR = currentImpressionsCount > 0
        ? (currentClicksCount / currentImpressionsCount) * 100
        : 0;

      const ctrGrowth = previousCTR > 0
        ? ((currentCTR - previousCTR) / previousCTR) * 100
        : 0;

      // Calculate financial metrics
      const impressionsPerUnit = currentRatio?.impressionsPerUnit || 1000; // Default fallback
      const currency = currentRatio?.currency || 'sar';
      const costPerImpression = 1 / impressionsPerUnit; // Cost per impression
      const spentAmount = totalImpressions * costPerImpression;
      const remainingCredits = Math.max(0, ad.impressionsCredit - spentAmount);

      return {
        // Analytics data
        analytics: {
          freeViews: ad.freeViews,
          totalImpressions,
          totalClicks,
          clickThroughRate: Math.round(clickThroughRate * 100) / 100,
          websiteClicks: ad.websiteClicks,
          likesCount: ad.likesCount,
          performance: {
            dailyBreakdown: chartData,
            growthMetrics: {
              impressionGrowth: Math.round(impressionGrowth * 100) / 100,
              clickGrowth: Math.round(clickGrowth * 100) / 100,
              ctrGrowth: Math.round(ctrGrowth * 100) / 100,
            },
          },
          source: sourceAnalytics.map(item => ({
            type: item.source,
            views: item.views,
          })),
          financials: {
            totalBudgetImpressions: ad.impressionsCredit, // Total impressions allocated
            usedImpressions: totalImpressions, // Impressions used so far
            remainingImpressions: Math.max(0, ad.impressionsCredit - totalImpressions), // Impressions left

            // Optional: Show monetary value
            costPerImpression: Math.round(costPerImpression * 10000) / 10000,
            totalCostSpent: Math.round((totalImpressions * costPerImpression) * 100) / 100,
            totalBudgetCost: Math.round((ad.impressionsCredit * costPerImpression) * 100) / 100,
            currency: currency,
          }
        },
      };
    } catch (error) {
      throw ErrorBuilder.build(
        ErrorCode.DATABASE_ERROR,
        "Failed to fetch ad analytics details",
        error instanceof Error ? error.message : error
      );
    }
  }
}
