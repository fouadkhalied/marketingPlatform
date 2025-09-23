import { ResponseBuilder } from "../../../../infrastructure/shared/common/apiResponse/apiResponseBuilder";
import { ApiResponseInterface } from "../../../../infrastructure/shared/common/apiResponse/interfaces/apiResponse.interface";
import { ErrorCode } from "../../../../infrastructure/shared/common/errors/enums/basic.error.enum";
import { ErrorBuilder } from "../../../../infrastructure/shared/common/errors/errorBuilder";
import { PaginatedResponse, PaginationParams } from "../../../../infrastructure/shared/common/pagination.vo";
import { Ad, createAdSchema } from "../../../../infrastructure/shared/schema/schema";
import { AdStatus } from "../../domain/entities/enums/ads.status.enum";
import { IAdvertisingRepository } from "../../domain/repositories/advertising.repository.interface";

export class AdvertisingAppService {
  constructor(private readonly advertisingRepository: IAdvertisingRepository) {}

  async createAd(object: any, userId: string): Promise<ApiResponseInterface<{ AdId: string }>> {
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

      const adId: string = await this.advertisingRepository.create(adData);

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
      const ad = await this.advertisingRepository.findById(id);

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

  async listAdsForAdmin(status: AdStatus, pagination : PaginationParams): Promise<ApiResponseInterface<PaginatedResponse<Ad>>> {
    try {
      const ads = await this.advertisingRepository.findAllForAdmin(status, pagination);
      return ResponseBuilder.success(ads);
    } catch (error) {
      return ErrorBuilder.build(
        ErrorCode.INTERNAL_SERVER_ERROR,
        "Unexpected error while listing ads for admin",
        error instanceof Error ? error.message : error
      );
    }
  }

  async listAdsForUser(status: AdStatus, userId: string, pagination : PaginationParams): Promise<ApiResponseInterface<PaginatedResponse<Ad>>>  {
    try {
      const ads = await this.advertisingRepository.findAllForUser(status, userId, pagination);
      return ResponseBuilder.success(ads);
    } catch (error) {
      return ErrorBuilder.build(
        ErrorCode.INTERNAL_SERVER_ERROR,
        "Unexpected error while listing ads for user",
        error instanceof Error ? error.message : error
      );
    }
  }

  async updateAd(id: string, ad: Partial<Ad>): Promise<ApiResponseInterface<Ad | null>> {
    try {
      const updated = await this.advertisingRepository.update(id, ad);

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

  async deleteAd(id: string): Promise<ApiResponseInterface<{ deleted: boolean }>> {
    try {
      const deleted = await this.advertisingRepository.delete(id);

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

  
  async approveAd(id: string): Promise<ApiResponseInterface<Ad>> {
    try {
      const approvedAd = await this.advertisingRepository.approveAd(id);

      return ResponseBuilder.success(approvedAd);
    } catch (error) {
      return ErrorBuilder.build(
        ErrorCode.INTERNAL_SERVER_ERROR,
        "Unexpected error while approving ad",
        error instanceof Error ? error.message : error
      );
    }
  }

  async rejectAd(id: string, reason?: string): Promise<ApiResponseInterface<Ad>> {
    try {
      const rejectedAd = await this.advertisingRepository.rejectAd(id, reason);

      return ResponseBuilder.success(rejectedAd);
    } catch (error) {
      return ErrorBuilder.build(
        ErrorCode.INTERNAL_SERVER_ERROR,
        "Unexpected error while rejecting ad",
        error instanceof Error ? error.message : error
      );
    }
  }
}
