import { PaginatedResponse, PaginationParams } from "../../../../infrastructure/shared/common/pagination.vo";
import { Ad, InsertAd } from "../../../../infrastructure/shared/schema/schema";

export interface IAdvertisingRepository {
    create(ad: InsertAd): Promise<string>;
    findById(id: string): Promise<Ad | null>;
    findAllForAdmin(status: string, pagination: PaginationParams): Promise<PaginatedResponse<Ad>>;
    findAllForUser(status: string, userId: string, pagination: PaginationParams): Promise<PaginatedResponse<Ad>>;
    update(id: string, ad: Partial<InsertAd>): Promise<Ad | null>;
    delete(id: string): Promise<boolean>;
  }  