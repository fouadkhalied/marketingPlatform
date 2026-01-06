// user/interfaces/controllers/ad-interaction.controller.ts
import { Request, Response } from 'express';
import { AdInteractionAppService } from "../../application/services/ad-interaction-app.service";
import { ApiResponseInterface } from '../../../../infrastructure/shared/common/apiResponse/interfaces/apiResponse.interface';
import { ERROR_STATUS_MAP } from '../../../../infrastructure/shared/common/errors/mapper/mapperErrorEnum';
import { ErrorBuilder } from '../../../../infrastructure/shared/common/errors/errorBuilder';
import { ErrorCode } from '../../../../infrastructure/shared/common/errors/enums/basic.error.enum';

export class AdInteractionController {
  constructor(
    private readonly adInteractionService: AdInteractionAppService
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

  async createAdClick(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const { forWebsite } = req.query;


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

      const forWebsiteBool = String(forWebsite).toLowerCase() === 'true';

      const result = await this.adInteractionService.createAdClick(id,"123",forWebsiteBool);
      const statusCode = this.getStatusCode(result);

      res.status(statusCode).json(result);
    } catch (err: any) {
      console.error('Error creating ad click:', err);

      res.status(500).json({
        success: false,
        message: 'Failed to record click',
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to record click',
          details: err.message
        }
      });
    }
  }
}