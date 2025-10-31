import { AdminImpressionRatio, CreateUser, User } from "../../../../infrastructure/shared/schema/schema";

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
}
