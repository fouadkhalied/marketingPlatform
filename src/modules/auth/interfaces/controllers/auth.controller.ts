import { Request, Response, NextFunction } from 'express';
import { ApiResponseInterface } from '../../../../infrastructure/shared/common/apiResponse/interfaces/apiResponse.interface';
import { ERROR_STATUS_MAP } from '../../../../infrastructure/shared/common/errors/mapper/mapperErrorEnum';
import { ErrorBuilder } from '../../../../infrastructure/shared/common/errors/errorBuilder';
import { ErrorCode } from '../../../../infrastructure/shared/common/errors/enums/basic.error.enum';
import { AuthService } from '../../application/services/auth-app.service';



export class AuthController {
    constructor(private readonly authService: AuthService) {}
  
    // Helper method to get status code from error code
    private getStatusCode(response: ApiResponseInterface<any>): number {
      if (response.success) {
        return 200;
      }
      
      if (response.error?.code && ERROR_STATUS_MAP[response.error.code as keyof typeof ERROR_STATUS_MAP]) {
        return ERROR_STATUS_MAP[response.error.code as keyof typeof ERROR_STATUS_MAP];
      }
      
      return 500;
    }
  
    // Initiate Google OAuth authentication
    async googleAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const authenticator = await this.authService.initiateGoogleAuth();
        authenticator(req, res, next);
      } catch (err: any) {
        console.error('Error initiating Google auth:', err);
        
        res.status(500).json({
          success: false,
          message: 'Failed to initiate Google authentication',
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to initiate Google authentication',
            details: err.message
          }
        });
      }
    }
  
    // Handle Google OAuth callback
    async googleAuthCallback(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const handlers = await this.authService.handleGoogleCallback();
        
        // Execute passport authentication middleware
        handlers[0](req, res, (err?: any) => {
          if (err) {
            console.error('Google authentication error:', err);
            return next(err);
          }
          
          // Execute the callback handler
          handlers[1](req, res);
        });
      } catch (err: any) {
        console.error('Error in Google callback:', err);
        
        res.status(500).json({
          success: false,
          message: 'Google authentication callback failed',
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Google authentication callback failed',
            details: err.message
          }
        });
      }
    }
  
    // Handle authentication failure
    async authFailure(req: Request, res: Response): Promise<void> {
      try {
        await this.authService.handleAuthFailure(req, res);
      } catch (err: any) {
        console.error('Error handling auth failure:', err);
        
        res.status(500).json({
          success: false,
          message: 'Error handling authentication failure',
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Error handling authentication failure',
            details: err.message
          }
        });
      }
    }
  
    // Logout user
    async logout(req: Request, res: Response): Promise<void> {
      try {
        await this.authService.handleLogout(req, res);
      } catch (err: any) {
        console.error('Error during logout:', err);
        
        res.status(500).json({
          success: false,
          message: 'Logout failed',
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Logout failed',
            details: err.message
          }
        });
      }
    }
  
    // Get current authenticated user
    async me(req: Request, res: Response): Promise<void> {
      try {
        if (!req.user) {
          res.status(401).json({
            success: false,
            message: 'User not authenticated',
            error: {
              code: 'UNAUTHORIZED',
              message: 'User not authenticated'
            }
          });
          return;
        }
  
        await this.authService.getCurrentUser(req, res);
      } catch (err: any) {
        console.error('Error fetching current user:', err);
        
        res.status(500).json({
          success: false,
          message: 'Failed to fetch user information',
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to fetch user information',
            details: err.message
          }
        });
      }
    }


    async generateGoogleAuthUrl(req: Request, res: Response): Promise<void> {
      try {
        const authUrl = await this.authService.generateGoogleAuthUrl();

        const status_code = this.getStatusCode(authUrl);

        res.status(status_code).send(authUrl)
      } catch (err: any) {
        console.error('Error generating Google auth URL:', err);
        
        res.status(500).json({
          success: false,
          message: 'Failed to generate Google authentication URL',
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to generate Google authentication URL',
            details: err.message
          }
        });
      }
    }
  }
  