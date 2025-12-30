import { DashboardController } from "../controllers/dashboard.controller";
import { DashboardAppService } from "../../application/services/dashboard-app.service";
import { DashboardRepository } from "../../infrastructure/repositories/dashboard.repository";
import { AnalyticsAdController } from "../controllers/analytics-ad.controller";
import { AnalyticsAppService } from "../../application/services/analytics-app.service";
import { AnalyticsRepository } from "../../infrastructure/repositories/analytics.repository";
import { createLogger } from "../../../../infrastructure/shared/common/logging";

export function createDashboardController(): DashboardController {
  const logger = createLogger();
  const dashboardRepository = new DashboardRepository();
  const dashboardService = new DashboardAppService(dashboardRepository, logger);
  const dashboardController = new DashboardController(dashboardService);

  return dashboardController;
}

export function createAnalyticsAdController(): AnalyticsAdController {
  const logger = createLogger();
  const analyticsRepository = new AnalyticsRepository();
  const analyticsService = new AnalyticsAppService(analyticsRepository, logger);
  const analyticsController = new AnalyticsAdController(analyticsService);

  return analyticsController;
}
