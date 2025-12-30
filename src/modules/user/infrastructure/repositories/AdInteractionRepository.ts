import { db } from "../../../../infrastructure/db/connection";
import { IAdInteraction } from "../../domain/repositories/user.repository";

import { eq, sql } from "drizzle-orm";
import { ads, clicksEvents } from "../../../../infrastructure/shared/schema/schema";

export class AdInteractionRepository implements IAdInteraction {
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
}
