import { Request, Response } from "express";
import { AnalyticsAppService } from "../../application/services/analytics-app.service";
import { ErrorBuilder } from "../../../../infrastructure/shared/common/errors/errorBuilder";
import { ErrorCode } from "../../../../infrastructure/shared/common/errors/enums/basic.error.enum";

export class AnalyticsAdController {
  constructor(private readonly analyticsService: AnalyticsAppService) {}

  async getAdAnalyticsFullDetails(req: Request, res: Response): Promise<void> {
    try {
      // Check if user is authenticated
      if (!req.user?.id) {
        const errorResponse = ErrorBuilder.build(
          ErrorCode.UNAUTHORIZED,
          "User must be authenticated"
        );
        res.status(401).json(errorResponse);
        return;
      }

      const { adId } = req.params;
      const userId = req.user.id;

      console.log('Analytics controller: Requesting ad analytics', { adId, userId });

      // Validate adId
      if (!adId) {
        const errorResponse = ErrorBuilder.build(
          ErrorCode.MISSING_REQUIRED_FIELD,
          "Ad ID is required"
        );
        res.status(400).json(errorResponse);
        return;
      }

      const result = await this.analyticsService.getAdAnalyticsFullDetails(adId, userId);
      const statusCode = this.getStatusCode(result);

      console.log('Analytics controller: Analytics request completed', { adId, userId, success: result.success, statusCode });

      res.status(statusCode).json(result);
    } catch (err: any) {
      console.error('Analytics controller: Error getting ad analytics full details:', {
        adId: req.params.adId,
        userId: req.user?.id,
        error: err.message
      });

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