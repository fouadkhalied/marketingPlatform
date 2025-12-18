import { Request, Response } from "express";
import { ApiResponseInterface } from "../../../../infrastructure/shared/common/apiResponse/interfaces/apiResponse.interface";
import { ERROR_STATUS_MAP } from "../../../../infrastructure/shared/common/errors/mapper/mapperErrorEnum";
import { ErrorBuilder } from "../../../../infrastructure/shared/common/errors/errorBuilder";
import { ErrorCode } from "../../../../infrastructure/shared/common/errors/enums/basic.error.enum";
import { pixel } from "../../../../infrastructure/shared/common/pixel/interface/pixelBody.interface";
import { PixelPlatform } from "../../../../infrastructure/shared/common/pixel/interface/pixelPlatform.enum";
import { PixelAppService } from "../../application/services/pixel-app.service";

export class PixelController {
  constructor(private readonly pixelService: PixelAppService) {}

  // ✅ Helper method to get status code from error code
  private getStatusCode(response: ApiResponseInterface<any>): number {
    if (response.success) {
      return 200;
    }
    if (
      response.error?.code &&
      ERROR_STATUS_MAP[response.error.code as keyof typeof ERROR_STATUS_MAP]
    ) {
      return ERROR_STATUS_MAP[
        response.error.code as keyof typeof ERROR_STATUS_MAP
      ];
    }
    return 500; // default to internal server error
  }

  async createPixelApp(req: Request, res: Response): Promise<void> {
    try {
      const pixelData: pixel = req.body;

      // ✅ Step 1: Basic validation
      if (!pixelData.name || !pixelData.pixelId || !pixelData.platform) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields: name, pixelId, or platform',
        });
        return;
      }

      // ✅ Step 2: Validate platform enum value
      if (!Object.values(PixelPlatform).includes(pixelData.platform)) {
        res.status(400).json({
          success: false,
          message: `Invalid platform. Must be one of: ${Object.values(PixelPlatform).join(', ')}`,
        });
        return;
      }


    const result = await this.pixelService.createPixel(pixelData);

    const statusCode = this.getStatusCode(result);
    res.status(statusCode).json(result);

    } catch (err: any) {
      console.error('Error creating pixel app:', err);

      res.status(500).json({
        success: false,
        message: 'Failed to create pixel app',
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: err.message,
        },
      });
    }
  }


  // Controller Layer - Add to your controller file

  async getPixelById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id || typeof id !== 'string' || id.trim().length === 0) {
        res.status(400).json({
          success: false,
          message: 'Valid pixel ID is required',
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Valid pixel ID is required',
          },
        });
        return;
      }

      const result = await this.pixelService.getPixelById(id);
      const statusCode = this.getStatusCode(result);

      res.status(statusCode).json(result);
    } catch (err: any) {
      console.error('Error retrieving pixel:', err);

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve pixel',
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: err.message,
        },
      });
    }
  }

  async getAllPixels(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      // Validate pagination parameters
      if (page < 1) {
        res.status(400).json({
          success: false,
          message: 'Page number must be greater than 0',
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Page number must be greater than 0',
          },
        });
        return;
      }

      if (limit < 1 || limit > 100) {
        res.status(400).json({
          success: false,
          message: 'Limit must be between 1 and 100',
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Limit must be between 1 and 100',
          },
        });
        return;
      }

      const result = await this.pixelService.getAllPixels({ page, limit });
      const statusCode = this.getStatusCode(result);

      res.status(statusCode).json(result);
    } catch (err: any) {
      console.error('Error retrieving pixels:', err);

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve pixels',
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: err.message,
        },
      });
    }
  }

  async updatePixel(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData: Partial<pixel> = req.body;

      if (!id || typeof id !== 'string' || id.trim().length === 0) {
        res.status(400).json({
          success: false,
          message: 'Valid pixel ID is required',
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Valid pixel ID is required',
          },
        });
        return;
      }

      // Validate that at least one field is being updated
      if (!updateData || Object.keys(updateData).length === 0) {
        res.status(400).json({
          success: false,
          message: 'No update data provided',
          error: {
            code: 'VALIDATION_ERROR',
            message: 'At least one field must be provided for update',
          },
        });
        return;
      }

      // Validate platform if provided
      if (updateData.platform && !Object.values(PixelPlatform).includes(updateData.platform)) {
        res.status(400).json({
          success: false,
          message: `Invalid platform. Must be one of: ${Object.values(PixelPlatform).join(', ')}`,
          error: {
            code: 'VALIDATION_ERROR',
            message: `Invalid platform. Must be one of: ${Object.values(PixelPlatform).join(', ')}`,
          },
        });
        return;
      }

      const result = await this.pixelService.updatePixel(id, updateData);
      const statusCode = this.getStatusCode(result);

      res.status(statusCode).json(result);
    } catch (err: any) {
      console.error('Error updating pixel:', err);

      res.status(500).json({
        success: false,
        message: 'Failed to update pixel',
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: err.message,
        },
      });
    }
  }

  async deletePixel(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id || typeof id !== 'string' || id.trim().length === 0) {
        res.status(400).json({
          success: false,
          message: 'Valid pixel ID is required',
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Valid pixel ID is required',
          },
        });
        return;
      }

      const result = await this.pixelService.deletePixel(id);
      const statusCode = this.getStatusCode(result);

      res.status(statusCode).json(result);
    } catch (err: any) {
      console.error('Error deleting pixel:', err);

      res.status(500).json({
        success: false,
        message: 'Failed to delete pixel',
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: err.message,
        },
      });
    }
  }

  // Controller Layer - Add to your controller file

  async generatePixelCode(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id || typeof id !== 'string' || id.trim().length === 0) {
        res.status(400).json({
          success: false,
          message: 'Valid pixel ID is required',
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Valid pixel ID is required',
          },
        });
        return;
      }

      const result = await this.pixelService.generatePixelCode(id);
      const statusCode = this.getStatusCode(result);

      res.status(statusCode).json(result);
    } catch (err: any) {
      console.error('Error generating pixel code:', err);

      res.status(500).json({
        success: false,
        message: 'Failed to generate pixel code',
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: err.message,
        },
      });
    }
  }

  async generatePixelCodeForAllPixels(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      // Validate pagination parameters
      if (page < 1) {
        res.status(400).json({
          success: false,
          message: 'Page number must be greater than 0',
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Page number must be greater than 0',
          },
        });
        return;
      }

      if (limit < 1 || limit > 100) {
        res.status(400).json({
          success: false,
          message: 'Limit must be between 1 and 100',
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Limit must be between 1 and 100',
          },
        });
        return;
      }

      const pixels = await this.pixelService.getAllPixels({ page, limit });

      // Check if pixels data exists
      if (!pixels.data || pixels.data.length === 0) {
        res.status(200).json({
          success: true,
          message: 'No pixels found'
        });
        return;
      }

      // Generate pixel codes for all pixels
      const pixelCodes = await Promise.all(
        pixels.data.map(async (pixel) => {
          return await this.pixelService.generatePixelCode(pixel.id);
        })
      );

      // Return the results with pagination info
      res.status(200).json({
        success: true,
        message: 'Pixel codes generated successfully',
        data: pixelCodes.map((data)=> data.data?.code),
      });
    } catch (err: any) {
      console.error('Error generating pixel codes:', err);

      res.status(500).json({
        success: false,
        message: 'Failed to generate pixel codes',
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: err.message,
        },
      });
    }
  }
}
