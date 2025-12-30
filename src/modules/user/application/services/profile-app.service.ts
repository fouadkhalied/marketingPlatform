import { ResponseBuilder } from "../../../../infrastructure/shared/common/apiResponse/apiResponseBuilder";
import { ApiResponseInterface } from "../../../../infrastructure/shared/common/apiResponse/interfaces/apiResponse.interface";
import { ErrorCode } from "../../../../infrastructure/shared/common/errors/enums/basic.error.enum";
import { ErrorBuilder } from "../../../../infrastructure/shared/common/errors/errorBuilder";
import { User } from "../../../../infrastructure/shared/schema/schema";
import { UserProfileRepository } from "../../infrastructure/repositories/UserProfileRepository";
import { ILogger } from "../../../../infrastructure/shared/common/logging";

export class ProfileAppService {
  constructor(
    private readonly profileRepository: UserProfileRepository,
    private readonly logger: ILogger
  ) {}

  async getProfile(id: string): Promise<ApiResponseInterface<Partial<User>>> {
    try {
      this.logger.info('Getting user profile', { userId: id });

      const profile = await this.profileRepository.getProfile(id);

      this.logger.info('Profile retrieved successfully', { userId: id });
      return ResponseBuilder.success(profile, "Profile retrieved successfully");
    } catch (error: any) {
      this.logger.error('Error getting profile', { error: error.message, userId: id });
      if (error.code && error.message) {
        return error;
      }
      return ErrorBuilder.build(
        ErrorCode.INTERNAL_SERVER_ERROR,
        error.message || "Failed to retrieve profile"
      );
    }
  }

// Update user profile
async updateProfile(
  id: string,
  updates:Pick<User, 'username' | 'password' | 'country'>
): Promise<ApiResponseInterface<Partial<User>>> {
  try {
    this.logger.info('Updating user profile', { userId: id, updates: Object.keys(updates) });

    const profile = await this.profileRepository.updateProfile(id, updates);

    if (!updates.username && !updates.country && !updates.password) {
      this.logger.warn('Profile update failed - no valid fields provided', { userId: id });
      return ErrorBuilder.build(ErrorCode.VALIDATION_ERROR, "at least one input should be provided username | password | country");
    }

    const allowedKeys = ["username", "password", "country"];

    const providedKeys = Object.keys(updates);
    const invalidKeys = providedKeys.filter(
      (key) => !allowedKeys.includes(key)
    );

    if (invalidKeys.length > 0) {
      this.logger.warn('Profile update failed - invalid fields', { userId: id, invalidKeys });
      return ErrorBuilder.build(
        ErrorCode.VALIDATION_ERROR,
        `Invalid field(s): ${invalidKeys.join(", ")}. Only username, password, and country are allowed.`
      );
    }

    this.logger.info('Profile updated successfully', { userId: id });
    return ResponseBuilder.success(profile, "Profile updated successfully");
  } catch (error: any) {
    this.logger.error('Error updating profile', { error: error.message, userId: id });
    if (error.code && error.message) {
      return error;
    }
    return ErrorBuilder.build(
      ErrorCode.INTERNAL_SERVER_ERROR,
      error.message || "Failed to update profile"
    );
  }
}
}