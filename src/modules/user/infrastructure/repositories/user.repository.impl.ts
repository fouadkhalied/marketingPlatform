import { db } from "../../../../infrastructure/db/connection";
import { userInterface } from "../../domain/repositories/user.repository";

import { eq, and, desc, gte, lte, count, sum, sql } from "drizzle-orm";
import bcrypt from "bcrypt";
import { CreateUser, socialMediaPages, User, users } from "../../../../infrastructure/shared/schema/schema";
import { PaginatedResponse, PaginationParams } from "../../../../infrastructure/shared/common/pagination.vo";

export class UserRepositoryImpl implements userInterface {
    async hashPassword(password: string): Promise<string> {
        return bcrypt.hash(password, 12);
      }
    
      async validateUser(email: string, password: string): Promise<User | null> {
        const user = await this.getUserByEmail(email);
        if (!user) return null;
        
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
          totalSpend: result[0].totalSpend,
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
}