import { and, eq } from "drizzle-orm";
import { IAdPhotoRepository } from "../../domain/repositories/ad.photo.repository.interface";
import { db } from "../../../../infrastructure/db/connection";
import { ads } from "../../../../infrastructure/shared/schema/schema";
import { ErrorBuilder } from "../../../../infrastructure/shared/common/errors/errorBuilder";
import { ErrorCode } from "../../../../infrastructure/shared/common/errors/enums/basic.error.enum";

export class AdPhotoRepository implements IAdPhotoRepository {
  async addPhotoToAd(id: string, photos: string[]): Promise<boolean> {
    try {
      // Fetch current imageUrls
      const [current] = await db
        .select({ imageUrls: ads.imageUrl })
        .from(ads)
        .where(eq(ads.id, id));

      if (!current) {
        throw ErrorBuilder.build(
          ErrorCode.DATABASE_ERROR,
          `Ad with id ${id} not found`
        );
      }

      // Merge existing URLs with new ones
      const updatedUrls = [...(current.imageUrls || []), ...photos];

      // Update with merged array
      const [updated] = await db
        .update(ads)
        .set({ imageUrl: updatedUrls })
        .where(eq(ads.id, id))
        .returning({ id: ads.id });

      if (!updated) {
        throw ErrorBuilder.build(
          ErrorCode.DATABASE_ERROR,
          `Failed to add photo to ad with id ${id}`
        );
      }

      return true;
    } catch (error) {
      throw ErrorBuilder.build(
        ErrorCode.DATABASE_ERROR,
        "Failed to add photo to ad",
        error instanceof Error ? error.message : error
      );
    }
  }

  async deletePhotoFromAd(id: string, userId: string, photoUrl: string): Promise<boolean> {
    // First, get the current ad to access its imageUrl
    const [ad] = await db
      .select({ imageUrl: ads.imageUrl })
      .from(ads)
      .where(and(eq(ads.id, id), eq(ads.userId, userId)))
      .limit(1);

    if (!ad || !ad.imageUrl) {
      throw ErrorBuilder.build(
        ErrorCode.AD_NOT_FOUND,
        `Ad with id ${id} not found or has no images`
      );
    }

    // Check if the photo URL exists in the array
    if (!ad.imageUrl.includes(photoUrl)) {
      throw ErrorBuilder.build(
        ErrorCode.PHOTO_NOT_FOUND,
        `Photo URL not found in ad with id ${id}`
      );
    }

    // Remove the photo at the specified URL
    const updatedImageUrl = ad.imageUrl.filter((url) => url !== photoUrl);

    // Update the ad with the new imageUrl array
    const [updated] = await db
      .update(ads)
      .set({ imageUrl: updatedImageUrl })
      .where(and(eq(ads.id, id), eq(ads.userId, userId)))
      .returning({ id: ads.id });

    if (!updated) {
      throw ErrorBuilder.build(
        ErrorCode.DATABASE_ERROR,
        `Failed to delete photo from ad with id ${id}`
      );
    }

    return true;
  }

  async updatePhotoFromAd(
    id: string,
    userId: string,
    newPhotoUrl: string,
    oldPhotoUrl: string,
    role: string
  ): Promise<boolean> {
    try {
      let ad: any;

      // Corrected logic: admins can access any ad, users only their own
      if (role === "admin") {
        ad = await db
          .select({ imageUrl: ads.imageUrl })
          .from(ads)
          .where(eq(ads.id, id))
          .limit(1);
      } else {
        ad = await db
          .select({ imageUrl: ads.imageUrl })
          .from(ads)
          .where(and(eq(ads.id, id), eq(ads.userId, userId)))
          .limit(1);
      }

      if (!ad || ad.length === 0 || !ad[0].imageUrl) {
        throw ErrorBuilder.build(
          ErrorCode.AD_NOT_FOUND,
          `Ad with id ${id} not found or has no images`
        );
      }

      // Access the first element since select returns an array
      const currentAd = ad[0];

      if (!currentAd.imageUrl.includes(oldPhotoUrl)) {
        throw ErrorBuilder.build(
          ErrorCode.PHOTO_NOT_FOUND,
          `Photo URL not found in ad with id ${id}`
        );
      }

      const updatedImageUrl = currentAd.imageUrl.map((url: string) =>
        url === oldPhotoUrl ? newPhotoUrl : url
      );

      // Apply same role-based logic to update
      const updateCondition = role === "admin"
        ? eq(ads.id, id)
        : and(eq(ads.id, id), eq(ads.userId, userId));

      const [updated] = await db
        .update(ads)
        .set({ imageUrl: updatedImageUrl })
        .where(updateCondition)
        .returning({ id: ads.id });

      if (!updated) {
        throw ErrorBuilder.build(
          ErrorCode.DATABASE_ERROR,
          `Failed to update photo in ad with id ${id}`
        );
      }

      return true;
    } catch (error) {
      if (error instanceof Error && error.name === 'CustomError') {
        throw error;
      }

      throw ErrorBuilder.build(
        ErrorCode.DATABASE_ERROR,
        "Failed to update photo in ad",
        error instanceof Error ? error.message : String(error)
      );
    }
  }
}
