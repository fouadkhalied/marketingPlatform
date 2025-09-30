import { Request, Response, NextFunction } from 'express';
import { ApiResponseInterface } from '../../../../infrastructure/shared/common/apiResponse/interfaces/apiResponse.interface';
import { ERROR_STATUS_MAP } from '../../../../infrastructure/shared/common/errors/mapper/mapperErrorEnum';
import { AuthService } from '../../application/services/auth-app.service';

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Helper to get HTTP status from ApiResponse
  private getStatusCode(response: ApiResponseInterface<any>): number {
    if (response.success) return 200;

    if (response.error?.code && ERROR_STATUS_MAP[response.error.code as keyof typeof ERROR_STATUS_MAP]) {
      return ERROR_STATUS_MAP[response.error.code as keyof typeof ERROR_STATUS_MAP];
    }

    return 500;
  }

  // Initiate Google OAuth authentication
  googleAuth(req: Request, res: Response, next: NextFunction): void {
    this.authService.initiateGoogleAuth(req, res, next);
  }

  // Handle Google OAuth callback
  googleAuthCallback(req: Request, res: Response, next: NextFunction): void {
    this.authService.handleGoogleCallback(req, res, next);
  }

  // Set Google OAuth Strategy
  async setGoogleStrategy(): Promise<void> {
    try {
      await this.authService.setupGoogleStrategy();
    } catch (err: any) {
      console.error('Failed to set up Google strategy:', err);
    }
  }

  // Handle authentication failure
  authFailure(req: Request, res: Response): void {
    this.authService.handleAuthFailure(req, res);
  }

  // Logout user
  logout(req: Request, res: Response): void {
    this.authService.handleLogout(req, res);
  }

  // Get current authenticated user
  me(req: Request, res: Response): void {
    this.authService.getCurrentUser(req, res);
  }

  // Generate Google Auth URL
  async generateGoogleAuthUrl(req: Request, res: Response): Promise<void> {
    try {
      const authUrl = await this.authService.generateGoogleAuthUrl();
      const status_code = this.getStatusCode(authUrl);
      res.status(status_code).send(authUrl);
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
