import { db } from "../../../../infrastructure/db/connection";
import { CreateGoogleUser, freeCredits, users } from "../../../../infrastructure/shared/schema/schema";
import { eq } from "drizzle-orm";
import { User } from "../../../../infrastructure/shared/schema/schema";
import { IGoogleRepository } from "../../domain/repositories/google.interface";

export class GoogleRepositoryImpl implements IGoogleRepository {
  // 1. Get user by Google ID
  async getUserByGoogleId(googleId: string): Promise<User | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.googleId, googleId));

    return user || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));
    return user || null;
  }

  // 2. Create user (generic so you can use it for Google, Facebook, or email-password signup)
  async createUser(data: CreateGoogleUser): Promise<User> {
    const [freeCreditsData] = await db.select().from(freeCredits).limit(1);

    
    data.balance = freeCreditsData.credits
    const [newUser] = await db.insert(users).values(data).returning();

  //  console.log(newUser);
    
    return newUser;
  }


  async linkGoogleAccount(userId: string, googleId: string): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ googleId })
      .where(eq(users.id, userId))
      .returning();
    
    return updatedUser;
  }
}
