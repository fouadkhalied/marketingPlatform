// user/interfaces/controllers/profile.controller.ts
import { Request, Response } from 'express';
import { ProfileAppService } from "../../application/services/profile-app.service";
import { User } from '../../../../infrastructure/shared/schema/schema';
import { ApiResponseInterface } from '../../../../infrastructure/shared/common/apiResponse/interfaces/apiResponse.interface';
import { ERROR_STATUS_MAP } from '../../../../infrastructure/shared/common/errors/mapper/mapperErrorEnum';
import { ErrorBuilder } from '../../../../infrastructure/shared/common/errors/errorBuilder';
import { ErrorCode } from '../../../../infrastructure/shared/common/errors/enums/basic.error.enum';

export class ProfileController {
  constructor(
    private readonly profileService: ProfileAppService
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

  // Get user profile
  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user?.id) {
        res.status(401).json({
          success: false,
          message: "User must be authenticated",
          error: {
            code: "UNAUTHORIZED",
            message: "User must be authenticated"
          }
        });
        return;
      }

      const id = req.user.id;

      const result = await this.profileService.getProfile(id);
      const statusCode = this.getStatusCode(result);
      res.status(statusCode).json(result);
    } catch (err: any) {
      console.error('Error getting profile:', err);

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve profile',
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve profile',
          details: err.message
        }
      });
    }
  }

  // Update user profile
  async updateProfile(req: Request, res: Response): Promise<void> {
    try {

      if (!req.user?.id) {
        res.status(401).json({
          success: false,
          message: "User must be authenticated",
          error: {
            code: "UNAUTHORIZED",
            message: "User must be authenticated"
          }
        });
        return;
      }

      const result = await this.profileService.updateProfile(
        req.user.id,
        req.body
      );

      const statusCode = this.getStatusCode(result);
      res.status(statusCode).json(result);
    } catch (err: any) {
      console.error('Error updating profile:', err);

      res.status(500).json({
        success: false,
        message: 'Failed to update profile',
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update profile',
          details: err.message
        }
      });
    }
  }
}