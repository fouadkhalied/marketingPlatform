import { db } from "../../../../infrastructure/db/connection";
import { IUserVerification } from "../../domain/repositories/user.repository";

import { eq } from "drizzle-orm";
import { users, User } from "../../../../infrastructure/shared/schema/schema";

export class UserVerificationRepository implements IUserVerification {
  async verifyUser(id: string): Promise<User | undefined> {
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
}
