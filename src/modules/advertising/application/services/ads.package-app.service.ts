import { ResponseBuilder } from "../../../../infrastructure/shared/common/apiResponse/apiResponseBuilder";
import { ApiResponseInterface } from "../../../../infrastructure/shared/common/apiResponse/interfaces/apiResponse.interface";
import { ErrorCode } from "../../../../infrastructure/shared/common/errors/enums/basic.error.enum";
import { ErrorBuilder } from "../../../../infrastructure/shared/common/errors/errorBuilder";
import { PaginationParams } from "../../../../infrastructure/shared/common/pagination.vo";
import { AdsPackage, InsertAdsPackage } from "../../../../infrastructure/shared/schema/schema";
import { IAdsPackageRepository } from "../../domain/repositories/ads.package.repository.interface";
import { ILogger } from "../../../../infrastructure/shared/common/logging";

export class AdsPackageAppService {
  constructor(
    private readonly adsPackageRepository: IAdsPackageRepository,
    private readonly logger: ILogger
  ) {}

  async createAdsPackage(
    adsPackageData: Omit<InsertAdsPackage, 'createdBy'>,
    createdBy: string
  ): Promise<ApiResponseInterface<{ id: string }>> {
    try {
      const adsPackage = {
        ...adsPackageData,
        createdBy,
      };

      const id = await this.adsPackageRepository.create(adsPackage);

      return ResponseBuilder.success({ id });
    } catch (error) {
      return ErrorBuilder.build(
        ErrorCode.INTERNAL_SERVER_ERROR,
        "Unexpected error while creating ads package",
        error instanceof Error ? error.message : error
      );
    }
  }

  async getAdsPackageById(id: string): Promise<ApiResponseInterface<AdsPackage | null>> {
    try {
      const adsPackage = await this.adsPackageRepository.findById(id);

      if (!adsPackage) {
        return ErrorBuilder.build(
          ErrorCode.ADS_PACKAGE_NOT_FOUND,
          `Ads package with id ${id} not found`
        );
      }

      return ResponseBuilder.success(adsPackage);
    } catch (error) {
      return ErrorBuilder.build(
        ErrorCode.INTERNAL_SERVER_ERROR,
        "Unexpected error while fetching ads package",
        error instanceof Error ? error.message : error
      );
    }
  }

  async getAllAdsPackages(params: PaginationParams): Promise<ApiResponseInterface<AdsPackage[]>> {
    try {
      const result = await this.adsPackageRepository.findAll(params);

      return ResponseBuilder.paginatedSuccess(result.data, result.pagination);
    } catch (error) {
      return ErrorBuilder.build(
        ErrorCode.INTERNAL_SERVER_ERROR,
        "Unexpected error while fetching ads packages",
        error instanceof Error ? error.message : error
      );
    }
  }

  async updateAdsPackage(
    id: string,
    adsPackageData: Partial<InsertAdsPackage>,
    updatedBy: string
  ): Promise<ApiResponseInterface<AdsPackage | null>> {
    try {
      const updateData = {
        ...adsPackageData,
        updatedBy,
        updatedAt: new Date(),
      };

      const updated = await this.adsPackageRepository.update(id, updateData);

      if (!updated) {
        return ErrorBuilder.build(
          ErrorCode.ADS_PACKAGE_NOT_FOUND,
          `Ads package with id ${id} not found`
        );
      }

      return ResponseBuilder.success(updated);
    } catch (error) {
      return ErrorBuilder.build(
        ErrorCode.INTERNAL_SERVER_ERROR,
        "Unexpected error while updating ads package",
        error instanceof Error ? error.message : error
      );
    }
  }

  async deleteAdsPackage(id: string): Promise<ApiResponseInterface<{ deleted: boolean }>> {
    try {
      const deleted = await this.adsPackageRepository.delete(id);

      if (!deleted) {
        return ErrorBuilder.build(
          ErrorCode.ADS_PACKAGE_NOT_FOUND,
          `Ads package with id ${id} not found`
        );
      }

      return ResponseBuilder.success({ deleted: true });
    } catch (error) {
      return ErrorBuilder.build(
        ErrorCode.INTERNAL_SERVER_ERROR,
        "Unexpected error while deleting ads package",
        error instanceof Error ? error.message : error
      );
    }
  }
}
