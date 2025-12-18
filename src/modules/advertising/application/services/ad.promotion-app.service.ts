import { ResponseBuilder } from "../../../../infrastructure/shared/common/apiResponse/apiResponseBuilder";
import { ApiResponseInterface } from "../../../../infrastructure/shared/common/apiResponse/interfaces/apiResponse.interface";
import { ErrorCode } from "../../../../infrastructure/shared/common/errors/enums/basic.error.enum";
import { ErrorBuilder } from "../../../../infrastructure/shared/common/errors/errorBuilder";
import { Ad } from "../../../../infrastructure/shared/schema/schema";
import { IAdPromotionRepository } from "../../domain/repositories/ad.promotion.repository.interface";

export class AdPromotionAppService {
  constructor(
    private readonly adPromotionRepository: IAdPromotionRepository
  ) {}

  async assignCreditToAd(
    userId: string,
    adId: string,
    credit: number
  ): Promise<ApiResponseInterface<{ success: boolean; adId: string; credit: number }>> {
    try {
      // 1. Check if user has enough balance
      const hasBalance = await this.adPromotionRepository.hasSufficientBalance(userId, credit);
      if (!hasBalance) {
        return ErrorBuilder.build(
          ErrorCode.INSUFFICIENT_BALANCE,
          `User ${userId} does not have enough balance to assign ${credit} credits`
        );
      }

      // 2. Run transaction (repo handles atomicity)
      const result = await this.adPromotionRepository.assignCreditToAd(userId, adId, credit);

      if (!result) {
        return ErrorBuilder.build(
          ErrorCode.DATABASE_ERROR,
          "Failed to assign credit to ad"
        );
      }

      return ResponseBuilder.success({
        success: true,
        adId,
        credit,
      });
    } catch (error) {
      return ErrorBuilder.build(
        ErrorCode.INTERNAL_SERVER_ERROR,
        "Unexpected error while assigning credit to ad",
        error instanceof Error ? error.message : error
      );
    }
  }

  async promoteAd(
    userId: string,
    adId: string
  ): Promise<ApiResponseInterface<Ad>> {
    try {
      const promoteAd = await this.adPromotionRepository.promoteAd(adId,userId)
      return ResponseBuilder.success(promoteAd, "Ad promoted successfully");
    } catch (error: any) {
      if (error.code && error.message) {
        return error;
      }

      return ErrorBuilder.build(
        ErrorCode.INTERNAL_SERVER_ERROR,
        error.message || "Failed to deactivate ad"
      );
    }
  }

  async dePromoteAd(
    userId: string,
    adId: string
  ): Promise<ApiResponseInterface<Ad>> {
    try {
      const promoteAd = await this.adPromotionRepository.dePromoteAd(adId,userId)
      return ResponseBuilder.success(promoteAd, "Ad de promoted successfully");
    } catch (error: any) {
      if (error.code && error.message) {
        return error;
      }

      return ErrorBuilder.build(
        ErrorCode.INTERNAL_SERVER_ERROR,
        error.message || "Failed to deactivate ad"
      );
    }
  }
}
