import { db } from "../../../../infrastructure/db/connection";
import { IUserRepository } from "../../domain/repositories/user.repository";

import { eq, desc, sql, and, gte, lte } from "drizzle-orm";
import bcrypt from "bcrypt";
import { adminImpressionRatio, Ad, AdminImpressionRatio, ads, adsReport, clicksEvents, CreateUser, freeCredits, impressionsEvents, middleEastCountries, purchases, socialMediaPages, User, users, userEmail } from "../../../../infrastructure/shared/schema/schema";
import { PaginatedResponse, PaginationParams } from "../../../../infrastructure/shared/common/pagination.vo";
import { ErrorBuilder } from "../../../../infrastructure/shared/common/errors/errorBuilder";
import { ErrorCode } from "../../../../infrastructure/shared/common/errors/enums/basic.error.enum";
import { AdminDashboardStats, AdminChartData, RecentActivity, AdAnalyticsFullDetails } from "../../../dashboard/application/dtos/dashboard.interfaces";
import { AdsReport } from "../../application/dtos/ads-report.dto";
import { ChartData } from "../../../advertising/application/dtos/analytics.dto";

export class UserRepositoryImpl implements IUserRepository {
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

        const [freeCreditsData] = await db.select().from(freeCredits).limit(1);
        
      
        const [user] = await db
          .insert(users)
          .values({
            ...insertUser,
            password: hashedPassword,
            balance: freeCreditsData?.credits || 0,
          })
          .returning();

          console.log(user);
          
      
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

      async createAdClick(adId: string, userId: string, forWebsite: boolean): Promise<boolean> {
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
      
          if (forWebsite) {
          // 1. Increment the click count on the websiteUrl
          await tx
            .update(ads)
            .set({
              websiteClicks: sql`${ads.websiteClicks} + 1`,
            })
            .where(eq(ads.id, adId));

            return true
          } else { 
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
        }
      }
      );
        
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


async updateFreeCredits(credits: number): Promise<boolean> {
  const [updated] = await db
    .update(freeCredits)
    .set({ credits })
    .returning();
  
    
  return !!updated;
}

async getFreeCredits(): Promise<number> {
  const [credits] = await db
    .select({ credits: freeCredits.credits })
    .from(freeCredits)
    .limit(1);
  return credits?.credits || 0;
}

async createAdReport(adId: string, email: string, username: string, phoneNumber: string, reportDescription: string): Promise<boolean> {
  try {
    const [report] = await db
      .insert(adsReport)
      .values({ adId, email, username, phoneNumber, reportDescription })
      .returning();
    return !!report;
  } catch (error) {
    throw ErrorBuilder.build(
      ErrorCode.DATABASE_ERROR,
      "Failed to create ad report",
      error instanceof Error ? error.message : error
    );
  }
}

async getAdReports(pagination: PaginationParams): Promise<PaginatedResponse<AdsReport>> {
  try {
    const { page, limit } = pagination;
    const offset = (page - 1) * limit;
    const reports = await db
      .select({
        id: adsReport.id,
        adId: adsReport.adId,
        email: adsReport.email,
        username: adsReport.username,
        phoneNumber: adsReport.phoneNumber,
        reportDescription: adsReport.reportDescription,
        createdAt: adsReport.createdAt,
      })
      .from(adsReport)
      .orderBy(desc(adsReport.createdAt))
      .limit(limit)
      .offset(offset);
    return {
      data: reports as AdsReport[],
        pagination: {
          currentPage: page,
          limit,
          totalCount: reports.length,
          totalPages: Math.ceil(reports.length / limit),
          hasNext: page < Math.ceil(reports.length / limit),
          hasPrevious: page > 1,
        },
    };
  } catch (error) {
    throw ErrorBuilder.build(
      ErrorCode.DATABASE_ERROR,
      "Failed to get ad reports",
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

async addCretidToUserByAdmin(credit:number, userId: string):Promise<boolean> {
  const [user] = await db
          .update(users)
          .set({
            balance : sql`${users.balance} + ${credit}`
          })
          .where(eq(users.id, userId))
          .returning();

        if (!user) {
          throw new Error("User not found");
        }

        return true;
}

async addUserEmail(email: string): Promise<boolean> {
  try {
    console.log('User repository: Adding user email', { email });

    await db.insert(userEmail).values({
      email: email.toLowerCase().trim()
    });

    console.log('User repository: User email added successfully', { email });
    return true;
  } catch (error: any) {
    console.error('User repository: Failed to add user email', {
      email,
      error: error instanceof Error ? error.message : error
    });
    throw ErrorBuilder.build(
      ErrorCode.DATABASE_ERROR,
      "Failed to add user email",
      error instanceof Error ? error.message : error
    );
  }
}
}