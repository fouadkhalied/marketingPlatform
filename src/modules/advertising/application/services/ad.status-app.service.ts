import { ResponseBuilder } from "../../../../infrastructure/shared/common/apiResponse/apiResponseBuilder";
import { ApiResponseInterface } from "../../../../infrastructure/shared/common/apiResponse/interfaces/apiResponse.interface";
import { UserRole } from "../../../../infrastructure/shared/common/auth/enums/userRole";
import { ErrorCode } from "../../../../infrastructure/shared/common/errors/enums/basic.error.enum";
import { ErrorBuilder } from "../../../../infrastructure/shared/common/errors/errorBuilder";
import { Ad } from "../../../../infrastructure/shared/schema/schema";
import { ApproveAdData } from "../dto/approveAdData";
import { IAdStatusRepository } from "../../domain/repositories/ad.status.repository.interface";
import { ILogger } from "../../../../infrastructure/shared/common/logging";
import { NotificationService } from "../../../../infrastructure/shared/notification/service/notification.servcie";
import { NotificationBuilder } from "../../../../infrastructure/shared/notification/builder/notification.builder";
import { NotificationModule } from "../../../../infrastructure/shared/notification/enum/notification.module.enum";
import { NotificationType } from "../../../../infrastructure/shared/notification/enum/notification.type.enum";
import { NotificationMessages } from "../../../../infrastructure/shared/notification/messages/notification.messages";

export class AdStatusAppService {
  constructor(
    private readonly adStatusRepository: IAdStatusRepository,
    private readonly logger: ILogger,
    private readonly notificationService: NotificationService
  ) {}

  async approveAd(
    id: string,
    socialMediaLinks?: ApproveAdData
  ): Promise<ApiResponseInterface<Ad>> {
    try {
      this.logger.info("Starting ad approval process", { adId: id, socialMediaLinks });

      const approvedAd = await this.adStatusRepository.approveAd(
        id,
        socialMediaLinks
      );

      this.logger.info("Ad approved successfully", { 
        adId: approvedAd.id, 
        userId: approvedAd.userId 
      });

      const adApprovedMessages = NotificationMessages[NotificationType.AD_APPROVED];
      this.notificationService.notify(
        new NotificationBuilder()
          .setUserId(approvedAd.userId)
          .setModule(NotificationModule.AD)
          .setType(NotificationType.AD_APPROVED)
          .setTitle(adApprovedMessages.title)
          .setMessage(adApprovedMessages.message)
          .addMetadata("adId", approvedAd.id)
      );

      this.logger.info("Approval notification sent", { 
        adId: approvedAd.id, 
        userId: approvedAd.userId 
      });

      return ResponseBuilder.success(approvedAd, "Ad approved successfully");
    } catch (error) {
      this.logger.error("Error while approving ad", {
        adId: id,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined
      });
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
      this.logger.info("Starting ad activation process", { adId: id, userId, role });

      if (role === UserRole.ADMIN) {
        const activatedAd = await this.adStatusRepository.activateAd(id);
        this.logger.info("Ad activated successfully by admin", { 
          adId: activatedAd.id, 
          userId: activatedAd.userId 
        });
        return ResponseBuilder.success(activatedAd, "Ad activated successfully");
      } else {
        const activatedUserAd = await this.adStatusRepository.activateUserAd(id, userId);
        this.logger.info("Ad activated successfully by user", { 
          adId: activatedUserAd.id, 
          userId: activatedUserAd.userId 
        });
        return ResponseBuilder.success(activatedUserAd, "Ad activated successfully");
      }

    } catch (error: any) {
      this.logger.error("Error while activating ad", {
        adId: id,
        userId,
        role,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined
      });
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
      this.logger.info("Starting ad rejection process", { adId: id, reason });

      const rejectedAd = await this.adStatusRepository.rejectAd(id, reason);

      this.logger.info("Ad rejected successfully", { 
        adId: rejectedAd.id, 
        userId: rejectedAd.userId,
        reason 
      });

      return ResponseBuilder.success(rejectedAd);
    } catch (error) {
      this.logger.error("Error while rejecting ad", {
        adId: id,
        reason,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined
      });
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
      this.logger.info("Starting ad deactivation process", { adId, userId, role });

      let deactivatedAd;

      if(role === UserRole.USER) {
        deactivatedAd = await this.adStatusRepository.deactivateUserAd(userId, adId);
        this.logger.info("Ad deactivated successfully by user", { 
          adId: deactivatedAd.id, 
          userId: deactivatedAd.userId 
        });
      } else {
        deactivatedAd = await this.adStatusRepository.deactivateUserAdByAdmin(userId, adId);
        this.logger.info("Ad deactivated successfully by admin", { 
          adId: deactivatedAd.id, 
          userId: deactivatedAd.userId 
        });
      }

      return ResponseBuilder.success(deactivatedAd, "Ad deactivated successfully");
    } catch (error: any) {
      this.logger.error("Error while deactivating ad", {
        adId,
        userId,
        role,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined
      });
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
