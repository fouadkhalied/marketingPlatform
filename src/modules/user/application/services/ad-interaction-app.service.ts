import { ResponseBuilder } from "../../../../infrastructure/shared/common/apiResponse/apiResponseBuilder";
import { ApiResponseInterface } from "../../../../infrastructure/shared/common/apiResponse/interfaces/apiResponse.interface";
import { ErrorCode } from "../../../../infrastructure/shared/common/errors/enums/basic.error.enum";
import { ErrorBuilder } from "../../../../infrastructure/shared/common/errors/errorBuilder";
import { AdInteractionRepository } from "../../infrastructure/repositories/AdInteractionRepository";
import { ILogger } from "../../../../infrastructure/shared/common/logging";

export class AdInteractionAppService {
  constructor(
    private readonly adInteractionRepository: AdInteractionRepository,
    private readonly logger: ILogger
  ) {}

  async createAdClick(
    adId: string,
    userId: string,
    forWebsite: boolean
  ): Promise<ApiResponseInterface<string>> {
    try {
      this.logger.info('Creating ad click', { adId, userId, forWebsite });

      await this.adInteractionRepository.createAdClick(adId, userId, forWebsite);

      this.logger.info('Ad click recorded successfully', { adId, userId, forWebsite });
      return ResponseBuilder.success("Click recorded successfully");
    } catch (error: any) {
      this.logger.error('Error creating ad click', { error: error.message, adId, userId });

      // Handle specific error for duplicate click
      if (error.message === "USER_ALREADY_CLICKED") {
        return ErrorBuilder.build(
          ErrorCode.DUPLICATE_ENTRY,
          "User already clicked this ad"
        );
      }

      return ErrorBuilder.build(
        ErrorCode.INTERNAL_SERVER_ERROR,
        "Failed to record click",
        error.message || "Unknown error"
      );
    }
  }
}