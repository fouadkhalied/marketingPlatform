export interface ChartData {
  date: string;
  clicks: number;
  impressions: number;
}

export interface AdAnalyticsFullDetails {

  // Analytics data
  analytics: {
    freeViews: number;
    totalImpressions: number;
    totalClicks: number;
    clickThroughRate: number;
    websiteClicks: number;
    likesCount: number;
    performance: {
      dailyBreakdown: {
        date: string;
        clicks: number;
        impressions: number;
      }[];
      growthMetrics: {
        impressionGrowth: number;
        clickGrowth: number;
        ctrGrowth: number;
      };
    };
    source: {
      type: string;
      views: number;
    }[];
    financials: {
      totalBudgetImpressions: number;  // Total impressions allocated (was totalBudgetCredits)
      usedImpressions: number;          // Impressions consumed so far (was spentAmount)
      remainingImpressions: number;     // Impressions still available (was remainingCredits)
      costPerImpression: number;        // Cost per single impression
      totalCostSpent: number;           // Monetary value of impressions used
      totalBudgetCost: number;          // Monetary value of total budget
      currency: string;                 // Currency code (e.g., 'sar')
    }
  };
}
