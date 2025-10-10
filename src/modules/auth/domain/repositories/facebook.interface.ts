import { CreateFacebookUser, User } from "../../../../infrastructure/shared/schema/schema";

export interface IFacebookRepository {
    getUserByFacebookId(facebookId: string): Promise<User | null>;
    getUserByEmail(email: string): Promise<User | null>;
    createUser(data: CreateFacebookUser): Promise<User>;
    linkFacebookAccount(userId: string, facebookId: string): Promise<User>;
  }