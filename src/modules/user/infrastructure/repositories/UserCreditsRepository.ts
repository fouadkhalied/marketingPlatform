import { db } from "../../../../infrastructure/db/connection";
import { IUserCredits } from "../../domain/repositories/user.repository";

import { eq, sql } from "drizzle-orm";
import { users, freeCredits } from "../../../../infrastructure/shared/schema/schema";

export class UserCreditsRepository implements IUserCredits {
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
}
