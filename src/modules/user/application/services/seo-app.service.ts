import { ResponseBuilder } from "../../../../infrastructure/shared/common/apiResponse/apiResponseBuilder";
import { ApiResponseInterface } from "../../../../infrastructure/shared/common/apiResponse/interfaces/apiResponse.interface";
import { ErrorCode } from "../../../../infrastructure/shared/common/errors/enums/basic.error.enum";
import { ErrorBuilder } from "../../../../infrastructure/shared/common/errors/errorBuilder";
import { SeoRepositoryImpl } from "../../infrastructure/repositories/seo.repository.impl";
import { ILogger } from "../../../../infrastructure/shared/common/logging";

export class SeoAppService {
  constructor(
    private readonly seoRepository: SeoRepositoryImpl,
    private readonly logger: ILogger
  ) {}

  async getAllSeoVariables(): Promise<ApiResponseInterface<any>> {
    try {
      this.logger.info('Getting all SEO variables');

      const result = await this.seoRepository.getAllSeoVariables();

      this.logger.info('SEO variables retrieved successfully', { count: result.length });
      return ResponseBuilder.success(result);
    } catch (error: any) {
      this.logger.error('Error getting SEO variables', { error: error.message });
      return ErrorBuilder.build(
        ErrorCode.INTERNAL_SERVER_ERROR,
        "Failed to fetch SEO variables",
        error instanceof Error ? error.message : error
      );
    }
  }

  async getSeoVariableById(id: string): Promise<ApiResponseInterface<any>> {
    try {
      this.logger.info('Getting SEO variable by ID', { id });

      if (!id) {
        this.logger.warn('SEO variable ID is required');
        return ErrorBuilder.build(
          ErrorCode.MISSING_REQUIRED_FIELD,
          "SEO variable ID is required"
        );
      }

      const result = await this.seoRepository.getSeoVariableById(id);

      this.logger.info('SEO variable retrieved successfully', { id });
      return ResponseBuilder.success(result);
    } catch (error: any) {
      this.logger.error('Error getting SEO variable', { error: error.message, id });
      return ErrorBuilder.build(
        ErrorCode.INTERNAL_SERVER_ERROR,
        "Failed to fetch SEO variable",
        error instanceof Error ? error.message : error
      );
    }
  }

  async createSeoVariable(data: any): Promise<ApiResponseInterface<any>> {
    try {
      this.logger.info('Creating SEO variable', { title: data.title });

      const { title, description, tag_line } = data;

      if (!title || !description || !tag_line) {
        this.logger.warn('Missing required fields for SEO variable creation');
        return ErrorBuilder.build(
          ErrorCode.MISSING_REQUIRED_FIELD,
          "Title, description, and tag_line are required"
        );
      }

      const result = await this.seoRepository.createSeoVariable(data);

      this.logger.info('SEO variable created successfully', { title });
      return ResponseBuilder.success(result, "SEO variable created successfully");
    } catch (error: any) {
      this.logger.error('Error creating SEO variable', { error: error.message });
      return ErrorBuilder.build(
        ErrorCode.INTERNAL_SERVER_ERROR,
        "Failed to create SEO variable",
        error instanceof Error ? error.message : error
      );
    }
  }

  async updateSeoVariable(id: string, data: any): Promise<ApiResponseInterface<any>> {
    try {
      this.logger.info('Updating SEO variable', { id });

      if (!id) {
        this.logger.warn('SEO variable ID is required');
        return ErrorBuilder.build(
          ErrorCode.MISSING_REQUIRED_FIELD,
          "SEO variable ID is required"
        );
      }

      const result = await this.seoRepository.updateSeoVariable(id, data);

      this.logger.info('SEO variable updated successfully', { id });
      return ResponseBuilder.success(result, "SEO variable updated successfully");
    } catch (error: any) {
      this.logger.error('Error updating SEO variable', { error: error.message, id });
      return ErrorBuilder.build(
        ErrorCode.INTERNAL_SERVER_ERROR,
        "Failed to update SEO variable",
        error instanceof Error ? error.message : error
      );
    }
  }

  async deleteSeoVariable(id: string): Promise<ApiResponseInterface<any>> {
    try {
      this.logger.info('Deleting SEO variable', { id });

      if (!id) {
        this.logger.warn('SEO variable ID is required');
        return ErrorBuilder.build(
          ErrorCode.MISSING_REQUIRED_FIELD,
          "SEO variable ID is required"
        );
      }

      const result = await this.seoRepository.deleteSeoVariable(id);

      this.logger.info('SEO variable deleted successfully', { id });
      return ResponseBuilder.success(result, "SEO variable deleted successfully");
    } catch (error: any) {
      this.logger.error('Error deleting SEO variable', { error: error.message, id });
      return ErrorBuilder.build(
        ErrorCode.INTERNAL_SERVER_ERROR,
        "Failed to delete SEO variable",
        error instanceof Error ? error.message : error
      );
    }
  }
}