import { ResponseBuilder } from "../../../../infrastructure/shared/common/apiResponse/apiResponseBuilder";
import { ApiResponseInterface } from "../../../../infrastructure/shared/common/apiResponse/interfaces/apiResponse.interface";
import { ErrorCode } from "../../../../infrastructure/shared/common/errors/enums/basic.error.enum";
import { ErrorBuilder } from "../../../../infrastructure/shared/common/errors/errorBuilder";
import { PaginationParams } from "../../../../infrastructure/shared/common/pagination.vo";
import { AdReportRepository } from "../../infrastructure/repositories/AdReportRepository";
import { AdsReport } from "../dtos/ads-report.dto";
import { ILogger } from "../../../../infrastructure/shared/common/logging";

export class AdReportAppService {
  constructor(
    private readonly adReportRepository: AdReportRepository,
    private readonly logger: ILogger
  ) {}

  async createAdReport(adId: string, email: string, username: string, phoneNumber: string, reportDescription: string): Promise<ApiResponseInterface<boolean>> {
    try {
      this.logger.info('Creating ad report', { adId, email, username });

      const result = await this.adReportRepository.createAdReport(adId, email, username, phoneNumber, reportDescription);

      this.logger.info('Ad report created successfully', { adId, email });
      return ResponseBuilder.success(result, "Ad report created successfully");
    } catch (error) {
      const err = error as Error;
      this.logger.error('Error creating ad report', { error: err.message, adId, email });
      return ErrorBuilder.build(ErrorCode.INTERNAL_SERVER_ERROR, "Failed to create ad report");
    }
  }

  async getAdReports(pagination: PaginationParams): Promise<ApiResponseInterface<AdsReport[]>> {
    try {
      this.logger.info('Getting ad reports', { pagination });

      const result = await this.adReportRepository.getAdReports(pagination);

      this.logger.info('Ad reports retrieved successfully', { count: result.data.length });
      return ResponseBuilder.paginatedSuccess(result.data, result.pagination);
    } catch (error) {
      const err = error as Error;
      this.logger.error('Error getting ad reports', { error: err.message });
      return ErrorBuilder.build(ErrorCode.INTERNAL_SERVER_ERROR, "Failed to get ad reports");
    }
  }
}