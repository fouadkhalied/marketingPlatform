import { PaginatedResponse, PaginationParams } from "../../../../infrastructure/shared/common/pagination.vo";
import { Ad, InsertAd } from "../../../../infrastructure/shared/schema/schema";
import { ApproveAdData } from "../../application/dto/approveAdData";
import { autheticatedPage } from "../../application/dto/authenticatedPage.dto";

export interface IAdvertisingRepository {
    create(ad: InsertAd,): Promise<string>;
    addPhotoToAd(id:string, photo: string[]): Promise<boolean>;
    deletePhotoFromAd(id: string, index: number): Promise<boolean>;
    findById(id: string): Promise<Ad | null>;
    findAllAdsForAdmin(status: string, pagination: PaginationParams): Promise<PaginatedResponse<Ad>>;
    findAllAdsForUser(status: string , userId: string, pagination: PaginationParams): Promise<PaginatedResponse<Ad>>;
    listApprovedAdsForUser(pagination: PaginationParams, locations: string[], title?:string): Promise<PaginatedResponse<Ad>>;
    update(id: string, ad: Partial<InsertAd>): Promise<Ad | null>;
    delete(id: string): Promise<boolean>;
    findByTitle(title: string, params:PaginationParams) : Promise<PaginatedResponse<Ad>>;
    approveAd(id: string,data?: ApproveAdData): Promise<Ad>;
    rejectAd(id: string, reason?: string): Promise<Ad>;

    activateAd(id: string):Promise<Ad>;
    activateUserAd(id: string, userId:string):Promise<Ad>;

    getAllPagesForUser(isActive: boolean, userId: string, params: PaginationParams) : Promise<PaginatedResponse<autheticatedPage>>
    getPageAccessTokenById(userId: string,pageId: string): Promise<string | null>
    assignCreditToAd(userId: string, adId: string, credit: number): Promise<Ad | null>
    hasSufficientBalance(userId: string, credit: number): Promise<boolean>
    deactivateUserAd(userId: string, adId: string): Promise<Ad>
    deactivateUserAdByAdmin(userId: string, adId: string): Promise<Ad>
}  
