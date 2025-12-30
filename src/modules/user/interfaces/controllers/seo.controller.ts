import { Request, Response } from "express";
import { ApiResponseInterface } from "../../../../infrastructure/shared/common/apiResponse/interfaces/apiResponse.interface";
import { ErrorBuilder } from "../../../../infrastructure/shared/common/errors/errorBuilder";
import { ERROR_STATUS_MAP } from "../../../../infrastructure/shared/common/errors/mapper/mapperErrorEnum";
import { SeoAppService } from "../../application/services/seo-app.service";
import { ErrorCode } from "../../../../infrastructure/shared/common/errors/enums/basic.error.enum";

export class SeoController {
    constructor(private readonly seoService: SeoAppService) {}
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
    
async getAllSeoVariables(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.seoService.getAllSeoVariables();
      const statusCode = this.getStatusCode(result);
      
      res.status(statusCode).json(result);
    } catch (err: any) {
      console.error('Error fetching SEO variables:', err);
      
      const errorResponse = ErrorBuilder.build(
        ErrorCode.INTERNAL_SERVER_ERROR,
        "Failed to fetch SEO variables",
        err.message
      );
      
      res.status(500).json(errorResponse);
    }
  }
  
  // Get SEO variable by ID
  async getSeoVariableById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
  
      if (!id) {
        const errorResponse = ErrorBuilder.build(
          ErrorCode.MISSING_REQUIRED_FIELD,
          "SEO variable ID is required"
        );
        res.status(400).json(errorResponse);
        return;
      }
  
      const result = await this.seoService.getSeoVariableById(id);
      const statusCode = this.getStatusCode(result);
      
      res.status(statusCode).json(result);
    } catch (err: any) {
      console.error('Error fetching SEO variable:', err);
      
      const errorResponse = ErrorBuilder.build(
        ErrorCode.INTERNAL_SERVER_ERROR,
        "Failed to fetch SEO variable",
        err.message
      );
      
      res.status(500).json(errorResponse);
    }
  }
  
  // Create SEO variable
  async createSeoVariable(req: Request, res: Response): Promise<void> {
    try {
      const { title, description, tag_line } = req.body;
  
      if (!title || !description || !tag_line) {
        const errorResponse = ErrorBuilder.build(
          ErrorCode.MISSING_REQUIRED_FIELD,
          "Title, description, and tag_line are required"
        );
        res.status(400).json(errorResponse);
        return;
      }
  
      const result = await this.seoService.createSeoVariable(req.body);
      const statusCode = result.success ? 201 : this.getStatusCode(result);
      
      res.status(statusCode).json(result);
    } catch (err: any) {
      console.error('Error creating SEO variable:', err);
      
      const errorResponse = ErrorBuilder.build(
        ErrorCode.INTERNAL_SERVER_ERROR,
        "Failed to create SEO variable",
        err.message
      );
      
      res.status(500).json(errorResponse);
    }
  }
  
  // Update SEO variable
  async updateSeoVariable(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
  
      if (!id) {
        const errorResponse = ErrorBuilder.build(
          ErrorCode.MISSING_REQUIRED_FIELD,
          "SEO variable ID is required"
        );
        res.status(400).json(errorResponse);
        return;
      }
  
      const result = await this.seoService.updateSeoVariable(id, req.body);
      const statusCode = this.getStatusCode(result);
      
      res.status(statusCode).json(result);
    } catch (err: any) {
      console.error('Error updating SEO variable:', err);
      
      const errorResponse = ErrorBuilder.build(
        ErrorCode.INTERNAL_SERVER_ERROR,
        "Failed to update SEO variable",
        err.message
      );
      
      res.status(500).json(errorResponse);
    }
  }
  
  // Delete SEO variable
  async deleteSeoVariable(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
  
      if (!id) {
        const errorResponse = ErrorBuilder.build(
          ErrorCode.MISSING_REQUIRED_FIELD,
          "SEO variable ID is required"
        );
        res.status(400).json(errorResponse);
        return;
      }
  
      const result = await this.seoService.deleteSeoVariable(id);
      const statusCode = this.getStatusCode(result);
      
      res.status(statusCode).json(result);
    } catch (err: any) {
      console.error('Error deleting SEO variable:', err);
      
      const errorResponse = ErrorBuilder.build(
        ErrorCode.INTERNAL_SERVER_ERROR,
        "Failed to delete SEO variable",
        err.message
      );
      
      res.status(500).json(errorResponse);
    }
  }
  
}