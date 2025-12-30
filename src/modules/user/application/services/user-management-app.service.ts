import { ResponseBuilder } from "../../../../infrastructure/shared/common/apiResponse/apiResponseBuilder";
import { ApiResponseInterface } from "../../../../infrastructure/shared/common/apiResponse/interfaces/apiResponse.interface";
import { ErrorCode } from "../../../../infrastructure/shared/common/errors/enums/basic.error.enum";
import { ErrorBuilder } from "../../../../infrastructure/shared/common/errors/errorBuilder";
import { User } from "../../../../infrastructure/shared/schema/schema";
import { PaginationParams } from "../../../../infrastructure/shared/common/pagination.vo";
import { UserRepository } from "../../infrastructure/repositories/UserRepository";
import { ILogger } from "../../../../infrastructure/shared/common/logging";

export class UserManagementAppService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly logger: ILogger
  ) {}

  // Get user by ID
  async getUser(id: string): Promise<ApiResponseInterface<Partial<User & { socialMediaPages: Array<{ pageId: string; pageName: string; pageType: string; isActive: boolean }> }> | undefined>> {
    try {
      this.logger.info('Getting user by ID', { userId: id });

      const user = await this.userRepository.getUser(id);
      if (!user) {
        this.logger.warn('User not found', { userId: id });
        return ErrorBuilder.build(ErrorCode.USER_NOT_FOUND, "User not found");
      }

      this.logger.info('User retrieved successfully', { userId: id });
      return ResponseBuilder.success(user);
    } catch (error) {
      const err = error as Error;
      this.logger.error('Error getting user', { error: err.message, userId: id });
      return ErrorBuilder.build(ErrorCode.INTERNAL_SERVER_ERROR, "Failed to retrieve user");
    }
  }

  // Get user by email
  async getUserByEmail(email: string): Promise<ApiResponseInterface<User>> {
    try {
      this.logger.info('Getting user by email', { email });

      const user = await this.userRepository.getUserByEmail(email);
      if (!user) {
        this.logger.warn('User not found by email', { email });
        return ErrorBuilder.build(ErrorCode.USER_NOT_FOUND, "User not found");
      }

      this.logger.info('User retrieved successfully by email', { email, userId: user.id });
      return ResponseBuilder.success(user);
    } catch (error) {
      const err = error as Error;
      this.logger.error('Error getting user by email', { error: err.message, email });
      return ErrorBuilder.build(ErrorCode.INTERNAL_SERVER_ERROR, "Failed to retrieve user");
    }
  }

  // Get user by username
  async getUserByUsername(username: string): Promise<ApiResponseInterface<User>> {
    try {
      this.logger.info('Getting user by username', { username });

      const user = await this.userRepository.getUserByUsername(username);
      if (!user) {
        this.logger.warn('User not found by username', { username });
        return ErrorBuilder.build(ErrorCode.USER_NOT_FOUND, "User not found");
      }

      this.logger.info('User retrieved successfully by username', { username, userId: user.id });
      return ResponseBuilder.success(user);
    } catch (error) {
      const err = error as Error;
      this.logger.error('Error getting user by username', { error: err.message, username });
      return ErrorBuilder.build(ErrorCode.INTERNAL_SERVER_ERROR, "Failed to retrieve user");
    }
  }

  // Get all users
  async getUsers(params: PaginationParams): Promise<ApiResponseInterface<Partial<User>[]>> {
    try {
      this.logger.info('Getting users list', { params });

      const users = await this.userRepository.getUsers(params);

      this.logger.info('Users list retrieved successfully', { count: users.data.length });
      return ResponseBuilder.paginatedSuccess(users.data, users.pagination);
    } catch (error) {
      const err = error as Error;
      this.logger.error('Error fetching users', { error: err.message });
      return ErrorBuilder.build(
        ErrorCode.INTERNAL_SERVER_ERROR,
        "Unexpected error while listing users for admin",
        err.message)
    }
  }

  // Promote user to admin
  async makeUserAdmin(id: string): Promise<ApiResponseInterface<User>> {
    try {
      this.logger.info('Promoting user to admin', { userId: id });

      const user = await this.userRepository.makeUserAdmin(id);
      if (!user) {
        this.logger.warn('User promotion failed - user not found', { userId: id });
        return ErrorBuilder.build(ErrorCode.USER_NOT_FOUND, "User not found");
      }

      this.logger.info('User promoted to admin successfully', { userId: id });
      return ResponseBuilder.success(user, "User promoted to admin successfully");
    } catch (error) {
      const err = error as Error;
      this.logger.error('Error promoting user to admin', { error: err.message, userId: id });
      return ErrorBuilder.build(ErrorCode.INTERNAL_SERVER_ERROR, "Failed to promote user to admin");
    }
  }

  // Delete user by ID
  async deleteUser(id: string): Promise<ApiResponseInterface<null>> {
    try {
      this.logger.info('Deleting user', { userId: id });

      const deletedUser = await this.userRepository.deleteUser(id);

      if (!deletedUser) {
        this.logger.warn('User deletion failed - user not found', { userId: id });
        return ErrorBuilder.build(ErrorCode.USER_NOT_FOUND, "User not found");
      }

      this.logger.info('User deleted successfully', { userId: id });
      return ResponseBuilder.success(null, "User deleted successfully");
    } catch (error) {
      const err = error as Error;
      this.logger.error('Error deleting user', { error: err.message, userId: id });
      return ErrorBuilder.build(ErrorCode.INTERNAL_SERVER_ERROR, "Failed to delete user");
    }
  }

  // Check verification status
  async checkVerificationStatus(email: string): Promise<ApiResponseInterface<{isVerified: boolean; email: string}>> {
    try {
      this.logger.info('Checking verification status', { email });

      const result = await this.getUserByEmail(email);

      if (result.success && result.data) {
        const isVerified = result.data.verified;
        this.logger.info('Verification status checked', { email, isVerified });
        return ResponseBuilder.success({
          isVerified: isVerified,
          email: result.data.email
        });
      } else {
        this.logger.warn('Verification status check failed - user not found', { email });
        return result as any; // Return the error from getUserByEmail
      }
    } catch (err: any) {
      this.logger.error('Error checking verification status', { error: err.message, email });
      return ErrorBuilder.build(ErrorCode.INTERNAL_SERVER_ERROR, "Failed to check verification status", err.message);
    }
  }
}