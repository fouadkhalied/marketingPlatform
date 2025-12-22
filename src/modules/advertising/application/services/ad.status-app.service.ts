import { ResponseBuilder } from "../../../../infrastructure/shared/common/apiResponse/apiResponseBuilder";
import { ApiResponseInterface } from "../../../../infrastructure/shared/common/apiResponse/interfaces/apiResponse.interface";
import { UserRole } from "../../../../infrastructure/shared/common/auth/enums/userRole";
import { ErrorCode } from "../../../../infrastructure/shared/common/errors/enums/basic.error.enum";
import { ErrorBuilder } from "../../../../infrastructure/shared/common/errors/errorBuilder";
import { Ad } from "../../../../infrastructure/shared/schema/schema";
import { ApproveAdData } from "../dto/approveAdData";
import { IAdStatusRepository } from "../../domain/repositories/ad.status.repository.interface";
import { ILogger } from "../../../../infrastructure/shared/common/logging";

export class AdStatusAppService {
  constructor(
    private readonly adStatusRepository: IAdStatusRepository,
    private readonly logger: ILogger
  ) {}

  async approveAd(
    id: string,
    socialMediaLinks?: ApproveAdData
  ): Promise<ApiResponseInterface<Ad>> {
    try {
      const approvedAd = await this.adStatusRepository.approveAd(
        id,
        socialMediaLinks
      );

      return ResponseBuilder.success(approvedAd, "Ad approved successfully");
    } catch (error) {
      return ErrorBuilder.build(
        ErrorCode.INTERNAL_SERVER_ERROR,
        "Unexpected error while approving ad",
        error instanceof Error ? error.message : error
      );
    }
  }

  async activateAd(
    id: string,
    userId: string,
    role: string
  ): Promise<ApiResponseInterface<Ad>> {
    try {

      if (role === UserRole.ADMIN) {
        const activatedAd = await this.adStatusRepository.activateAd(id);
        return ResponseBuilder.success(activatedAd, "Ad activated successfully");
      } else {
        const activatedUserAd = await this.adStatusRepository.activateUserAd(id, userId);
        return ResponseBuilder.success(activatedUserAd, "Ad activated successfully");
      }

    } catch (error: any) {
      // If it's already an ErrorBuilder error, return it as-is
      if (error.code && error.message) {
        return error;
      }

      // Otherwise, wrap it in a generic error
      return ErrorBuilder.build(
        ErrorCode.INTERNAL_SERVER_ERROR,
        error.message || "Failed to activate ad"
      );
    }
  }

  async rejectAd(id: string, reason?: string): Promise<ApiResponseInterface<Ad>> {
    try {
      const rejectedAd = await this.adStatusRepository.rejectAd(id, reason);

      return ResponseBuilder.success(rejectedAd);
    } catch (error) {
      return ErrorBuilder.build(
        ErrorCode.INTERNAL_SERVER_ERROR,
        "Unexpected error while rejecting ad",
        error instanceof Error ? error.message : error
      );
    }
  }

  async deactivateUserAd(
    userId: string,
    adId: string,
    role: string
  ): Promise<ApiResponseInterface<Ad>> {
    try {

      let deactivatedAd;

      if(role === UserRole.USER)
       deactivatedAd = await this.adStatusRepository.deactivateUserAd(userId, adId);
     else
      deactivatedAd = await this.adStatusRepository.deactivateUserAdByAdmin(userId, adId)

      return ResponseBuilder.success(deactivatedAd, "Ad deactivated successfully");
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
