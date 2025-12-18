import { Request, Response } from "express";
import { ApiResponseInterface } from "../../../../infrastructure/shared/common/apiResponse/interfaces/apiResponse.interface";
import { ERROR_STATUS_MAP } from "../../../../infrastructure/shared/common/errors/mapper/mapperErrorEnum";
import { ErrorBuilder } from "../../../../infrastructure/shared/common/errors/errorBuilder";
import { ErrorCode } from "../../../../infrastructure/shared/common/errors/enums/basic.error.enum";
import { AdPromotionAppService } from "../../application/services/ad.promotion-app.service";

export class AdPromotionController {
  constructor(private readonly adPromotionService: AdPromotionAppService) {}

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

  // ✅ Assign credit to an Ad (deduct from user balance + add to ad)
  async assignCreditToAd(req: Request, res: Response): Promise<void> {
    try {

      if (!req.user?.id) {
        res.status(401).json({ error: "User not authenticated" });
        return;
      }

      const adId = req.params.id;
      const { credit , budgetType} = req.body;

      // Validate Ad ID (must be non-empty string)
      if (!adId || typeof adId !== "string" || adId.trim().length === 0) {
        const errorResponse = ErrorBuilder.build(
          ErrorCode.VALIDATION_ERROR,
          "Valid adId is required in URL"
        );
        res.status(400).json(errorResponse);
        return;
      }

      // Validate credit (must be positive number)
      if (!credit || isNaN(Number(credit)) || Number(credit) <= 0) {
        const errorResponse = ErrorBuilder.build(
          ErrorCode.VALIDATION_ERROR,
          "Positive credit amount is required"
        );
        res.status(400).json(errorResponse);
        return;
      }

      const result = await this.adPromotionService.assignCreditToAd(
        req.user.id,
        adId,
        Number(credit)
      );

      const statusCode = this.getStatusCode(result);
      res.status(statusCode).json(result);
    } catch (error: any) {
      res.status(500).json({
        error: "Failed to assign credit to ad",
        message: error.message,
      });
    }
  }

  async promoteAd(req: Request, res: Response): Promise<void> {
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

      const result = await this.adPromotionService.promoteAd(userId,id);
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


  async depromoteAd(req: Request, res: Response): Promise<void> {
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

      const result = await this.adPromotionService.dePromoteAd(userId,id);
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
