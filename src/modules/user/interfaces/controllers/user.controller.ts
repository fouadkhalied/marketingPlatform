// user/interfaces/controllers/user.controller.ts
import { Request, Response } from 'express';
import { UserAppService } from "../../application/services/user-app.service";
import { CreateUser } from '../../../../infrastructure/shared/schema/schema';
import { ApiResponseInterface } from '../../../../infrastructure/shared/common/apiResponse/interfaces/apiResponse.interface';
import { ERROR_STATUS_MAP } from '../../../../infrastructure/shared/common/errors/mapper/mapperErrorEnum';
import { PaginationParams } from '../../../../infrastructure/shared/common/pagination.vo';
import { appConfig } from '../../../../infrastructure/config/app.config';

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

interface GetUserByIdRequest extends Request {
  params: { id: string };
}

interface GetUserByEmailRequest extends Request {
  query: { email: string };
}

interface GetUserByUsernameRequest extends Request {
  query: { username: string };
}

interface UpdateStripeInfoRequest extends Request {
  params: { id: string };
  body: { customerId: string; subscriptionId?: string };
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

export class UserController {
  constructor(private readonly userService: UserAppService) {}

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
      const result = await this.userService.createUser(req.body);
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

      const result = await this.userService.login(email, password);
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

  // Get user by ID
  async getUser(req: GetUserByIdRequest, res: Response): Promise<void> {
    try {
      const result = await this.userService.getUser(req.params.id);
      const statusCode = this.getStatusCode(result);
      
      res.status(statusCode).json(result);
    } catch (err: any) {
      console.error('Error fetching user:', err);
      
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch user',
          details: err.message
        }
      });
    }
  }

  // Get user by email
  async getUserByEmail(req: GetUserByEmailRequest, res: Response): Promise<void> {
    try {
      const { email } = req.query;
      
      if (!email) {
        res.status(400).json({
          success: false,
          message: 'Email parameter is required',
          error: {
            code: 'MISSING_REQUIRED_FIELD',
            message: 'Email parameter is required'
          }
        });
        return;
      }

      const result = await this.userService.getUserByEmail(email);
      const statusCode = this.getStatusCode(result);
      
      res.status(statusCode).json(result);
    } catch (err: any) {
      console.error('Error fetching user by email:', err);
      
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch user by email',
          details: err.message
        }
      });
    }
  }

  // Get user by username
  async getUserByUsername(req: GetUserByUsernameRequest, res: Response): Promise<void> {
    try {
      const { username } = req.query;
      
      if (!username) {
        res.status(400).json({
          success: false,
          message: 'Username parameter is required',
          error: {
            code: 'MISSING_REQUIRED_FIELD',
            message: 'Username parameter is required'
          }
        });
      }

      const result = await this.userService.getUserByUsername(username);
      const statusCode = this.getStatusCode(result);
      
      res.status(statusCode).json(result);
    } catch (err: any) {
      console.error('Error fetching user by username:', err);
      
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch user by username',
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

      const result = await this.userService.verifyUser(email, otp);
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

      const result = await this.userService.resendVerificationOTP(email);
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

      const result = await this.userService.sendPasswordResetEmail(email);
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
       const result = await this.userService.verifyTokenAndChangePassword(email, password, token);
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

  // Check verification status
  async checkVerificationStatus(req: CheckVerificationRequest, res: Response): Promise<void> {
    try {
      const { email } = req.query;
      
      if (!email) {
        res.status(400).json({
          success: false,
          message: 'Email parameter is required',
          error: {
            code: 'MISSING_REQUIRED_FIELD',
            message: 'Email parameter is required'
          }
        });
      }

      const result = await this.userService.getUserByEmail(email);
      const statusCode = this.getStatusCode(result);
      
      if (result.success && result.data) {
        res.status(200).json({
          success: true,
          message: result.data.verified ? 'User is verified' : 'User is not verified',
          data: {
            isVerified: result.data.verified,
            email: result.data.email
          }
        });
      } else {
        res.status(statusCode).json(result);
      }
    } catch (err: any) {
      console.error('Error checking verification status:', err);
      
      res.status(500).json({
        success: false,
        message: 'Failed to check verification status',
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to check verification status',
          details: err.message
        }
      });
    }
  }

  
  async facebookOAuth(req: Request, res: Response): Promise<void> {
    try {
      const { code, state } = req.query;

      // Validate required parameters
      if (!code) {
        res.status(400).json({
          error: "Missing authorization code",
          message: "Facebook authorization code is required"
        });
        return;
      }

      if (!state) {
        res.status(400).json({
          error: "Missing state parameter",
          message: "State parameter is required for security"
        });
        return;
      }

      // Exchange code for access token and get user data
      const authResult = await this.userService.tokenExchange(
        code as string, 
        state as string, 
        appConfig.FACEBOOK_APP_SECRET_STATE
      );

      // Return success response
      res.json({
        success: true,
        data: {
          accessToken: authResult.data
        }
      });

    } catch (error) {
      console.error("Facebook OAuth error:", error);
      
      // Handle different types of errors
      if (error instanceof Error) {
        if (error.message.includes("Invalid state parameter")) {
          res.status(400).json({
            error: "Invalid state parameter",
            message: "Possible CSRF attack detected"
          });
          return;
        }

        if (error.message.includes("Facebook OAuth error")) {
          res.status(400).json({
            error: "Facebook authentication failed",
            message: "Invalid authorization code or Facebook service error"
          });
          return;
        }
      }

      // Generic error response
      res.status(500).json({
        error: "Internal server error",
        message: "Facebook authentication failed"
      });
    }
  }

  async getUsers(req: Request, res: Response): Promise<void> {
    try {
      const { limit, page } = req.query;

      const pagination: PaginationParams = {
        page: page && !isNaN(Number(page)) && Number(page) > 0 ? Number(page) : 1,
        limit: limit && !isNaN(Number(limit)) && Number(limit) > 0 ? Number(limit) : 10,
      };
  
      const result = await this.userService.getUsers(pagination);
      const statusCode = this.getStatusCode(result);
      
      res.status(statusCode).json(result);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch users',
          details: err.message
        }
      });
    }
  }

  // Update Stripe info
  async updateUserStripeInfo(req: UpdateStripeInfoRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { customerId, subscriptionId } = req.body;

      if (!customerId) {
        res.status(400).json({
          success: false,
          message: 'Customer ID is required',
          error: {
            code: 'MISSING_REQUIRED_FIELD',
            message: 'Customer ID is required'
          }
        });
      }

      const result = await this.userService.updateUserStripeInfo(
        id,
        customerId,
        subscriptionId
      );
      
      const statusCode = this.getStatusCode(result);
      res.status(statusCode).json(result);
    } catch (err: any) {
      console.error('Error updating Stripe info:', err);
      
      res.status(500).json({
        success: false,
        message: 'Failed to update Stripe information',
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update Stripe information',
          details: err.message
        }
      });
    }
  }
}