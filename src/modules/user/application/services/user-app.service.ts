import { CreateUser, User } from "../../../../infrastructure/shared/schema/schema";
import { UserRepositoryImpl } from "../../infrastructure/repositories/user.repository.impl";


export class UserAppService {
  constructor(private readonly userRepository: UserRepositoryImpl) {}

  // Create a new user
  async createUser(input: CreateUser): Promise<User> {
    // Optional: perform extra application-level validation
    const existingUser = await this.userRepository.getUserByEmail(input.email);
    if (existingUser) {
      throw new Error("Email already exists");
    }

    const newUser = await this.userRepository.createUser(input);
    return newUser;
  }

  // Get user by ID
  async getUser(id: string): Promise<User | undefined> {
    return this.userRepository.getUser(id);
  }

  // Get user by email
  async getUserByEmail(email: string): Promise<User | undefined> {
    return this.userRepository.getUserByEmail(email);
  }

  // Get user by username
  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.userRepository.getUserByUsername(username);
  }

  // Update user
//   async updateUser(id: string, updates: UpdateUserDto): Promise<User> {
//     return this.userRepository.updateUser(id, updates);
//   }

  // Update Stripe info
  async updateUserStripeInfo(
    id: string,
    customerId: string,
    subscriptionId?: string
  ): Promise<User> {
    return this.userRepository.updateUserStripeInfo(id, customerId, subscriptionId);
  }
}
