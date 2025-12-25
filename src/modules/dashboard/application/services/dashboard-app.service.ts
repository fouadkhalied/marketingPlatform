import { ResponseBuilder } from "../../../../infrastructure/shared/common/apiResponse/apiResponseBuilder";
import { ApiResponseInterface } from "../../../../infrastructure/shared/common/apiResponse/interfaces/apiResponse.interface";
import { ErrorCode } from "../../../../infrastructure/shared/common/errors/enums/basic.error.enum";
import { ErrorBuilder } from "../../../../infrastructure/shared/common/errors/errorBuilder";
import { ILogger } from "../../../../infrastructure/shared/common/logging";
import { IDashboardRepository } from "../../domain/repositories/dashboard.repository.interface";

export class DashboardAppService {
  constructor(
    private readonly dashboardRepository: IDashboardRepository,
    private readonly logger: ILogger
  ) {}

  async getUserDashboard(userId: string): Promise<ApiResponseInterface<any>> {
    try {
      const stats = await this.dashboardRepository.getDashboardStats(userId, 7);
      const chartData = await this.dashboardRepository.getChartData(userId, 7);
      const topAds = await this.dashboardRepository.getTopPerformingAds(userId, 3);
      const activity = await this.dashboardRepository.getRecentActivity(userId, 10);

      return ResponseBuilder.success({
        stats,
        chartData,
        topAds,
        activity
      });
    } catch (error) {
      return ErrorBuilder.build(
        ErrorCode.INTERNAL_SERVER_ERROR,
        "Unexpected error while fetching dashboard data",
        error instanceof Error ? error.message : error
      );
    }
  }

  async getAdminDashboard(days: number = 7): Promise<ApiResponseInterface<any>> {
    try {
      const stats = await this.dashboardRepository.getAdminDashboardStats(days);
      const chartData = await this.dashboardRepository.getAdminChartData(days);
      const recentActivity = await this.dashboardRepository.getAdminRecentActivity(10);
      const systemOverview = await this.dashboardRepository.getSystemOverview();

      return ResponseBuilder.success({
        stats,
        chartData,
        recentActivity,
        systemOverview
      });
    } catch (error) {
      return ErrorBuilder.build(
        ErrorCode.INTERNAL_SERVER_ERROR,
        "Unexpected error while fetching admin dashboard data",
        error instanceof Error ? error.message : error
      );
    }
  }
}
