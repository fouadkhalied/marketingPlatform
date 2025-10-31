import { PaginatedResponse, PaginationParams } from "../../../../infrastructure/shared/common/pagination.vo";
import { pixel } from "../../../../infrastructure/shared/common/pixel/interface/pixelBody.interface";
import { Ad, InsertAd } from "../../../../infrastructure/shared/schema/schema";
import { ApproveAdData } from "../../application/dto/approveAdData";
import { autheticatedPage } from "../../application/dto/authenticatedPage.dto";

export interface IAdvertisingRepository {
    create(ad: InsertAd,): Promise<string>;
    addPhotoToAd(id:string, photo: string[]): Promise<boolean>;
    deletePhotoFromAd(id: string, userId: string, photoUrl: string): Promise<boolean>;
    updatePhotoFromAd(id: string, userId: string, newPhotoUrl: string,oldPhotoUrl: string,role: string): Promise<boolean>
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

    promoteAd(id: string, userId: string): Promise<Ad>;

    getAllPagesForUser(isActive: boolean, userId: string, params: PaginationParams) : Promise<PaginatedResponse<autheticatedPage>>
    getPageAccessTokenById(userId: string,pageId: string): Promise<string | null>
    assignCreditToAd(userId: string, adId: string, credit: number): Promise<Ad | null>
    hasSufficientBalance(userId: string, credit: number): Promise<boolean>
    deactivateUserAd(userId: string, adId: string): Promise<Ad>
    deactivateUserAdByAdmin(userId: string, adId: string): Promise<Ad>

    createPixel(pixel: pixel): Promise<pixel>;
    getPixelById(pixelId: string): Promise<pixel | null>;
    getAllPixels(pagination: PaginationParams): Promise<PaginatedResponse<pixel>>;
    updatePixel(pixelId: string, updateData: Partial<pixel>): Promise<pixel>;
    deletePixel(pixelId: string): Promise<boolean>;
}  
