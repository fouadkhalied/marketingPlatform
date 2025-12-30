import { Router } from "express";
import { createDashboardController, createAnalyticsAdController } from "../factories/dashboard.factory";
import { AuthMiddleware } from "../../../../infrastructure/shared/common/auth/module/authModule";
import { UserRole } from "../../../../infrastructure/shared/common/auth/enums/userRole";

export function setupDashboardRoutes(): Router {
  const router = Router();
  const dashboardController = createDashboardController();
  const analyticsController = createAnalyticsAdController();

  // User dashboard route
  router.get('/api/dashboard/user',
    AuthMiddleware(UserRole.USER),
    (req, res) => dashboardController.getUserDashboard(req, res)
  );

  // Admin dashboard route
  router.get('/api/dashboard/admin',
    AuthMiddleware(UserRole.ADMIN),
    (req, res) => dashboardController.getAdminDashboard(req, res)
  );

  // Ad analytics route
  router.get(
    "/api/users/ad/:adId/analytics-full-details",
    AuthMiddleware(UserRole.USER),
    (req, res) => analyticsController.getAdAnalyticsFullDetails(req, res)
  );

  return router;
}
