import { db } from "../../../../infrastructure/db/connection";
import { IUserRepository } from "../../domain/repositories/user.repository";

import { eq, desc, sql } from "drizzle-orm";
import bcrypt from "bcrypt";
import { adminImpressionRatio, Ad, AdminImpressionRatio, ads, adsReport, clicksEvents, CreateUser, freeCredits, impressionsEvents, middleEastCountries, purchases, socialMediaPages, User, users, userEmail } from "../../../../infrastructure/shared/schema/schema";
import { PaginatedResponse, PaginationParams } from "../../../../infrastructure/shared/common/pagination.vo";
import { ErrorBuilder } from "../../../../infrastructure/shared/common/errors/errorBuilder";
import { ErrorCode } from "../../../../infrastructure/shared/common/errors/enums/basic.error.enum";
import { AdminDashboardStats, AdminChartData, RecentActivity, AdAnalyticsFullDetails } from "../../../dashboard/application/dtos/dashboard.interfaces";
import { AdsReport } from "../../application/dtos/ads-report.dto";
import { ChartData } from "../../../advertising/application/dtos/analytics.dto";

export class UserRepository implements IUserRepository {
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
