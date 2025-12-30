import { ResponseBuilder } from "../../../../infrastructure/shared/common/apiResponse/apiResponseBuilder";
import { ApiResponseInterface } from "../../../../infrastructure/shared/common/apiResponse/interfaces/apiResponse.interface";
import { ErrorCode } from "../../../../infrastructure/shared/common/errors/enums/basic.error.enum";
import { ErrorBuilder } from "../../../../infrastructure/shared/common/errors/errorBuilder";
import { UserRepository } from "../../infrastructure/repositories/UserRepository";
import { ILogger } from "../../../../infrastructure/shared/common/logging";

export class EmailAppService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly logger: ILogger
  ) {}

  async addUserEmail(email: string): Promise<ApiResponseInterface<boolean>> {
    try {
      this.logger.info('User service: Adding user email', { email });

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        this.logger.warn('User service: Invalid email format', { email });
        return ErrorBuilder.build(
          ErrorCode.VALIDATION_ERROR,
          "Invalid email format"
        );
      }

      const result = await this.userRepository.addUserEmail(email);

      this.logger.info('User service: User email added successfully', { email, result });
      return ResponseBuilder.success(result);
    } catch (error) {
      this.logger.error('User service: Failed to add user email', {
        email,
        error: error instanceof Error ? error.message : error
      });
      return ErrorBuilder.build(
        ErrorCode.INTERNAL_SERVER_ERROR,
        "Failed to add user email",
        error instanceof Error ? error.message : error
      );
    }
  }
}