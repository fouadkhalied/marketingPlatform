export interface DashboardStats {
    totalImpressions: number;
    impressionGrowth: number;
    totalClicks: number;
    clickGrowth: number;
    clickThroughRate: number;
    ctrGrowth: number;
    remainingBalance: number;
    balanceGrowth: number;
  }
  
  export interface ChartData {
    date: string;
    clicks: number;
    impressions: number;
  }
  
  export interface TopPerformingAd {
    id: string;
    titleEn: string;
    titleAr: string;
    imageUrl: string | null;
    impressions: number;
    clicks: number;
    ctr: number;
  }
  