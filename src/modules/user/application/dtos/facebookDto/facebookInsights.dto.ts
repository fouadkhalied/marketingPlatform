export interface FacebookPostInsights {
  post_id: string;
  insights: {
    likes: number;
    comments: number;
    shares: number;
  };
}
