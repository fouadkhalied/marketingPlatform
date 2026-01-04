import { PaginatedResponse, PaginationParams } from "../../../../infrastructure/shared/common/pagination.vo";
import { Ad, InsertAd } from "../../../../infrastructure/shared/schema/schema";

// ============================================
// Ad CRUD Operations
// ============================================

export interface IAdCrudRepository {
  create(ad: InsertAd): Promise<string>;
  findById(id: string): Promise<Ad | null>;
  findByTitle(title: string, params: PaginationParams): Promise<PaginatedResponse<Ad>>;
  update(id: string, ad: Partial<InsertAd>): Promise<Ad | null>;
  delete(id: string, userId: string, role: string): Promise<{id: string; photoUrl: string[];} | null>;
}
