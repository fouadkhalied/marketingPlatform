import { db } from "../../../../infrastructure/db/connection";
import { IUserProfile } from "../../domain/repositories/user.repository";

import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import { users, User } from "../../../../infrastructure/shared/schema/schema";
import { ErrorBuilder } from "../../../../infrastructure/shared/common/errors/errorBuilder";
import { ErrorCode } from "../../../../infrastructure/shared/common/errors/enums/basic.error.enum";
import { middleEastCountries } from "../../../../infrastructure/shared/schema/schema";

export class UserProfileRepository implements IUserProfile {
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
      updates.password = await bcrypt.hash(updates.password, 12)
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
}
