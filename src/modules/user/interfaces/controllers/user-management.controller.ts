// user/interfaces/controllers/user-management.controller.ts
import { Request, Response } from 'express';
import { UserManagementAppService } from "../../application/services/user-management-app.service";
import { CheckVerificationRequest } from "./auth.controller";
import { ApiResponseInterface } from '../../../../infrastructure/shared/common/apiResponse/interfaces/apiResponse.interface';
import { ERROR_STATUS_MAP } from '../../../../infrastructure/shared/common/errors/mapper/mapperErrorEnum';
import { PaginationParams } from '../../../../infrastructure/shared/common/pagination.vo';
import { ErrorBuilder } from '../../../../infrastructure/shared/common/errors/errorBuilder';
import { ErrorCode } from '../../../../infrastructure/shared/common/errors/enums/basic.error.enum';

export class UserManagementController {
  constructor(
    private readonly userManagementService: UserManagementAppService
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

  // Get user by ID
  async getUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.id;
      console.log(userId);

      if (!userId) {
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

      const result = await this.userManagementService.getUser(userId);
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
  async getUserByEmail(req: Request, res: Response): Promise<void> {
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

      const result = await this.userManagementService.getUserByEmail(email as string);
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
  async getUserByUsername(req: Request, res: Response): Promise<void> {
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

      const result = await this.userManagementService.getUserByUsername(username as string);
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

  async makeUserAdmin(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        const errorResponse = ErrorBuilder.build(ErrorCode.MISSING_REQUIRED_FIELD, "User ID is required")
        res.status(400).json(errorResponse);
        return;
      }

      const result = await this.userManagementService.makeUserAdmin(id);
      const statusCode = this.getStatusCode(result);

      res.status(statusCode).json(result);
    } catch (err: any) {
      console.error("Error promoting user to admin:", err);

      const errorResponse = ErrorBuilder.build(ErrorCode.INTERNAL_SERVER_ERROR, "Failed to promote user to admin", err.message);

      res.status(500).json(errorResponse);
    }
  }

  async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        const errorResponse = ErrorBuilder.build(ErrorCode.MISSING_REQUIRED_FIELD, "User ID is required")
        res.status(400).json(errorResponse);
        return;
      }

      const result = await this.userManagementService.deleteUser(id);
      const statusCode = this.getStatusCode(result);

      res.status(statusCode).json(result);
    } catch (err: any) {
      console.error("Error deleting user:", err);

      const errorResponse = ErrorBuilder.build(ErrorCode.INTERNAL_SERVER_ERROR, "Failed to delete user", err.message);

      res.status(500).json(errorResponse);
    }
  }

  async getUsers(req: Request, res: Response): Promise<void> {
    try {
      const { limit, page } = req.query;

      const pagination: PaginationParams = {
        page: page && !isNaN(Number(page)) && Number(page) > 0 ? Number(page) : 1,
        limit: limit && !isNaN(Number(limit)) && Number(limit) > 0 ? Number(limit) : 10,
      };

      const result = await this.userManagementService.getUsers(pagination);
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

      const result = await this.userManagementService.checkVerificationStatus(email as string);
      const statusCode = this.getStatusCode(result);

      res.status(statusCode).json(result);
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
}