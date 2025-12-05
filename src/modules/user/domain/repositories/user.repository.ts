import { PaginatedResponse, PaginationParams } from "../../../../infrastructure/shared/common/pagination.vo";
import { AdminImpressionRatio, Ad, CreateUser, User } from "../../../../infrastructure/shared/schema/schema";
import { AdsReport } from "../../application/dtos/ads-report.dto";
import { AdAnalyticsFullDetails } from "../../application/dtos/dashboard/dashboard.interfaces";

export interface userInterface {
    getUser(id: string): Promise<Partial<User & { socialMediaPages: Array<{ pageId: string; pageName: string; pageType: string; isActive: boolean }> }> | undefined>;
    getUserByEmail(email: string): Promise<User | undefined>;
    getUserByUsername(username: string): Promise<User | undefined>;
    createUser(user: CreateUser): Promise<User>;
    updateUser(id: string, updates: Partial<User>): Promise<User>;
    verifyUser(id: string): Promise<User | undefined>
    updateUserStripeInfo(id: string, customerId: string, subscriptionId?: string): Promise<User>;
    deleteUser(id: string): Promise<boolean>;
    getAvaialbeImpressionRatios(): Promise<AdminImpressionRatio[]>;
    updateImpressionRatio(adminId: string , id:string, impressionsPerUnit: number, currency: "usd" | "sar"): Promise<AdminImpressionRatio>;
    //createImpressionRatio(adminId: string , impressionsPerUnit: number,promoted: boolean ,currency: "usd" | "sar"): Promise<AdminImpressionRatio>;
    getProfile(id:string) :Promise<Partial<User>>;
    updateProfile(id:string,user : Partial<Pick<User, 'username' | 'password' | 'country'>>) :Promise<Partial<User>>
    createAdClick(adId: string, userId: string, forWebsite: boolean): Promise<boolean>;
    addCretidToUserByAdmin(credit:number, userId: string):Promise<boolean>

    createAdReport(adId: string, email: string, username: string, phoneNumber: string, reportDescription: string): Promise<boolean>;
    getAdReports(pagination: PaginationParams): Promise<PaginatedResponse<AdsReport>>;

    updateFreeCredits(credits: number): Promise<boolean>;
    getFreeCredits(): Promise<number>;
    getAdAnalyticsFullDetails(adId: string): Promise<AdAnalyticsFullDetails | undefined>;
}
