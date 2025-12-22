import { ResponseBuilder } from "../../../../infrastructure/shared/common/apiResponse/apiResponseBuilder";
import { ApiResponseInterface } from "../../../../infrastructure/shared/common/apiResponse/interfaces/apiResponse.interface";
import { ErrorCode } from "../../../../infrastructure/shared/common/errors/enums/basic.error.enum";
import { ErrorBuilder } from "../../../../infrastructure/shared/common/errors/errorBuilder";
import { PaginationParams } from "../../../../infrastructure/shared/common/pagination.vo";
import { pixel } from "../../../../infrastructure/shared/common/pixel/interface/pixelBody.interface";
import { PixelPlatform } from "../../../../infrastructure/shared/common/pixel/interface/pixelPlatform.enum";
import { PixelCodeGeneratorFactory } from "../../../../infrastructure/shared/common/pixel/module/factoryPixel";
import { IPixelRepository } from "../../domain/repositories/pixel.repository.interface";
import { ILogger } from "../../../../infrastructure/shared/common/logging";

export class PixelAppService {
  constructor(
    private readonly pixelRepository: IPixelRepository,
    private readonly logger: ILogger
  ) {}

  async createPixel(pixel: pixel): Promise<ApiResponseInterface<pixel>> {
    try {

      // ✅ Save the pixel (DB call)
      const createdPixel = await this.pixelRepository.createPixel(pixel);

      // ✅ Return success response
      return ResponseBuilder.success(
        createdPixel,
        'Pixel app created successfully'
      );
    } catch (error: any) {
      // ✅ Known error returned by repository
      if (error.code && error.message) {
        return error;
      }

      // ✅ Unexpected internal error
      return ErrorBuilder.build(
        ErrorCode.INTERNAL_SERVER_ERROR,
        error.message || 'Failed to create pixel app'
      );
    }
  }

  async getPixelById(pixelId: string): Promise<ApiResponseInterface<pixel>> {
    try {
      const pixel = await this.pixelRepository.getPixelById(pixelId);

      if (!pixel) {
        return ErrorBuilder.build(
          ErrorCode.PIXEL_NOT_FOUND,
          `Pixel with ID "${pixelId}" not found`
        );
      }

      return ResponseBuilder.success(pixel, 'Pixel retrieved successfully');
    } catch (error: any) {
      if (error.code && error.message) {
        return error;
      }

      return ErrorBuilder.build(
        ErrorCode.INTERNAL_SERVER_ERROR,
        error.message || 'Failed to retrieve pixel'
      );
    }
  }

  async getAllPixels(
    pagination: PaginationParams
  ): Promise<ApiResponseInterface<pixel[]>> {
    try {
      const result = await this.pixelRepository.getAllPixels(pagination);

      return ResponseBuilder.paginatedSuccess(
        result.data,
        result.pagination
      );
    } catch (error: any) {
      if (error.code && error.message) {
        return error;
      }

      return ErrorBuilder.build(
        ErrorCode.INTERNAL_SERVER_ERROR,
        error.message || 'Failed to retrieve pixels'
      );
    }
  }

  async updatePixel(
    pixelId: string,
    updateData: Partial<pixel>
  ): Promise<ApiResponseInterface<pixel>> {
    try {
      // Validate update data
      if (Object.keys(updateData).length === 0) {
        return ErrorBuilder.build(
          ErrorCode.VALIDATION_ERROR,
          'No update data provided'
        );
      }

      // If platform is being updated, validate it
      if (updateData.platform && !Object.values(PixelPlatform).includes(updateData.platform)) {
        return ErrorBuilder.build(
          ErrorCode.VALIDATION_ERROR,
          `Invalid platform. Must be one of: ${Object.values(PixelPlatform).join(', ')}`
        );
      }

      const updatedPixel = await this.pixelRepository.updatePixel(
        pixelId,
        updateData
      );

      return ResponseBuilder.success(
        updatedPixel,
        'Pixel updated successfully'
      );
    } catch (error: any) {
      if (error.code && error.message) {
        return error;
      }

      return ErrorBuilder.build(
        ErrorCode.INTERNAL_SERVER_ERROR,
        error.message || 'Failed to update pixel'
      );
    }
  }

  async deletePixel(pixelId: string): Promise<ApiResponseInterface<{ success: boolean }>> {
    try {
      const deleted = await this.pixelRepository.deletePixel(pixelId);

      return ResponseBuilder.success(
        { success: deleted },
        'Pixel deleted successfully'
      );
    } catch (error: any) {
      if (error.code && error.message) {
        return error;
      }

      return ErrorBuilder.build(
        ErrorCode.INTERNAL_SERVER_ERROR,
        error.message || 'Failed to delete pixel'
      );
    }
  }

  async generatePixelCode(
    pixelId: string
  ): Promise<ApiResponseInterface<{ code: string; platform: string; pixelId: string }>> {
    try {
      // Get pixel from database
      const pixel = await this.pixelRepository.getPixelById(pixelId);

      if (!pixel) {
        return ErrorBuilder.build(
          ErrorCode.PIXEL_NOT_FOUND,
          `Pixel with ID "${pixelId}" not found`
        );
      }

      // Generate code using factory
      const generator = PixelCodeGeneratorFactory.create(
        pixel.platform,
        pixel.pixelId
      );
      const generatedCode = generator.generateCode();

      return ResponseBuilder.success(
        {
          code: generatedCode,
          platform: pixel.platform,
          pixelId: pixel.pixelId,
        },
        'Pixel code generated successfully'
      );
    } catch (error: any) {
      if (error.code && error.message) {
        return error;
      }

      return ErrorBuilder.build(
        ErrorCode.INTERNAL_SERVER_ERROR,
        error.message || 'Failed to generate pixel code'
      );
    }
  }
}
