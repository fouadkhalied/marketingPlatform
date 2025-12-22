import { ResponseBuilder } from "../../../../infrastructure/shared/common/apiResponse/apiResponseBuilder";
import { ApiResponseInterface } from "../../../../infrastructure/shared/common/apiResponse/interfaces/apiResponse.interface";
import { ErrorCode } from "../../../../infrastructure/shared/common/errors/enums/basic.error.enum";
import { ErrorBuilder } from "../../../../infrastructure/shared/common/errors/errorBuilder";
import { PaginationParams } from "../../../../infrastructure/shared/common/pagination.vo";
import { Ad } from "../../../../infrastructure/shared/schema/schema";
import { IAdListingRepository } from "../../domain/repositories/ad.listing.repository.interface";
import { ILogger } from "../../../../infrastructure/shared/common/logging";

export class AdListingAppService {
  constructor(
    private readonly adListingRepository: IAdListingRepository,
    private readonly logger: ILogger
  ) {}

  async listAdsForAdmin(
    status: string,
    pagination: PaginationParams
  ): Promise<ApiResponseInterface<Ad[]>> {
    try {
      const ads = await this.adListingRepository.findAllAdsForAdmin(status, pagination);
      return ResponseBuilder.paginatedSuccess(ads.data, ads.pagination);
    } catch (error) {
      return ErrorBuilder.build(
        ErrorCode.INTERNAL_SERVER_ERROR,
        "Unexpected error while listing ads for admin",
        error instanceof Error ? error.message : error
    );
    }
  }

  async listAdsForUser(
    status: string, // 👈 always string
    userId: string,
    pagination: PaginationParams
  ): Promise<ApiResponseInterface<Ad[]>> {
    try {
      const ads = await this.adListingRepository.findAllAdsForUser(status, userId, pagination);
      return ResponseBuilder.paginatedSuccess(ads.data,ads.pagination);
    } catch (error) {
      return ErrorBuilder.build(
        ErrorCode.INTERNAL_SERVER_ERROR,
        "Unexpected error while listing ads for user",
        error instanceof Error ? error.message : error
      );
    }
  }

  async listAdsFeed(
    pagination: PaginationParams,
    locations: string[],
    title?:string,
    description?:string,
    targetAudience?:string,
    source?:string
  ): Promise<ApiResponseInterface<Ad[]>> {
    try {
      const ads = await this.adListingRepository.listAdsFeed(pagination, locations, title, description,targetAudience,source);
      return ResponseBuilder.paginatedSuccess(ads.data, ads.pagination);
    } catch (error) {
      return ErrorBuilder.build(
        ErrorCode.INTERNAL_SERVER_ERROR,
        "Unexpected error while listing ads feed for user",
        error instanceof Error ? error.message : error
      );
    }
  }

  async listApprovedAdsForUser(
    pagination: PaginationParams,
    locations: string[],
    title?:string,
    description?:string,
    targetAudience?:string,
    source?:string
  ): Promise<ApiResponseInterface<Ad[]>> {
    try {
      const ads = await this.adListingRepository.listApprovedAdsForUser(pagination, locations, title, description,targetAudience,source);
      return ResponseBuilder.paginatedSuccess(ads.data, ads.pagination);
    } catch (error) {
      return ErrorBuilder.build(
        ErrorCode.INTERNAL_SERVER_ERROR,
        "Unexpected error while listing free ads for user",
        error instanceof Error ? error.message : error
      );
    }
  }
}
