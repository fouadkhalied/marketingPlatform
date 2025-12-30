import { Request, Response } from "express";
import { AnalyticsAppService } from "../../application/services/analytics-app.service";
import { ErrorBuilder } from "../../../../infrastructure/shared/common/errors/errorBuilder";
import { ErrorCode } from "../../../../infrastructure/shared/common/errors/enums/basic.error.enum";

export class AnalyticsAdController {
  constructor(private readonly analyticsService: AnalyticsAppService) {}

  async getAdAnalyticsFullDetails(req: Request, res: Response): Promise<void> {
    try {
      const { adId } = req.params;
      const result = await this.analyticsService.getAdAnalyticsFullDetails(adId);
      const statusCode = this.getStatusCode(result);

      res.status(statusCode).json(result);
    } catch (err: any) {
      console.error('Error getting ad analytics full details:', err);

      const errorResponse = ErrorBuilder.build(
        ErrorCode.INTERNAL_SERVER_ERROR,
        "Failed to get ad analytics full details",
        err.message
      );

      res.status(500).json(errorResponse);
    }
  }

  private getStatusCode(result: any): number {
    if (result.success) {
      return 200;
    }

    // Check error codes for appropriate HTTP status
    switch (result.error?.code) {
      case 'UNAUTHORIZED':
        return 401;
      case 'FORBIDDEN':
        return 403;
      case 'NOT_FOUND':
        return 404;
      case 'VALIDATION_ERROR':
        return 400;
      default:
        return 500;
    }
  }
}