import { Request, Response } from "express";
import { ApiResponseInterface } from "../../../../infrastructure/shared/common/apiResponse/interfaces/apiResponse.interface";
import { ERROR_STATUS_MAP } from "../../../../infrastructure/shared/common/errors/mapper/mapperErrorEnum";
import { ErrorBuilder } from "../../../../infrastructure/shared/common/errors/errorBuilder";
import { ErrorCode } from "../../../../infrastructure/shared/common/errors/enums/basic.error.enum";
import { UserRole } from "../../../../infrastructure/shared/common/auth/enums/userRole";
import { ApproveAdData } from "../../application/dto/approveAdData";
import { AdStatusAppService } from "../../application/services/ad.status-app.service";

export class AdStatusController {
  constructor(private readonly adStatusService: AdStatusAppService) {}

  // ✅ Helper method to get status code from error code
  private getStatusCode(response: ApiResponseInterface<any>): number {
    if (response.success) {
      return 200;
    }
    if (
      response.error?.code &&
      ERROR_STATUS_MAP[response.error.code as keyof typeof ERROR_STATUS_MAP]
    ) {
      return ERROR_STATUS_MAP[
        response.error.code as keyof typeof ERROR_STATUS_MAP
      ];
    }
    return 500; // default to internal server error
  }

  // Approve Ad (Admin only)
  async approveAd(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user?.id || req.user.role !== UserRole.ADMIN) {
        const errorResponse = ErrorBuilder.build(
          ErrorCode.FORBIDDEN,
          "Only admins can approve ads"
        );
        res.status(403).json(errorResponse);
        return;
      }

      const { id } = req.params;
      const socialMediaLinks = req.body;

      // Filter out undefined/null values and only pass valid links
      const validLinks: ApproveAdData = {};
      if (socialMediaLinks?.tiktokLink) validLinks.tiktokLink = socialMediaLinks.tiktokLink;
      if (socialMediaLinks?.youtubeLink) validLinks.youtubeLink = socialMediaLinks.youtubeLink;
      if (socialMediaLinks?.googleAdsLink) validLinks.googleAdsLink = socialMediaLinks.googleAdsLink;
      if (socialMediaLinks?.instagramLink) validLinks.instagramLink = socialMediaLinks.instagramLink;
      if (socialMediaLinks?.facebookLink) validLinks.facebookLink = socialMediaLinks.facebookLink;
      if (socialMediaLinks?.snapchatLink) validLinks.snapchatLink = socialMediaLinks.snapchatLink;

      const result = await this.adStatusService.approveAd(
        id,
        Object.keys(validLinks).length > 0 ? validLinks : undefined
      );

      const statusCode = this.getStatusCode(result);
      res.status(statusCode).json(result);
    } catch (error: any) {
      console.error("Error approving ad:", error);

      res.status(500).json({
        success: false,
        message: "Failed to approve ad",
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to approve ad",
          details: error.message
        }
      });
    }
  }

  // Reject Ad (Admin only)
  async rejectAd(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user?.id || req.user.role !== UserRole.ADMIN) {
        res.status(401).json({ error: "Forbidden: Admin access required" });
        return;
      }

      const { reason } = req.body;
      const result = await this.adStatusService.rejectAd(req.params.id, reason);

      const statusCode = this.getStatusCode(result);
      res.status(statusCode).json(result);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to reject ad", message: error.message });
    }
  }

  // activate ad
  async avctivateAd(req: Request, res: Response): Promise<void> {
    try {

      if (!req.user?.id) {
        res.status(403).json(ErrorBuilder.build(ErrorCode.UNAUTHORIZED, "user unauthorized"));
        return;
      }

      if (!req.params.id) {
        res.status(404).json(ErrorBuilder.build(ErrorCode.MISSING_REQUIRED_FIELD, "ad id must be provided"));
        return;
      }

      const result = await this.adStatusService.activateAd(req.params.id, req.user.id ,req.user.role);

      const statusCode = this.getStatusCode(result);
      res.status(statusCode).json(result);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to reject ad", message: error.message });
    }
  }

  async deactivateUserAd(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Ad ID is required',
          error: {
            code: 'MISSING_REQUIRED_FIELD',
            message: 'Ad ID is required'
          }
        });
        return;
      }

      if (!req.user?.id) {
        res.status(401).json({
          success: false,
          message: "User must be authenticated",
          error: {
            code: "UNAUTHORIZED",
            message: "User must be authenticated"
          }
        });
        return;
      }

      const userId = req.user.id;
      const role = req.user.role;

      const result = await this.adStatusService.deactivateUserAd(userId, id, role);
      const statusCode = this.getStatusCode(result);

      res.status(statusCode).json(result);
    } catch (err: any) {
      console.error('Error deactivating ad:', err);

      res.status(500).json({
        success: false,
        message: 'Failed to deactivate ad',
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to deactivate ad',
          details: err.message
        }
      });
    }
  }
}
