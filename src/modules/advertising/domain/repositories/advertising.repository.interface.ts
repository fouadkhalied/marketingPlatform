import { PaginatedResponse, PaginationParams } from "../../../../infrastructure/shared/common/pagination.vo";
import { Ad, InsertAd } from "../../../../infrastructure/shared/schema/schema";
import { AdStatus } from "../enums/ads.status.enum";

export interface IAdvertisingRepository {
    create(ad: InsertAd): Promise<string>;
    findById(id: string): Promise<Ad | null>;
    findAllForAdmin(status: string, pagination: PaginationParams): Promise<PaginatedResponse<Ad>>;
    findAllForUser(status: string , userId: string, pagination: PaginationParams): Promise<PaginatedResponse<Ad>>;
    update(id: string, ad: Partial<InsertAd>): Promise<Ad | null>;
    delete(id: string): Promise<boolean>;

    approveAd(id: string): Promise<Ad>;
    rejectAd(id: string, reason?: string): Promise<Ad>;
}  
