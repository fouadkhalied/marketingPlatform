import { db } from "../../../../infrastructure/db/connection";
import { userInterface } from "../../domain/repositories/user.repository";

import { eq, desc, sql, and, gte, lte, inArray } from "drizzle-orm";
import bcrypt from "bcrypt";
import { adminImpressionRatio, AdminImpressionRatio, ads, clicksEvents, CreateUser, impressionsEvents, middleEastCountries, socialMediaPages, User, users } from "../../../../infrastructure/shared/schema/schema";
import { PaginatedResponse, PaginationParams } from "../../../../infrastructure/shared/common/pagination.vo";
import { ErrorBuilder } from "../../../../infrastructure/shared/common/errors/errorBuilder";
import { ErrorCode } from "../../../../infrastructure/shared/common/errors/enums/basic.error.enum";
import { ChartData, DashboardStats, TopPerformingAd } from "../../application/dtos/dashboard/dashboard.interfaces";

export class UserRepositoryImpl implements userInterface {
    async hashPassword(password: string): Promise<string> {
        return bcrypt.hash(password, 12);
      }
    
      async validateUser(email: string, password: string): Promise<User | null> {
        const user = await this.getUserByEmail(email);
        if (!user) return null;

        if (!user.password) {
          return null
        }
        
        const isValid = await bcrypt.compare(password, user.password);
        return isValid ? user : null;
      }
    
      async getUser(id: string): Promise<Partial<User & { socialMediaPages: Array<{ pageId: string; pageName: string; pageType: string; isActive: boolean }> }> | undefined> {
        const result = await db
          .select({
            id: users.id,
            username: users.username,
            email: users.email,
            role: users.role,
            verified: users.verified,
            freeViewsCredits: users.freeViewsCredits,
            createdAt: users.createdAt,
            adsCount: users.adsCount,
            totalSpend: users.totalSpend,
            balance:users.balance,
            oauth:users.oauth,
            // Social media page fields
            pageId: socialMediaPages.pageId,
            pageName: socialMediaPages.pageName,
            pageType: socialMediaPages.pageType,
            isActive: socialMediaPages.isActive,
          })
          .from(users)
          .leftJoin(socialMediaPages, eq(users.id, socialMediaPages.userId))
          .where(eq(users.id, id));
      
        if (result.length === 0) {
          return undefined;
        }
      
        // Group the results to handle multiple social media pages
        const user = {
          id: result[0].id,
          username: result[0].username,
          email: result[0].email,
          role: result[0].role,
          verified: result[0].verified,
          freeViewsCredits: result[0].freeViewsCredits,
          createdAt: result[0].createdAt,
          adsCount: result[0].adsCount,
          balance: result[0].balance,
          totalSpend: result[0].totalSpend,
          oauth: result[0].oauth,
          socialMediaPages: result
            .filter(row => row.pageId !== null) // Filter out null joins
            .map(row => ({
              pageId: row.pageId!,
              pageName: row.pageName!,
              pageType: row.pageType!,
              isActive: row.isActive!,
            }))
        };
      
        return user;
      }
    
      async getUserByEmail(email: string): Promise<User | undefined> {
        const [user] = await db.select().from(users).where(eq(users.email, email));
        return user;
      }
    
      async getUserByUsername(username: string): Promise<User | undefined> {
        const [user] = await db.select().from(users).where(eq(users.username, username));
        return user;
      }
      async createUser(insertUser: CreateUser): Promise<User> {
        if (!insertUser.password) {
          throw new Error("Password is required for normal users");
        }
      
        const hashedPassword = await this.hashPassword(insertUser.password);
      
        const [user] = await db
          .insert(users)
          .values({
            ...insertUser,
            password: hashedPassword,
          })
          .returning();
      
        return user;
      }
      

      async deleteUser(id: string): Promise<boolean> {
        const [deleted] = await db.delete(users).where(eq(users.id, id)).returning();
        return !!deleted;
      }

      async makeUserAdmin(id: string): Promise<User> {
        const [user] = await db
          .update(users)
          .set({
            role: 'admin',
            updatedAt: new Date(),
          })
          .where(eq(users.id, id))
          .returning();
      
        if (!user) {
          throw new Error("User not found");
        }
      
        return user;
      }
      
      async updateUser(id: string, updates: Partial<User>): Promise<User> {
        const [user] = await db
          .update(users)
          .set({ ...updates, updatedAt: new Date() })
          .where(eq(users.id, id))
          .returning();
        return user;
      }

      async verifyUser(id: string): Promise<User> {
        const [user] = await db
          .update(users)
          .set({
            verified: true,
            updatedAt: new Date(),
          })
          .where(eq(users.id, id))
          .returning();
      
        if (!user) {
          throw new Error("User not found");
        }
      
        return user;
      }

      async updatePassword(email: string, newPassword: string): Promise<boolean> {
            // Step 1: Hash the new password securely
            const hashedPassword = await this.hashPassword(newPassword);
        
            // Step 2: Update the user's password in the database
            const [updatedUser] = await db
                .update(users)
                .set({ password: hashedPassword, updatedAt: new Date() })
                .where(eq(users.email, email))
                .returning();

            // Step 3: Check if a user was actually updated and return a boolean
            return !!updatedUser;
        }


      
    async getUsers(pagination: PaginationParams): Promise<PaginatedResponse<Partial<User>>> {
      try {
          const { page, limit } = pagination;
          const offset = (page - 1) * limit;

          // Count total records
          const countQuery = db
              .select({ count: sql<number>`count(*)` })
              .from(users);

          const [{ count }] = await countQuery;

          // Fetch paginated results ordered by creation date (newest first)
          const results = await db
              .select({
                id: users.id,
                username: users.username,
                email: users.email,
                role: users.role,
                freeViewsCredits: users.freeViewsCredits,
                createdAt: users.createdAt,
                adsCount: users.adsCount,
                totalSpend: users.totalSpend
            })
              .from(users)
              .orderBy(desc(users.createdAt))
              .limit(limit)
              .offset(offset);

          const totalCount = Number(count);
          const totalPages = Math.ceil(totalCount / limit);

          return {
              data: results as Partial<User>[],
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
          throw new Error(
              `Failed to fetch users: ${error instanceof Error ? error.message : error}`
          );
      }
  }
    
      async updateUserStripeInfo(id: string, customerId: string, subscriptionId?: string): Promise<User> {
        const [user] = await db
          .update(users)
          .set({ 
            stripeCustomerId: customerId,
            updatedAt: new Date() 
          })
          .where(eq(users.id, id))
          .returning();
        return user;
      }
      async createAdClick(adId: string, userId: string): Promise<boolean> {
        return await db.transaction(async (tx) => {
          // Optional: Check if user already clicked this ad (uncomment if needed)
          // const existingClick = await tx
          //   .select()
          //   .from(clicksEvents)
          //   .where(eq(clicksEvents.adId, adId))
          //   .limit(1);
          
          // if (existingClick.length > 0) {
          //   throw ErrorBuilder.build(
          //     ErrorCode.BAD_REQUEST,
          //     "User has already clicked this ad"
          //   );
          // }
      
          // 1. Create the click event
          await tx
            .insert(clicksEvents)
            .values({
              adId,
              source: "web",
            });
      
          // 2. Increment the click count on the ad
          await tx
            .update(ads)
            .set({
              likesCount: sql`${ads.likesCount} + 1`,
              updatedAt: sql`now()`,
            })
            .where(eq(ads.id, adId));
      
          return true;
        });
      }
  // ✅ Get all available ratios
  async getAvaialbeImpressionRatios(): Promise<AdminImpressionRatio[]> {
    try {
      const ratios = await db
        .select()
        .from(adminImpressionRatio)
        .orderBy(adminImpressionRatio.currency);

      return ratios;
    } catch (error) {
      throw ErrorBuilder.build(
        ErrorCode.DATABASE_ERROR,
        "Failed to fetch available impression ratios",
        error instanceof Error ? error.message : error
      );
    }
  }

  // ✅ Update an existing impression ratio
  async updateImpressionRatio(
    adminId: string,
    id: string,
    impressionsPerUnit: number,
    currency: "usd" | "sar"
  ): Promise<AdminImpressionRatio> {
    try {
      const [updated] = await db
        .update(adminImpressionRatio)
        .set({
          impressionsPerUnit,
          currency,
          updatedBy: adminId,
          updatedAt: sql`now()`,
        })
        .where(eq(adminImpressionRatio.id, id))
        .returning();

      if (!updated) {
        throw ErrorBuilder.build(
          ErrorCode.AD_NOT_FOUND,
          `Impression ratio with id ${id} not found`
        );
      }

      return updated;
    } catch (error) {
      throw ErrorBuilder.build(
        ErrorCode.DATABASE_ERROR,
        "Failed to update impression ratio",
        error instanceof Error ? error.message : error
      );
    }
  }


  
async getProfile(id: string): Promise<Partial<User>> {
  const [user] = await db
    .select({
      id: users.id,
      username: users.username,
      email: users.email,
      role: users.role,
      country:users.country,
      verified: users.verified,
      freeViewsCredits: users.freeViewsCredits,
      createdAt: users.createdAt,
      adsCount: users.adsCount,
      totalSpend: users.totalSpend,
      balance: users.balance,
      oauth: users.oauth
    })
    .from(users)
    .where(eq(users.id, id));

  if (!user) {
    throw ErrorBuilder.build(
      ErrorCode.USER_NOT_FOUND,
      "User not found"
    );
  }

  return user;
}

async updateProfile(id: string, updates: Partial<Pick<User, 'username' | 'password' | 'country'>>): Promise<Partial<User>> {

  if (updates.country && !middleEastCountries.enumValues.includes(updates.country)) {
    throw ErrorBuilder.build(
      ErrorCode.VALIDATION_ERROR,
      `Invalid country. Allowed values: ${middleEastCountries.enumValues.join(", ")}`
    );
  }
  if (updates.password) {
    updates.password = await this.hashPassword(updates.password)
  }

  const [user] = await db
    .update(users)
    .set({ 
      ...updates, 
      updatedAt: new Date() 
    })
    .where(eq(users.id, id))
    .returning({
      id: users.id,
      username: users.username,
      email: users.email,
      role: users.role,
      country:users.country,
      verified: users.verified,
      freeViewsCredits: users.freeViewsCredits,
      createdAt: users.createdAt,
      adsCount: users.adsCount,
      totalSpend: users.totalSpend,
      balance: users.balance,
      oauth: users.oauth
    });

  if (!user) {
    throw ErrorBuilder.build(
      ErrorCode.USER_NOT_FOUND,
      "User not found"
    );
  }

  return user;
}






// dashboard 

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

    if (adIds.length === 0) {
      return {
        totalImpressions: 0,
        impressionGrowth: 0,
        totalClicks: 0,
        clickGrowth: 0,
        clickThroughRate: 0,
        ctrGrowth: 0,
        remainingBalance: 0,
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

    // Get user balance
    const [userBalance] = await db
      .select({ 
        balance: users.balance,
        freeViewsCredits: users.freeViewsCredits 
      })
      .from(users)
      .where(eq(users.id, userId));

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

    const remainingBalance = (userBalance?.balance || 0) + (userBalance?.freeViewsCredits || 0);

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
 */
async getTopPerformingAds(userId: string, limit: number = 5): Promise<TopPerformingAd[]> {
  try {
    // Get user's ads with their impression and click counts
    const topAds = await db
      .select({
        id: ads.id,
        titleEn: ads.titleEn,
        titleAr: ads.titleAr,
        imageUrl: ads.imageUrl,
        impressions: sql<number>`COUNT(DISTINCT ${impressionsEvents.id})`,
        clicks: sql<number>`COUNT(DISTINCT ${clicksEvents.id})`,
      })
      .from(ads)
      .leftJoin(impressionsEvents, eq(ads.id, impressionsEvents.adId))
      .leftJoin(clicksEvents, eq(ads.id, clicksEvents.adId))
      .where(eq(ads.userId, userId))
      .groupBy(ads.id, ads.titleEn, ads.titleAr, ads.imageUrl)
      .orderBy(desc(sql`COUNT(DISTINCT ${impressionsEvents.id})`))
      .limit(limit);

    return topAds.map(ad => {
      const impressions = Number(ad.impressions) || 0;
      const clicks = Number(ad.clicks) || 0;
      const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;

      return {
        id: ad.id,
        titleEn: ad.titleEn,
        titleAr: ad.titleAr,
        imageUrl: ad.imageUrl,
        impressions,
        clicks,
        ctr: Math.round(ctr * 100) / 100,
      };
    });
  } catch (error) {
    throw ErrorBuilder.build(
      ErrorCode.DATABASE_ERROR,
      "Failed to fetch top performing ads",
      error instanceof Error ? error.message : error
    );
  }
}

/**
 * Get recent activity for the user
 */
async getRecentActivity(userId: string, limit: number = 10) {
  try {
    // Get user's ads
    const userAds = await db
      .select({ id: ads.id, titleEn: ads.titleEn, titleAr: ads.titleAr })
      .from(ads)
      .where(eq(ads.userId, userId));

    const adIds = userAds.map(ad => ad.id);
    const adMap = new Map(userAds.map(ad => [ad.id, ad]));

    if (adIds.length === 0) {
      return [];
    }

    // Get recent impressions - FIXED: Use inArray instead of ANY
    const recentImpressions = await db
      .select({
        id: impressionsEvents.id,
        adId: impressionsEvents.adId,
        type: sql<string>`'impression'`,
        createdAt: impressionsEvents.createdAt,
      })
      .from(impressionsEvents)
      .where(inArray(impressionsEvents.adId, adIds))
      .orderBy(desc(impressionsEvents.createdAt))
      .limit(limit);

    // Get recent clicks - FIXED: Use inArray instead of ANY
    const recentClicks = await db
      .select({
        id: clicksEvents.id,
        adId: clicksEvents.adId,
        type: sql<string>`'click'`,
        createdAt: clicksEvents.createdAt,
      })
      .from(clicksEvents)
      .where(inArray(clicksEvents.adId, adIds))
      .orderBy(desc(clicksEvents.createdAt))
      .limit(limit);

    // Combine and sort by date
    const activities = [...recentImpressions, ...recentClicks]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit)
      .map(activity => ({
        ...activity,
        adTitle: adMap.get(activity.adId)?.titleEn || 'Unknown Ad',
      }));

    return activities;
  } catch (error) {
    throw ErrorBuilder.build(
      ErrorCode.DATABASE_ERROR,
      "Failed to fetch recent activity",
      error instanceof Error ? error.message : error
    );
  }
}
}