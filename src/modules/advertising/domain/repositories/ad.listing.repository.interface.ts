import { PaginatedResponse, PaginationParams } from "../../../../infrastructure/shared/common/pagination.vo";
import { Ad, User } from "../../../../infrastructure/shared/schema/schema";

// ============================================
// Ad Listing & Filtering
// ============================================

export interface IAdListingRepository {
  findAllAdsForAdmin(
    status: string,
    pagination: PaginationParams,
    title?: string,
    description?: string,
    email?: string
  ): Promise<PaginatedResponse<Ad & { userId: User["id"], email: User["email"], name: User["username"] }>>;

  findAllAdsForUser(
    status: string,
    userId: string,
    pagination: PaginationParams,
    title?: string,
    description?: string,
    email?:string
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