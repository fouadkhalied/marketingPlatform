import { db } from "../../../../infrastructure/db/connection";
import { IUserBilling } from "../../domain/repositories/user.repository";

import { eq } from "drizzle-orm";
import { users, User } from "../../../../infrastructure/shared/schema/schema";

export class UserBillingRepository implements IUserBilling {
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
