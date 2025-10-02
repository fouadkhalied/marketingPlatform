import { db } from "../../../../infrastructure/db/connection";
import { CreateFacebookUser, users } from "../../../../infrastructure/shared/schema/schema";
import { eq } from "drizzle-orm";
import { User } from "../../../../infrastructure/shared/schema/schema";
import { IFacebookRepository } from "../../domain/repositories/facebook.interface";

export class FacebookRepositoryImpl implements IFacebookRepository {
  // 1. Get user by Facebook ID
  async getUserByFacebookId(facebookId: string): Promise<User | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.facebookId, facebookId));

    return user || null;
  }

  // 2. Get user by Email
  async getUserByEmail(email: string): Promise<User | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));
    
    return user || null;
  }

  // 3. Create user from Facebook
  async createUser(data: CreateFacebookUser): Promise<User> {
    const [newUser] = await db.insert(users).values(data).returning();
    return newUser;
  }

  // 4. Update user to link Facebook account (if user exists with email)
  async linkFacebookAccount(userId: string, facebookId: string): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ facebookId })
      .where(eq(users.id, userId))
      .returning();
    
    return updatedUser;
  }
}