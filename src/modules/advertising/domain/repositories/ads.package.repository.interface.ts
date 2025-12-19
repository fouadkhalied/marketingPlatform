import { PaginatedResponse, PaginationParams } from "../../../../infrastructure/shared/common/pagination.vo";
import { AdsPackage, InsertAdsPackage } from "../../../../infrastructure/shared/schema/schema";

// ============================================
// Ads Package CRUD Operations
// ============================================

export interface IAdsPackageRepository {
  create(adsPackage: InsertAdsPackage): Promise<string>;
  findById(id: string): Promise<AdsPackage | null>;
  findAll(params: PaginationParams): Promise<PaginatedResponse<AdsPackage>>;
  update(id: string, adsPackage: Partial<InsertAdsPackage>): Promise<AdsPackage | null>;
  delete(id: string): Promise<boolean>;
}
