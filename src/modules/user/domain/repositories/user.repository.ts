import { CreateUser, User } from "../../../../infrastructure/shared/schema/schema";

export interface userInterface {
    getUser(id: string): Promise<User | undefined>;
    getUserByEmail(email: string): Promise<User | undefined>;
    getUserByUsername(username: string): Promise<User | undefined>;
    createUser(user: CreateUser): Promise<User>;
    updateUser(id: string, updates: Partial<User>): Promise<User>;
    verifyUser(id: string): Promise<User | undefined>
    updateUserStripeInfo(id: string, customerId: string, subscriptionId?: string): Promise<User>;
}
