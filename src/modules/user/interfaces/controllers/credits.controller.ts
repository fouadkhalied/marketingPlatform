// user/interfaces/controllers/credits.controller.ts
import { Request, Response } from 'express';
import { CreditsAppService } from "../../application/services/credits-app.service";
import { ApiResponseInterface } from '../../../../infrastructure/shared/common/apiResponse/interfaces/apiResponse.interface';
import { ERROR_STATUS_MAP } from '../../../../infrastructure/shared/common/errors/mapper/mapperErrorEnum';
import { ErrorBuilder } from '../../../../infrastructure/shared/common/errors/errorBuilder';
import { ErrorCode } from '../../../../infrastructure/shared/common/errors/enums/basic.error.enum';

export class CreditsController {
  constructor(
    private readonly creditsService: CreditsAppService
  ) {}

  // Helper method to get status code from error code
  private getStatusCode(response: ApiResponseInterface<any>): number {
    if (response.success) {
      return 200;
    }

    if (response.error?.code && ERROR_STATUS_MAP[response.error.code as keyof typeof ERROR_STATUS_MAP]) {
      return ERROR_STATUS_MAP[response.error.code as keyof typeof ERROR_STATUS_MAP];
    }

    return 500; // Default to internal server error
  }

  async addCretidToUserByAdmin(req: Request, res: Response): Promise<void> {
    try {

      const {userId} = req.params;
      const credit = req.body.credit

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

      if (!credit) {
        res.status(401).json({
          success: false,
          message: "credit must be provided",
          error: {
            code: ErrorCode.VALIDATION_ERROR,
            message: "credit must be provided"
          }
        });
        return;
      }

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "userId must be provided",
          error: {
            code: ErrorCode.VALIDATION_ERROR,
            message: "userId must be provided"
          }
        });
        return;
      }

      const result = await this.creditsService.addCretidToUserByAdmin(req.user.id, parseInt(credit), userId);

      const statusCode = this.getStatusCode(result);
      res.status(statusCode).json(result);
    } catch (err: any) {
      console.error('Error updating profile:', err);

      res.status(500).json({
        success: false,
        message: 'Failed to update profile',
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update profile',
          details: err.message
        }
      });
    }
  }

  async updateFreeCredits(req: Request, res: Response): Promise<void> {
    try {
      const { credits } = req.body;
      if (!credits) {
        res.status(400).json(ErrorBuilder.build(ErrorCode.MISSING_REQUIRED_FIELD, "Credits are required"));
        return;
      }
      const result = await this.creditsService.updateFreeCredits(credits);
      const statusCode = this.getStatusCode(result);
      res.status(statusCode).json(result);
    } catch (error:any) {
      console.error('Error updating free credits:', error);
      res.status(500).json(ErrorBuilder.build(ErrorCode.INTERNAL_SERVER_ERROR, "Failed to update free credits", error.message));
    }
  }

  async getFreeCredits(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.creditsService.getFreeCredits();
      const statusCode = this.getStatusCode(result);
      res.status(statusCode).json(result);
    } catch (error:any) {
      console.error('Error getting free credits:', error);
      res.status(500).json(ErrorBuilder.build(ErrorCode.INTERNAL_SERVER_ERROR, "Failed to get free credits", error.message));
    }
  }

  // Get all available impression ratios
  async getAvailableImpressionRatios(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.creditsService.getAvailableImpressionRatios();
      const statusCode = this.getStatusCode(result);

      res.status(statusCode).json(result);
    } catch (err: any) {
      console.error('Error fetching impression ratios:', err);

      res.status(500).json({
        success: false,
        message: 'Failed to fetch impression ratios',
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch impression ratios',
          details: err.message
        }
      });
    }
  }

  // Update impression ratio (admin only)
  async updateImpressionRatio(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { impressionsPerUnit, currency } = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Impression ratio ID is required',
          error: {
            code: 'MISSING_REQUIRED_FIELD',
            message: 'Impression ratio ID is required'
          }
        });
        return;
      }

      if (!impressionsPerUnit || typeof impressionsPerUnit !== 'number') {
        res.status(400).json({
          success: false,
          message: 'Valid impressions per unit is required',
          error: {
            code: 'MISSING_REQUIRED_FIELD',
            message: 'Valid impressions per unit is required'
          }
        });
        return;
      }

      if (!currency || !['usd', 'sar'].includes(currency)) {
        res.status(400).json({
          success: false,
          message: 'Valid currency (usd or sar) is required',
          error: {
            code: 'INVALID_INPUT',
            message: 'Currency must be either "usd" or "sar"'
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

      const adminId = req.user.id;

      const result = await this.creditsService.updateImpressionRatio(
        adminId,
        id,
        impressionsPerUnit,
        currency
      );

      const statusCode = this.getStatusCode(result);
      res.status(statusCode).json(result);
    } catch (err: any) {
      console.error('Error updating impression ratio:', err);

      res.status(500).json({
        success: false,
        message: 'Failed to update impression ratio',
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update impression ratio',
          details: err.message
        }
      });
    }
  }
}