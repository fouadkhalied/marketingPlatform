import { Request, Response } from "express";
import { DashboardAppService } from "../../application/services/dashboard-app.service";

export class DashboardController {
  constructor(private readonly dashboardService: DashboardAppService) {}

  async getUserDashboard(req: Request, res: Response): Promise<void> {
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

      const result = await this.dashboardService.getUserDashboard(req.user.id);

      const statusCode = this.getStatusCode(result);
      res.status(statusCode).json(result);
    } catch (err: any) {
      console.error('Error fetching user dashboard:', err);

      res.status(500).json({
        success: false,
        message: 'Failed to fetch user dashboard',
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch user dashboard',
          details: err.message
        }
      });
    }
  }

  async getAdminDashboard(req: Request, res: Response): Promise<void> {
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

      const days = req.query.days ? parseInt(req.query.days as string) : 7;
      const result = await this.dashboardService.getAdminDashboard(days);

      const statusCode = this.getStatusCode(result);
      res.status(statusCode).json(result);
    } catch (err: any) {
      console.error('Error fetching admin dashboard:', err);

      res.status(500).json({
        success: false,
        message: 'Failed to fetch admin dashboard',
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch admin dashboard',
          details: err.message
        }
      });
    }
  }

  private getStatusCode(result: any): number {
    if (result.success) {
      return 200;
    }

    // Check error codes for appropriate HTTP status
    switch (result.error?.code) {
      case 'UNAUTHORIZED':
        return 401;
      case 'FORBIDDEN':
        return 403;
      case 'NOT_FOUND':
        return 404;
      case 'VALIDATION_ERROR':
        return 400;
      default:
        return 500;
    }
  }
}
