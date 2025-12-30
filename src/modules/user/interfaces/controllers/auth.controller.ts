// user/interfaces/controllers/auth.controller.ts
import { Request, Response } from 'express';
import { AuthAppService } from "../../application/services/auth-app.service";
import { CreateUser } from '../../../../infrastructure/shared/schema/schema';
import { ApiResponseInterface } from '../../../../infrastructure/shared/common/apiResponse/interfaces/apiResponse.interface';
import { ERROR_STATUS_MAP } from '../../../../infrastructure/shared/common/errors/mapper/mapperErrorEnum';
import { ErrorBuilder } from '../../../../infrastructure/shared/common/errors/errorBuilder';
import { ErrorCode } from '../../../../infrastructure/shared/common/errors/enums/basic.error.enum';

// Custom request interfaces for better type safety
interface CreateUserRequest extends Request {
  body: CreateUser;
}

interface LoginRequest extends Request {
  body: {
    email: string;
    password: string;
  };
}

interface VerifyUserRequest extends Request {
  body: {
    email: string;
    otp: string;
  };
}

interface ResendOTPRequest extends Request {
  body: {
    email: string;
  };
}

interface ResetPasswordRequest extends Request {
  body: {
    email: string;
  };
}

export interface UpdatePasswordRequest extends Request {
   body: {
    email: string;
    password: string;
    token: string;
   };
  }

export interface CheckVerificationRequest extends Request {
  query: {
    email: string;
  };
}

export class AuthController {
  constructor(
    private readonly authService: AuthAppService
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

  // Create a new user
  async createUser(req: CreateUserRequest, res: Response): Promise<void> {
    try {
      const result = await this.authService.createUser(req.body);
      const statusCode = this.getStatusCode(result);

      // Use 201 for successful creation, otherwise use the error status
      const responseStatusCode = result.success ? 201 : statusCode;

      res.status(responseStatusCode).json(result);
    } catch (err: any) {
      console.error('Error creating user:', err);

      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create user',
          details: err.message
        }
      });
    }
  }

  // Login user
  async login(req: LoginRequest, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({
          success: false,
          message: 'Email and password are required',
          error: {
            code: 'MISSING_REQUIRED_FIELD',
            message: 'Email and password are required'
          }
        });
        return;
      }

      const result = await this.authService.login(email, password);
      const statusCode = this.getStatusCode(result);

      res.status(statusCode).json(result);
    } catch (err: any) {
      console.error('Error during login:', err);

      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Login failed',
          details: err.message
        }
      });
    }
  }

  async verifyUser(req: VerifyUserRequest, res: Response): Promise<void> {
    try {
      const { email, otp } = req.body;

      if (!email || !otp) {
        res.status(400).json({
          success: false,
          message: 'Email and OTP are required',
          error: {
            code: 'MISSING_REQUIRED_FIELD',
            message: 'Email and OTP are required'
          }
        });
      }

      const result = await this.authService.verifyUser(email, otp);
      const statusCode = this.getStatusCode(result);

      res.status(statusCode).json(result);
    } catch (err: any) {
      console.error('Error verifying user:', err);

      res.status(500).json({
        success: false,
        message: 'Internal server error during verification',
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to verify user',
          details: err.message
        }
      });
    }
  }

  // Resend verification OTP
  async resendVerificationOTP(req: ResendOTPRequest, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      if (!email) {
         res.status(400).json({
          success: false,
          message: 'Email is required',
          error: {
            code: 'MISSING_REQUIRED_FIELD',
            message: 'Email is required'
          }
        });
      }

      const result = await this.authService.resendVerificationOTP(email);
      const statusCode = this.getStatusCode(result);

      res.status(statusCode).json(result);
    } catch (err: any) {
      console.error('Error resending OTP:', err);

      res.status(500).json({
        success: false,
        message: 'Failed to resend verification OTP',
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to resend verification OTP',
          details: err.message
        }
      });
    }
  }

  // Resend verification OTP
  async sendPasswordResetEmail(req: ResetPasswordRequest, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      if (!email) {
         res.status(400).json({
          success: false,
          message: 'Email is required',
          error: {
            code: 'MISSING_REQUIRED_FIELD',
            message: 'Email is required'
          }
        });
      }

      const result = await this.authService.sendPasswordResetEmail(email);
      const statusCode = this.getStatusCode(result);

      res.status(statusCode).json(result);
    } catch (err: any) {
      console.error('Error resending OTP:', err);

      res.status(500).json({
        success: false,
        message: 'Failed to resend verification OTP',
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to resend verification OTP',
          details: err.message
        }
      });
    }
  }

  async updatePassword(req: UpdatePasswordRequest, res: Response): Promise<void> {
      try {
       const { email, password, token } = req.body;

       // Validate that all required fields are present
       if (!email || !password || !token) {
        res.status(400).json({
         success: false,
         message: 'Email, password, and token are required',
         error: {
          code: 'MISSING_REQUIRED_FIELD',
          message: 'Email, password, and token are required',
         },
        });
        return;
       }

       // Call the application service method to handle the business logic
       const result = await this.authService.verifyTokenAndChangePassword(email, password, token);
       const statusCode = this.getStatusCode(result);

       res.status(statusCode).json(result);
      } catch (err: any) {
       console.error('Error updating password:', err);

       res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: {
         code: 'INTERNAL_SERVER_ERROR',
         message: 'Failed to update password',
         details: err.message,
        },
       });
      }
     }
}