import { db } from "../../../../infrastructure/db/connection";
import { CreateGoogleUser, users } from "../../../../infrastructure/shared/schema/schema";
import { eq } from "drizzle-orm";
import { User } from "../../../../infrastructure/shared/schema/schema";
import { IGoogleRepository } from "../../../user/domain/repositories/google.interface";

export class GoogleRepositoryImpl implements IGoogleRepository {
  // 1. Get user by Google ID
  async getUserByGoogleId(googleId: string): Promise<User | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.googleId, googleId));

    return user || null;
  }

  // 2. Create user (generic so you can use it for Google, Facebook, or email-password signup)
  async createUser(data: CreateGoogleUser): Promise<User> {
    const [newUser] = await db.insert(users).values(data).returning();
    return newUser;
  }
}
