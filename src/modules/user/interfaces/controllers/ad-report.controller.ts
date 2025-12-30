// user/interfaces/controllers/ad-report.controller.ts
import { Request, Response } from 'express';
import { AdReportAppService } from "../../application/services/ad-report-app.service";
import { ApiResponseInterface } from '../../../../infrastructure/shared/common/apiResponse/interfaces/apiResponse.interface';
import { ERROR_STATUS_MAP } from '../../../../infrastructure/shared/common/errors/mapper/mapperErrorEnum';
import { PaginationParams } from '../../../../infrastructure/shared/common/pagination.vo';
import { ErrorBuilder } from '../../../../infrastructure/shared/common/errors/errorBuilder';
import { ErrorCode } from '../../../../infrastructure/shared/common/errors/enums/basic.error.enum';

export class AdReportController {
  constructor(
    private readonly adReportService: AdReportAppService
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

  async createAdReport(req: Request, res: Response): Promise<void> {
    try {
      const { adId, email, username, phoneNumber, reportDescription } = req.body;
      if (!adId) {
        res.status(400).json(ErrorBuilder.build(ErrorCode.MISSING_REQUIRED_FIELD, "Ad ID is required"));
        return;
      }
      // if (!email) {
      //   res.status(400).json(ErrorBuilder.build(ErrorCode.MISSING_REQUIRED_FIELD, "Email is required"));
      //   return;
      // }
      // if (!username) {
      //   res.status(400).json(ErrorBuilder.build(ErrorCode.MISSING_REQUIRED_FIELD, "Username is required"));
      //   return;
      // }
      // if (!phoneNumber) {
      //   res.status(400).json(ErrorBuilder.build(ErrorCode.MISSING_REQUIRED_FIELD, "Phone number is required"));
      //   return;
      // }
      if (!reportDescription) {
        res.status(400).json(ErrorBuilder.build(ErrorCode.MISSING_REQUIRED_FIELD, "Report description is required"));
        return;
      }
      const result = await this.adReportService.createAdReport(adId, email, username, phoneNumber, reportDescription);
      const statusCode = this.getStatusCode(result);
      res.status(statusCode).json(result);
    } catch (error:any) {
      console.error('Error creating ad report:', error);
      res.status(500).json(ErrorBuilder.build(ErrorCode.INTERNAL_SERVER_ERROR, "Failed to create ad report", error.message));
    }
  }

  async getAdReports(req: Request, res: Response): Promise<void> {
    try {
      const { page, limit } = req.query;
      const pagination: PaginationParams = {
        page: page && !isNaN(Number(page)) && Number(page) > 0 ? Number(page) : 1,
        limit: limit && !isNaN(Number(limit)) && Number(limit) > 0 ? Number(limit) : 10,
      };
      const result = await this.adReportService.getAdReports(pagination);
      const statusCode = this.getStatusCode(result);
      res.status(statusCode).json(result);
    } catch (error:any) {
      console.error('Error getting ad reports:', error);
      res.status(500).json(ErrorBuilder.build(ErrorCode.INTERNAL_SERVER_ERROR, "Failed to get ad reports", error.message));
    }
  }
}