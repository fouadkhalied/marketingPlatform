import { and, desc, eq, ne, sql } from "drizzle-orm";
import { IPixelRepository } from "../../domain/repositories/pixel.repository.interface";
import { db } from "../../../../infrastructure/db/connection";
import { pixels } from "../../../../infrastructure/shared/schema/schema";
import { ErrorBuilder } from "../../../../infrastructure/shared/common/errors/errorBuilder";
import { ErrorCode } from "../../../../infrastructure/shared/common/errors/enums/basic.error.enum";
import { PaginatedResponse, PaginationParams } from "../../../../infrastructure/shared/common/pagination.vo";
import { pixel } from "../../../../infrastructure/shared/common/pixel/interface/pixelBody.interface";

export class PixelRepository implements IPixelRepository {
  async createPixel(pixelData: pixel): Promise<any> {
    // ✅ 1. Check if a pixel with the same platform + pixelId already exists
    const [existingPixel] = await db
      .select()
      .from(pixels)
      .where(
        and(
          eq(pixels.pixelId, pixelData.pixelId),
          eq(pixels.platform, pixelData.platform)
        )
      )
      .limit(1);

    if (existingPixel) {
      throw ErrorBuilder.build(
        ErrorCode.VALIDATION_ERROR,
        `A pixel with ID "${pixelData.pixelId}" already exists for platform "${pixelData.platform}"`
      );
    }


    // ✅ 2. Insert new pixel
    const [createdPixel] = await db
      .insert(pixels)
      .values({
        name: pixelData.name,
        pixelId: pixelData.pixelId,
        platform: pixelData.platform,
      })
      .returning();

    // ✅ 3. Check insertion result
    if (!createdPixel) {
      throw ErrorBuilder.build(
        ErrorCode.DATABASE_ERROR,
        'Failed to create pixel record'
      );
    }

    return createdPixel;
  }

  async getPixelById(pixelId: string): Promise<pixel | null> {
    const [foundPixel] = await db
      .select()
      .from(pixels)
      .where(eq(pixels.id, pixelId))
      .limit(1);

    return foundPixel || null;
  }

  async getAllPixels(pagination: PaginationParams): Promise<PaginatedResponse<pixel>> {
    const { page = 1, limit = 10 } = pagination;
    const offset = (page - 1) * limit;

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(pixels);

    // Get paginated data
    const pixelsList = await db
      .select()
      .from(pixels)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(pixels.createdAt));

    const totalPages = Math.ceil(count / limit);

    return {
      data: pixelsList,
      pagination: {
        currentPage : page,
        limit,
        totalCount: count,
        totalPages: totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      },
    };
  }

  async updatePixel(
    pixelId: string,
    updateData: Partial<pixel>
  ): Promise<pixel> {
    // Check if pixel exists
    const [existingPixel] = await db
      .select()
      .from(pixels)
      .where(eq(pixels.id, pixelId))
      .limit(1);

    if (!existingPixel) {
      throw ErrorBuilder.build(
        ErrorCode.PIXEL_NOT_FOUND,
        `Pixel with ID "${pixelId}" not found`
      );
    }

    // If updating pixelId or platform, check for duplicates
    if (updateData.pixelId || updateData.platform) {
      const checkPixelId = updateData.pixelId || existingPixel.pixelId;
      const checkPlatform = updateData.platform || existingPixel.platform;

      const [duplicate] = await db
        .select()
        .from(pixels)
        .where(
          and(
            eq(pixels.pixelId, checkPixelId),
            eq(pixels.platform, checkPlatform),
            ne(pixels.id, pixelId) // Exclude current pixel
          )
        )
        .limit(1);

      if (duplicate) {
        throw ErrorBuilder.build(
          ErrorCode.VALIDATION_ERROR,
          `A pixel with ID "${checkPixelId}" already exists for platform "${checkPlatform}"`
        );
      }
    }

    // Update pixel
    const [updatedPixel] = await db
      .update(pixels)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(pixels.id, pixelId))
      .returning();

    if (!updatedPixel) {
      throw ErrorBuilder.build(
        ErrorCode.DATABASE_ERROR,
        "Failed to update pixel"
      );
    }

    return updatedPixel;
  }

  async deletePixel(pixelId: string): Promise<boolean> {
    // Check if pixel exists
    const [existingPixel] = await db
      .select()
      .from(pixels)
      .where(eq(pixels.id, pixelId))
      .limit(1);

    if (!existingPixel) {
      throw ErrorBuilder.build(
        ErrorCode.PIXEL_NOT_FOUND,
        `Pixel with ID "${pixelId}" not found`
      );
    }

    // Delete pixel
    const [deletedPixel] = await db
      .delete(pixels)
      .where(eq(pixels.id, pixelId))
      .returning({ id: pixels.id });

    if (!deletedPixel) {
      throw ErrorBuilder.build(
        ErrorCode.DATABASE_ERROR,
        "Failed to delete pixel"
      );
    }

    return true;
  }
}
