import { ResponseBuilder } from "../../../../infrastructure/shared/common/apiResponse/apiResponseBuilder";
import { ApiResponseInterface } from "../../../../infrastructure/shared/common/apiResponse/interfaces/apiResponse.interface";
import { ErrorCode } from "../../../../infrastructure/shared/common/errors/enums/basic.error.enum";
import { ErrorBuilder } from "../../../../infrastructure/shared/common/errors/errorBuilder";
import { SeoVariable, CreateSeoVariable } from "../../../../infrastructure/shared/schema/schema";
import { SeoRepositoryImpl } from "../../infrastructure/repositories/seo.repository.impl";

export class SeoAppService {
  constructor(
    private readonly seoRepository: SeoRepositoryImpl
  ) {}

  // Get all SEO variables
  async getAllSeoVariables(): Promise<ApiResponseInterface<SeoVariable[]>> {
    try {
      const variables = await this.seoRepository.getAllSeoVariables();
      return ResponseBuilder.success(variables, "SEO variables retrieved successfully");
    } catch (error: any) {
      if (error.code && error.message) {
        return error;
      }
      return ErrorBuilder.build(
        ErrorCode.INTERNAL_SERVER_ERROR,
        error.message || "Failed to fetch SEO variables"
      );
    }
  }

  // Get SEO variable by ID
  async getSeoVariableById(id: string): Promise<ApiResponseInterface<SeoVariable>> {
    try {
      const variable = await this.seoRepository.getSeoVariableById(id);
      
      if (!variable) {
        return ErrorBuilder.build(ErrorCode.SEO_NOT_FOUND, "SEO variable not found");
      }

      return ResponseBuilder.success(variable, "SEO variable retrieved successfully");
    } catch (error: any) {
      if (error.code && error.message) {
        return error;
      }
      return ErrorBuilder.build(
        ErrorCode.INTERNAL_SERVER_ERROR,
        error.message || "Failed to fetch SEO variable"
      );
    }
  }

  // Create SEO variable
  async createSeoVariable(data: CreateSeoVariable): Promise<ApiResponseInterface<SeoVariable>> {
    try {
      // Validate required fields
      if (!data.title || !data.description || !data.tag_line) {
        return ErrorBuilder.build(
          ErrorCode.VALIDATION_ERROR,
          "Title, description, and tag_line are required"
        );
      }

      const variable = await this.seoRepository.createSeoVariable(data);
      return ResponseBuilder.success(variable, "SEO variable created successfully");
    } catch (error: any) {
      if (error.code && error.message) {
        return error;
      }
      return ErrorBuilder.build(
        ErrorCode.INTERNAL_SERVER_ERROR,
        error.message || "Failed to create SEO variable"
      );
    }
  }

  // Update SEO variable
  async updateSeoVariable(
    id: string,
    updates: Partial<CreateSeoVariable>
  ): Promise<ApiResponseInterface<SeoVariable>> {
    try {
      // Check if at least one field is provided
      if (!updates.title && !updates.description && !updates.tag_line) {
        return ErrorBuilder.build(
          ErrorCode.VALIDATION_ERROR,
          "At least one field (title, description, or tag_line) must be provided"
        );
      }

      const variable = await this.seoRepository.updateSeoVariable(id, updates);
      return ResponseBuilder.success(variable, "SEO variable updated successfully");
    } catch (error: any) {
      if (error.code && error.message) {
        return error;
      }
      return ErrorBuilder.build(
        ErrorCode.INTERNAL_SERVER_ERROR,
        error.message || "Failed to update SEO variable"
      );
    }
  }

  // Delete SEO variable
  async deleteSeoVariable(id: string): Promise<ApiResponseInterface<null>> {
    try {
      const deleted = await this.seoRepository.deleteSeoVariable(id);

      if (!deleted) {
        return ErrorBuilder.build(ErrorCode.SEO_NOT_FOUND, "SEO variable not found");
      }

      return ResponseBuilder.success(null, "SEO variable deleted successfully");
    } catch (error: any) {
      if (error.code && error.message) {
        return error;
      }
      return ErrorBuilder.build(
        ErrorCode.INTERNAL_SERVER_ERROR,
        error.message || "Failed to delete SEO variable"
      );
    }
  }
}