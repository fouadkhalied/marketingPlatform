import { DashboardController } from "../controllers/dashboard.controller";
import { DashboardAppService } from "../../application/services/dashboard-app.service";
import { DashboardRepository } from "../../infrastructure/repositories/dashboard.repository";
import { createLogger } from "../../../../infrastructure/shared/common/logging";

export function createDashboardController(): DashboardController {
  const logger = createLogger();
  const dashboardRepository = new DashboardRepository();
  const dashboardService = new DashboardAppService(dashboardRepository, logger);
  const dashboardController = new DashboardController(dashboardService);

  return dashboardController;
}
