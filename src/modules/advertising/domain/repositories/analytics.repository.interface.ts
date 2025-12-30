import { AdAnalyticsFullDetails } from "../../application/dtos/analytics.dto";

export interface IAnalyticsRepository {
  checkAdOwnership(adId: string, userId: string): Promise<boolean>;
  getAdAnalyticsFullDetails(adId: string): Promise<AdAnalyticsFullDetails | undefined>;
}
