import { ResponseBuilder } from "../../../../infrastructure/shared/common/apiResponse/apiResponseBuilder";
import { ApiResponseInterface } from "../../../../infrastructure/shared/common/apiResponse/interfaces/apiResponse.interface";
import { ErrorCode } from "../../../../infrastructure/shared/common/errors/enums/basic.error.enum";
import { ErrorBuilder } from "../../../../infrastructure/shared/common/errors/errorBuilder";
import { AdminImpressionRatio } from "../../../../infrastructure/shared/schema/schema";
import { UserCreditsRepository } from "../../infrastructure/repositories/UserCreditsRepository";
import { ImpressionRatioRepository } from "../../infrastructure/repositories/ImpressionRatioRepository";
import { ILogger } from "../../../../infrastructure/shared/common/logging";

export class CreditsAppService {
  constructor(
    private readonly creditsRepository: UserCreditsRepository,
    private readonly impressionRatioRepository: ImpressionRatioRepository,
    private readonly logger: ILogger
  ) {}

  async addCretidToUserByAdmin(id:string, credit:number, userId: string):Promise<ApiResponseInterface<boolean>> {
    try {
      this.logger.info('Adding credit to user by admin', { adminId: id, userId, credit });

      const result = await this.creditsRepository.addCretidToUserByAdmin(credit, userId);

      this.logger.info('Credit added to user successfully', { adminId: id, userId, credit });
      return ResponseBuilder.success(result);
    } catch (error) {
      const err = error as Error;
      this.logger.error('Error adding credit to user', { error: err.message, adminId: id, userId, credit });
      return ErrorBuilder.build(ErrorCode.INTERNAL_SERVER_ERROR, "Failed to add credit to user");
    }
  }

  async updateFreeCredits(credits: number): Promise<ApiResponseInterface<boolean>> {
    try {
      this.logger.info('Updating free credits', { credits });

      const result = await this.creditsRepository.updateFreeCredits(credits);

      this.logger.info('Free credits updated successfully', { credits });
      return ResponseBuilder.success(result, "Free credits updated successfully");
    } catch (error) {
      const err = error as Error;
      this.logger.error('Error updating free credits', { error: err.message, credits });
      return ErrorBuilder.build(ErrorCode.INTERNAL_SERVER_ERROR, "Failed to update free credits");
    }
  }

  async getFreeCredits(): Promise<ApiResponseInterface<number>> {
    try {
      this.logger.info('Getting free credits');

      const result = await this.creditsRepository.getFreeCredits();

      this.logger.info('Free credits retrieved successfully', { credits: result });
      return ResponseBuilder.success(result, "Free credits retrieved successfully");
    } catch (error) {
      const err = error as Error;
      this.logger.error('Error getting free credits', { error: err.message });
      return ErrorBuilder.build(ErrorCode.INTERNAL_SERVER_ERROR, "Failed to get free credits");
    }
  }

  // Get all available impression ratios
  async getAvailableImpressionRatios(): Promise<ApiResponseInterface<AdminImpressionRatio[]>> {
    try {
      this.logger.info('Getting available impression ratios');

      const ratios = await this.impressionRatioRepository.getAvaialbeImpressionRatios();

      this.logger.info('Impression ratios retrieved successfully', { count: ratios.length });
      return ResponseBuilder.success(ratios, "Impression ratios retrieved successfully");
    } catch (error: any) {
      const err = error as Error;
      this.logger.error('Error fetching impression ratios', { error: err.message });
      if (error.code && error.message) {
        return error;
      }
      return ErrorBuilder.build(
        ErrorCode.INTERNAL_SERVER_ERROR,
        err.message || "Failed to fetch impression ratios"
      );
    }
  }

  // Update impression ratio (admin only)
  async updateImpressionRatio(
    adminId: string,
    id: string,
    impressionsPerUnit: number,
    currency: "usd" | "sar"
  ): Promise<ApiResponseInterface<AdminImpressionRatio>> {
    try {
      this.logger.info('Updating impression ratio', { adminId, ratioId: id, impressionsPerUnit, currency });

      const updatedRatio = await this.impressionRatioRepository.updateImpressionRatio(
        adminId,
        id,
        impressionsPerUnit,
        currency
      );

      this.logger.info('Impression ratio updated successfully', { adminId, ratioId: id });
      return ResponseBuilder.success(updatedRatio, "Impression ratio updated successfully");
    } catch (error: any) {
      this.logger.error('Error updating impression ratio', { error: error.message, adminId, ratioId: id });
      if (error.code && error.message) {
        return error;
      }
      return ErrorBuilder.build(
        ErrorCode.INTERNAL_SERVER_ERROR,
        error.message || "Failed to update impression ratio"
      );
    }
  }
}