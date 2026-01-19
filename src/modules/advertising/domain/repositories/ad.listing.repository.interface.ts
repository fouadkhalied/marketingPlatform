import { PaginatedResponse, PaginationParams } from "../../../../infrastructure/shared/common/pagination.vo";
import { Ad, User } from "../../../../infrastructure/shared/schema/schema";

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
    pagination: PaginationParams,
    title?: string,
    description?: string,
    email?:string
  ): Promise<PaginatedResponse<Ad>>;

  listUserAdsForAdmin(
    pagination: PaginationParams,
    title?: string,
    description?: string,
    email?: string
  ): Promise<PaginatedResponse<Ad & { email: User["email"], name: User["username"] }>>;

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