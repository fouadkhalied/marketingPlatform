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

  async getAdAnalyticsFullDetails(adId: string): Promise<ApiResponseInterface<AdAnalyticsFullDetails>> {
    try {
      const adDetails = await this.analyticsRepository.getAdAnalyticsFullDetails(adId);
      if (!adDetails) {
        return ErrorBuilder.build(ErrorCode.AD_NOT_FOUND, "Ad not found");
      }

      return ResponseBuilder.success(adDetails);
    } catch (error) {
      return ErrorBuilder.build(
        ErrorCode.INTERNAL_SERVER_ERROR,
        "Failed to fetch ad analytics",
        error instanceof Error ? error.message : error
      );
    }
  }
}
