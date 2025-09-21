import { CreateUser, User } from "../../infrastructure/database/user.type";

export interface userInterface {
    getUser(id: string): Promise<User | undefined>;
    getUserByEmail(email: string): Promise<User | undefined>;
    getUserByUsername(username: string): Promise<User | undefined>;
    createUser(user: CreateUser): Promise<User>;
    updateUser(id: string, updates: Partial<User>): Promise<User>;
    updateUserStripeInfo(id: string, customerId: string, subscriptionId?: string): Promise<User>;
}