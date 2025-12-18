import { ResponseBuilder } from "../../../../infrastructure/shared/common/apiResponse/apiResponseBuilder";
import { ApiResponseInterface } from "../../../../infrastructure/shared/common/apiResponse/interfaces/apiResponse.interface";
import { ErrorCode } from "../../../../infrastructure/shared/common/errors/enums/basic.error.enum";
import { ErrorBuilder } from "../../../../infrastructure/shared/common/errors/errorBuilder";
import { PaginationParams } from "../../../../infrastructure/shared/common/pagination.vo";
import { Ad, createAdSchema, InsertAd } from "../../../../infrastructure/shared/schema/schema";
import { IAdCrudRepository } from "../../domain/repositories/ad.crud.repository.interface";

export class AdCrudAppService {
  constructor(
    private readonly adCrudRepository: IAdCrudRepository
  ) {}

  async createAd(
    object: any,
    userId: string
  ): Promise<ApiResponseInterface<{ AdId: string }>> {
    try {
      const adData = {
        ...object,
        userId: userId,
      };

      const validation = createAdSchema.safeParse(adData);
      if (!validation.success) {
        return ErrorBuilder.build(
          ErrorCode.VALIDATION_ERROR,
          "Validation error",
          validation.error.errors[0]
        );
      }

      const adId = await this.adCrudRepository.create(adData);

      return ResponseBuilder.success({ AdId: adId });
    } catch (error) {
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
        console.log('❌ Wrong type received:', typeof ad.targetCities, ad.targetCities);
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
      return ErrorBuilder.build(
        ErrorCode.INTERNAL_SERVER_ERROR,
        "Unexpected error while updating ad",
        error instanceof Error ? error.message : error
      );
    }
  }


  async deleteAd(id: string, userId : string, role :string): Promise<ApiResponseInterface<{ deleted: boolean }>> {
    try {


      const deleted = await this.adCrudRepository.delete(id, userId, role);

      if (!deleted) {
        return ErrorBuilder.build(
          ErrorCode.AD_NOT_FOUND,
          `Ad with id ${id} not found`
        );
      }

      return ResponseBuilder.success({ deleted: true });
    } catch (error) {
      return ErrorBuilder.build(
        ErrorCode.INTERNAL_SERVER_ERROR,
        "Unexpected error while deleting ad",
        error instanceof Error ? error.message : error
      );
    }
  }
}
