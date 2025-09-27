export interface FacebookPostInsights {
    post_id: string;
    insights: Array<{
      name: string;
      values: Array<{
        value: number;
        end_time: string;
      }>;
      title: string;
      description: string;
    }>;
  }