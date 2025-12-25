import { AdminChartData, AdminDashboardStats, ChartData, DashboardStats, RecentActivity, TopPerformingAd } from "../../application/dtos/dashboard.interfaces";

export interface IDashboardRepository {
  getDashboardStats(userId: string, days: number): Promise<DashboardStats>;
  getChartData(userId: string, days: number): Promise<ChartData[]>;
  getTopPerformingAds(userId: string, limit: number): Promise<TopPerformingAd[]>;
  getRecentActivity(userId: string, limit: number): Promise<RecentActivity[]>;
  getAdminDashboardStats(days: number): Promise<AdminDashboardStats>;
  getAdminChartData(days: number): Promise<AdminChartData[]>;
  getAdminRecentActivity(limit: number): Promise<RecentActivity[]>;
  getSystemOverview(): Promise<any>;
}
