import { Router } from "express";
import { createDashboardController } from "../factories/dashboard.factory";
import { AuthMiddleware } from "../../../../infrastructure/shared/common/auth/module/authModule";
import { UserRole } from "../../../../infrastructure/shared/common/auth/enums/userRole";

export function setupDashboardRoutes(): Router {
  const router = Router();
  const dashboardController = createDashboardController();

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

  return router;
}
