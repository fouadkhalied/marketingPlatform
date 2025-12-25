import { AdAnalyticsFullDetails } from "../../application/dtos/analytics.dto";

export interface IAnalyticsRepository {
  getAdAnalyticsFullDetails(adId: string): Promise<AdAnalyticsFullDetails | undefined>;
}
