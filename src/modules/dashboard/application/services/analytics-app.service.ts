import { ResponseBuilder } from "../../../../infrastructure/shared/common/apiResponse/apiResponseBuilder";
import { ApiResponseInterface } from "../../../../infrastructure/shared/common/apiResponse/interfaces/apiResponse.interface";
import { ErrorCode } from "../../../../infrastructure/shared/common/errors/enums/basic.error.enum";
import { ErrorBuilder } from "../../../../infrastructure/shared/common/errors/errorBuilder";
import { ILogger } from "../../../../infrastructure/shared/common/logging";
import { AdAnalyticsFullDetails } from "../../../advertising/application/dtos/analytics.dto";
import { IAnalyticsRepository } from "../../../advertising/domain/repositories/analytics.repository.interface";

export class AnalyticsAppService {
  constructor(
    private readonly analyticsRepository: IAnalyticsRepository,
    private readonly logger: ILogger
  ) {}

  async getAdAnalyticsFullDetails(adId: string, userId: string): Promise<ApiResponseInterface<AdAnalyticsFullDetails>> {
    try {
      this.logger.info('Analytics service: Fetching ad analytics', { adId, userId });

      // Check ownership first
      const hasAccess = await this.analyticsRepository.checkAdOwnership(adId, userId);
      if (!hasAccess) {
        this.logger.warn('Analytics service: Ad not found or access denied', { adId, userId });
        return ErrorBuilder.build(ErrorCode.AD_NOT_FOUND, "Ad not found or access denied");
      }

      // Now fetch analytics
      const adDetails = await this.analyticsRepository.getAdAnalyticsFullDetails(adId);
      if (!adDetails) {
        this.logger.warn('Analytics service: Analytics data not found', { adId, userId });
        return ErrorBuilder.build(ErrorCode.AD_NOT_FOUND, "Ad analytics not found");
      }

      this.logger.info('Analytics service: Successfully retrieved ad analytics', { adId, userId });
      return ResponseBuilder.success(adDetails);
    } catch (error) {
      this.logger.error('Analytics service: Failed to fetch ad analytics', {
        adId,
        userId,
        error: error instanceof Error ? error.message : error
      });
      return ErrorBuilder.build(
        ErrorCode.INTERNAL_SERVER_ERROR,
        "Failed to fetch ad analytics",
        error instanceof Error ? error.message : error
      );
    }
  }
}
