import { PaginatedResponse, PaginationParams } from "../../../../infrastructure/shared/common/pagination.vo";
import { Ad } from "../../../../infrastructure/shared/schema/schema";

// ============================================
// Ad Listing & Filtering
// ============================================

export interface IAdListingRepository {
  findAllAdsForAdmin(
    status: string,
    pagination: PaginationParams
  ): Promise<PaginatedResponse<Ad>>;

  findAllAdsForUser(
    status: string,
    userId: string,
    pagination: PaginationParams
  ): Promise<PaginatedResponse<Ad>>;

  listApprovedAdsForUser(
    pagination: PaginationParams,
    locations: string[],
    title?: string,
    description?: string,
    targetAudience?: string,
    source?: string
  ): Promise<PaginatedResponse<Ad>>;

  listAdsFeed(
    pagination: PaginationParams,
    locations: string[],
    title?: string,
    description?: string,
    targetAudience?: string,
    source?: string
  ): Promise<PaginatedResponse<Ad>>;
}