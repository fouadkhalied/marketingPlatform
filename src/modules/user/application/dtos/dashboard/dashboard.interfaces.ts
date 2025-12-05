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
  

  export interface AdminDashboardStats {
    totalUsers: number;
    userGrowth: number;
    totalRevenue: number;
    revenueGrowth: number;
    activeAds: number;
    adsGrowth: number;
    totalImpressions: number;
    impressionGrowth: number;
  }
  
  export interface AdminChartData {
    date: string;
    clicks: number;
    impressions: number;
  }
  
  export interface RecentActivity {
    id: string;
    type: 'user_signup' | 'ad_created' | 'purchase' | 'ad_approved' | 'ad_rejected';
    description: string;
    userId?: string;
    username?: string | null;
    createdAt: Date;
  }

  export interface AdAnalyticsFullDetails {
   
    // Analytics data
    analytics: {
      totalImpressions: number;
      totalClicks: number;
      clickThroughRate: number;
      websiteClicks: number;
      likesCount: number;
      performance: {
        dailyBreakdown: ChartData[];
        growthMetrics: {
          impressionGrowth: number;
          clickGrowth: number;
          ctrGrowth: number;
        };
      };
    };
  }