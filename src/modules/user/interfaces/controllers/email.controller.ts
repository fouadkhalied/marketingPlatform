// user/interfaces/controllers/email.controller.ts
import { Request, Response } from 'express';
import { EmailAppService } from "../../application/services/email-app.service";
import { ApiResponseInterface } from '../../../../infrastructure/shared/common/apiResponse/interfaces/apiResponse.interface';
import { ERROR_STATUS_MAP } from '../../../../infrastructure/shared/common/errors/mapper/mapperErrorEnum';
import { ErrorBuilder } from '../../../../infrastructure/shared/common/errors/errorBuilder';
import { ErrorCode } from '../../../../infrastructure/shared/common/errors/enums/basic.error.enum';

export class EmailController {
  constructor(
    private readonly emailService: EmailAppService
  ) {}

  // Helper method to get status code from error code
  private getStatusCode(response: ApiResponseInterface<any>): number {
    if (response.success) {
      return 200;
    }

    if (response.error?.code && ERROR_STATUS_MAP[response.error.code as keyof typeof ERROR_STATUS_MAP]) {
      return ERROR_STATUS_MAP[response.error.code as keyof typeof ERROR_STATUS_MAP];
    }

    return 500; // Default to internal server error
  }

  async addUserEmail(req: Request, res: Response): Promise<void> {
    try {
      console.log('User controller: Adding user email request', { body: req.body });

      const { email } = req.body;

      if (!email) {
        const errorResponse = ErrorBuilder.build(
          ErrorCode.MISSING_REQUIRED_FIELD,
          "Email is required"
        );
        res.status(ERROR_STATUS_MAP[ErrorCode.MISSING_REQUIRED_FIELD]).json(errorResponse);
        return;
      }

      console.log('User controller: Calling service with email', { email });
      const result = await this.emailService.addUserEmail(email);

      const statusCode = this.getStatusCode(result);
      console.log('User controller: Service response', { email, success: result.success, statusCode });

      res.status(statusCode).json(result);
    } catch (err: any) {
      console.error('User controller: Error adding user email', {
        body: req.body,
        error: err.message
      });

      const errorResponse = ErrorBuilder.build(
        ErrorCode.INTERNAL_SERVER_ERROR,
        "Failed to add user email",
        err.message
      );

      res.status(500).json(errorResponse);
    }
  }
}