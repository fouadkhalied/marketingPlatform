import { Request, Response } from "express";
import { AnalyticsAppService } from "../../application/services/analytics-app.service";

export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsAppService) {}

  async getAdAnalyticsFullDetails(req: Request, res: Response): Promise<void> {
    try {
      const { adId } = req.params;

      if (!adId) {
        res.status(400).json({
          success: false,
          message: "Ad ID is required",
          error: {
            code: "VALIDATION_ERROR",
            message: "Ad ID is required"
          }
        });
        return;
      }

      const result = await this.analyticsService.getAdAnalyticsFullDetails(adId);

      const statusCode = this.getStatusCode(result);
      res.status(statusCode).json(result);
    } catch (err: any) {
      console.error('Error fetching ad analytics:', err);

      res.status(500).json({
        success: false,
        message: 'Failed to fetch ad analytics',
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch ad analytics',
          details: err.message
        }
      });
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
