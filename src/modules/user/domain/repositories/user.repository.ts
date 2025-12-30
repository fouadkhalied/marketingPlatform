import { PaginatedResponse, PaginationParams } from "../../../../infrastructure/shared/common/pagination.vo";
import { AdminImpressionRatio, Ad, CreateUser, User } from "../../../../infrastructure/shared/schema/schema";
import { AdsReport } from "../../application/dtos/ads-report.dto";
import { AdAnalyticsFullDetails } from "../../../dashboard/application/dtos/dashboard.interfaces";

// Core user management operations
export interface IUserRepository {
    getUser(id: string): Promise<Partial<User & { socialMediaPages: Array<{ pageId: string; pageName: string; pageType: string; isActive: boolean }> }> | undefined>;
    getUserByEmail(email: string): Promise<User | undefined>;
    getUserByUsername(username: string): Promise<User | undefined>;
    createUser(user: CreateUser): Promise<User>;
    updateUser(id: string, updates: Partial<User>): Promise<User>;
    deleteUser(id: string): Promise<boolean>;
    addUserEmail(email: string): Promise<boolean>;
}

// User profile management
export interface IUserProfile {
    getProfile(id: string): Promise<Partial<User>>;
    updateProfile(id: string, user: Partial<Pick<User, 'username' | 'password' | 'country'>>): Promise<Partial<User>>;
}

// User verification operations
export interface IUserVerification {
    verifyUser(id: string): Promise<User | undefined>;
}

// Payment and billing related operations
export interface IUserBilling {
    updateUserStripeInfo(id: string, customerId: string, subscriptionId?: string): Promise<User>;
}

// User credits management
export interface IUserCredits {
    addCretidToUserByAdmin(credit: number, userId: string): Promise<boolean>;
    updateFreeCredits(credits: number): Promise<boolean>;
    getFreeCredits(): Promise<number>;
}

// Ad interaction tracking
export interface IAdInteraction {
    createAdClick(adId: string, userId: string, forWebsite: boolean): Promise<boolean>;
}

// Ad reporting and moderation
export interface IAdReport {
    createAdReport(adId: string, email: string, username: string, phoneNumber: string, reportDescription: string): Promise<boolean>;
    getAdReports(pagination: PaginationParams): Promise<PaginatedResponse<AdsReport>>;
}



// Impression ratio management (Admin operations)
export interface IImpressionRatio {
    getAvaialbeImpressionRatios(): Promise<AdminImpressionRatio[]>;
    updateImpressionRatio(adminId: string, id: string, impressionsPerUnit: number, currency: "usd" | "sar"): Promise<AdminImpressionRatio>;
}
