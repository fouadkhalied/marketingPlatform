import { ResponseBuilder } from "../../../../infrastructure/shared/common/apiResponse/apiResponseBuilder";
import { ApiResponseInterface } from "../../../../infrastructure/shared/common/apiResponse/interfaces/apiResponse.interface";
import { ErrorCode } from "../../../../infrastructure/shared/common/errors/enums/basic.error.enum";
import { ErrorBuilder } from "../../../../infrastructure/shared/common/errors/errorBuilder";
import { PaginationParams } from "../../../../infrastructure/shared/common/pagination.vo";
import { Ad, createAdSchema, InsertAd } from "../../../../infrastructure/shared/schema/schema";
import { IAdCrudRepository } from "../../domain/repositories/ad.crud.repository.interface";
import { ILogger } from "../../../../infrastructure/shared/common/logging";
import { AdPhotoAppService } from "./ad.photo-app.service";

export class AdCrudAppService {
  constructor(
    private readonly adCrudRepository: IAdCrudRepository,
    private readonly logger: ILogger
  ) {}

  async createAd(
    object: any,
    userId: string
  ): Promise<ApiResponseInterface<{ AdId: string }>> {
    try {
      this.logger.info('Creating new ad', { userId, adTitle: object.titleEn || object.title });

      const adData = {
        ...object,
        userId: userId,
      };

      const validation = createAdSchema.safeParse(adData);
      if (!validation.success) {
        this.logger.warn('Ad creation validation failed', {
          userId,
          validationErrors: validation.error.errors
        });
        return ErrorBuilder.build(
          ErrorCode.VALIDATION_ERROR,
          "Validation error",
          validation.error.errors[0]
        );
      }

      const adId = await this.adCrudRepository.create(adData);
      this.logger.info('Ad created successfully', { adId, userId });

      return ResponseBuilder.success({ AdId: adId });
    } catch (error) {
      this.logger.error('Failed to create ad', {
        userId,
        error: error instanceof Error ? error.message : error,
        adData: object
      });
      return ErrorBuilder.build(
        ErrorCode.INTERNAL_SERVER_ERROR,
        "Unexpected error while creating ad",
        error instanceof Error ? error.message : error
      );
    }
  }

  async getAdById(id: string): Promise<ApiResponseInterface<Ad | null>> {
    try {
      const ad = await this.adCrudRepository.findById(id);

      if (!ad) {
        return ErrorBuilder.build(
          ErrorCode.AD_NOT_FOUND,
          `Ad with id ${id} not found`
        );
      }

      return ResponseBuilder.success(ad);
    } catch (error) {
      this.logger.error('Failed to fetch ad by ID', {
        adId: id,
        error: error instanceof Error ? error.message : error
      });
      return ErrorBuilder.build(
        ErrorCode.INTERNAL_SERVER_ERROR,
        "Unexpected error while fetching ad",
        error instanceof Error ? error.message : error
      );
    }
  }

  async getAdsByTitle(title: string, params: PaginationParams): Promise<ApiResponseInterface<Ad[]>> {
    try {
      const ads = await this.adCrudRepository.findByTitle(title, params);

      if (!ads || ads.data.length === 0) {
        return ErrorBuilder.build(
          ErrorCode.AD_NOT_FOUND,
          `No ads found with title: ${title}`
        );
      }

      return ResponseBuilder.paginatedSuccess(ads.data, ads.pagination);
    } catch (error) {
      return ErrorBuilder.build(
        ErrorCode.INTERNAL_SERVER_ERROR,
        "Unexpected error while fetching ads by title",
        error instanceof Error ? error.message : error
      );
    }
  }

  async updateAd(id: string, ad: Partial<Ad>): Promise<ApiResponseInterface<Ad | null>> {
    try {

      if (ad.targetCities && !Array.isArray(ad.targetCities)) {
        this.logger.warn('Invalid targetCities type received', {
          receivedType: typeof ad.targetCities,
          receivedValue: ad.targetCities,
          adId: id
        });
        throw new Error(`Expected targetCities to be an array but got ${typeof ad.targetCities}`);
      }

      const updated = await this.adCrudRepository.update(id, ad);

      if (!updated) {
        return ErrorBuilder.build(
          ErrorCode.AD_NOT_FOUND,
          `Ad with id ${id} not found`
        );
      }

      return ResponseBuilder.success(updated);
    } catch (error) {
      this.logger.error('Failed to update ad', {
        adId: id,
        error: error instanceof Error ? error.message : error
      });
      return ErrorBuilder.build(
        ErrorCode.INTERNAL_SERVER_ERROR,
        "Unexpected error while updating ad",
        error instanceof Error ? error.message : error
      );
    }
  }


  async deleteAd(id: string, userId : string, role :string): Promise<ApiResponseInterface<{ photoUrl: string | undefined }>> {
    try {


      const deleted = await this.adCrudRepository.delete(id, userId, role);

      if (!deleted) {
        return ErrorBuilder.build(
          ErrorCode.AD_NOT_FOUND,
          `Ad with id ${id} not found`
        );
      }

      return ResponseBuilder.success({ photoUrl: deleted.photoUrl[0] ? deleted.photoUrl[0] : undefined});
    } catch (error) {
      this.logger.error('Failed to delete ad', {
        adId: id,
        userId,
        role,
        error: error instanceof Error ? error.message : error
      });
      return ErrorBuilder.build(
        ErrorCode.INTERNAL_SERVER_ERROR,
        "Unexpected error while deleting ad",
        error instanceof Error ? error.message : error
      );
    }
  }
}
