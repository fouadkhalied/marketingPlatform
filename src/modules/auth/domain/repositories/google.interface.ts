import { User } from "../../../../infrastructure/shared/schema/schema";

export interface IGoogleRepository {
    getUserByGoogleId(googleId: string): Promise<User | null>;
    createUser(data: Partial<User>): Promise<User>;
  }