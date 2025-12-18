import { PaginatedResponse, PaginationParams } from "../../../../infrastructure/shared/common/pagination.vo";
import { pixel } from "../../../../infrastructure/shared/common/pixel/interface/pixelBody.interface";

// ============================================
// Pixel Management
// ============================================

export interface IPixelRepository {
  createPixel(pixel: pixel): Promise<pixel>;
  getPixelById(pixelId: string): Promise<pixel | null>;
  getAllPixels(pagination: PaginationParams): Promise<PaginatedResponse<pixel>>;
  updatePixel(pixelId: string, updateData: Partial<pixel>): Promise<pixel>;
  deletePixel(pixelId: string): Promise<boolean>;
}
