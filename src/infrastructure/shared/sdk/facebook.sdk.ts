import axios, { AxiosInstance } from 'axios';

interface FacebookConfig {
  appId: string;
  appSecret: string;
  version?: string;
}

interface FacebookUser {
  id: string;
  name: string;
  email?: string;
  picture?: {
    data: {
      url: string;
    };
  };
}

interface FacebookEngagement {
  userId: string;
  action: 'like' | 'unlike' | 'share' | 'comment';
  objectId: string;
  objectType: 'page' | 'post' | 'photo' | 'video' | 'comment';
  timestamp: Date;
}

interface FacebookPageData {
  id: string;
  name: string;
  likes: number;
  followers: number;
  engagement: {
    posts: number;
    reactions: number;
    shares: number;
    comments: number;
  };
}

export class FacebookSDKService {
  private config: FacebookConfig;
  private client: AxiosInstance;
  private baseUrl: string;

  constructor(config: FacebookConfig) {
    this.config = {
      ...config,
      version: config.version || 'v19.0'
    };

    this.baseUrl = `https://graph.facebook.com/${this.config.version}`;
    
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Generate App Access Token for server-side operations
   */
  async getAppAccessToken(): Promise<string> {
    try {
      const response = await this.client.get('/oauth/access_token', {
        params: {
          client_id: this.config.appId,
          client_secret: this.config.appSecret,
          grant_type: 'client_credentials'
        }
      });

      return response.data.access_token;
    } catch (error) {
      throw new Error(`Failed to get app access token: ${error}`);
    }
  }

  /**
   * Verify user access token
   */
  async verifyUserToken(userToken: string): Promise<boolean> {
    try {
      const appToken = await this.getAppAccessToken();
      
      const response = await this.client.get('/debug_token', {
        params: {
          input_token: userToken,
          access_token: appToken
        }
      });

      return response.data.data.is_valid && 
             response.data.data.app_id === this.config.appId;
    } catch (error) {
      console.error('Token verification failed:', error);
      return false;
    }
  }

  /**
   * Get user profile information
   */
  async getUserProfile(userToken: string, fields: string[] = ['id', 'name', 'email']): Promise<FacebookUser> {
    try {
      const response = await this.client.get('/me', {
        params: {
          access_token: userToken,
          fields: fields.join(',')
        }
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to get user profile: ${error}`);
    }
  }

  /**
   * Get user's pages (if user has page admin permissions)
   */
  async getUserPages(userToken: string): Promise<any[]> {
    try {
      const response = await this.client.get('/me/accounts', {
        params: {
          access_token: userToken,
          fields: 'id,name,access_token,category,followers_count'
        }
      });

      return response.data.data || [];
    } catch (error) {
      throw new Error(`Failed to get user pages: ${error}`);
    }
  }

  /**
   * Track user engagement activity
   */
  async trackEngagement(engagement: FacebookEngagement): Promise<void> {
    try {
      // Store in your database
      console.log('Tracking Facebook engagement:', engagement);
      
      // You would typically save this to your database here
      // await this.saveEngagementToDB(engagement);
      
    } catch (error) {
      console.error('Failed to track engagement:', error);
      throw error;
    }
  }

  /**
   * Get page insights/analytics
   */
  async getPageInsights(
    pageId: string, 
    pageToken: string, 
    metrics: string[] = ['page_fans', 'page_impressions', 'page_engaged_users']
  ): Promise<any> {
    try {
      const response = await this.client.get(`/${pageId}/insights`, {
        params: {
          access_token: pageToken,
          metric: metrics.join(','),
          period: 'day',
          since: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days ago
          until: new Date().toISOString().split('T')[0]
        }
      });

      return response.data.data;
    } catch (error) {
      throw new Error(`Failed to get page insights: ${error}`);
    }
  }

  /**
   * Get page posts
   */
  async getPagePosts(pageId: string, pageToken: string, limit: number = 25): Promise<any[]> {
    try {
      const response = await this.client.get(`/${pageId}/posts`, {
        params: {
          access_token: pageToken,
          fields: 'id,message,created_time,likes.summary(true),comments.summary(true),shares',
          limit
        }
      });

      return response.data.data || [];
    } catch (error) {
      throw new Error(`Failed to get page posts: ${error}`);
    }
  }

  /**
   * Post to Facebook page
   */
  async postToPage(
    pageId: string, 
    pageToken: string, 
    message: string, 
    link?: string
  ): Promise<string> {
    try {
      const postData: any = {
        access_token: pageToken,
        message
      };

      if (link) {
        postData.link = link;
      }

      const response = await this.client.post(`/${pageId}/feed`, postData);
      
      return response.data.id;
    } catch (error) {
      throw new Error(`Failed to post to page: ${error}`);
    }
  }

  /**
   * Get real-time engagement data for a post
   */
  async getPostEngagement(postId: string, accessToken: string): Promise<any> {
    try {
      const response = await this.client.get(`/${postId}`, {
        params: {
          access_token: accessToken,
          fields: 'likes.summary(true),comments.summary(true),shares,reactions.summary(true)'
        }
      });

      return {
        likes: response.data.likes?.summary?.total_count || 0,
        comments: response.data.comments?.summary?.total_count || 0,
        shares: response.data.shares?.count || 0,
        reactions: response.data.reactions?.summary?.total_count || 0
      };
    } catch (error) {
      throw new Error(`Failed to get post engagement: ${error}`);
    }
  }

  /**
   * Subscribe to webhook events (setup method)
   */
  setupWebhookSubscription(pageId: string, pageToken: string): Promise<boolean> {
    // This would typically be called during setup to subscribe to real-time updates
    return new Promise(async (resolve, reject) => {
      try {
        const response = await this.client.post(`/${pageId}/subscribed_apps`, {
          access_token: pageToken,
          subscribed_fields: 'feed,likes,comments,shares'
        });

        resolve(response.data.success);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Handle webhook payload from Facebook
   */
  handleWebhookEvent(payload: any): FacebookEngagement[] {
    const engagements: FacebookEngagement[] = [];

    if (payload.object === 'page') {
      payload.entry.forEach((entry: any) => {
        entry.changes?.forEach((change: any) => {
          if (['feed', 'likes', 'comments'].includes(change.field)) {
            engagements.push({
              userId: change.value.from?.id || 'unknown',
              action: this.mapChangeToAction(change.field, change.value.verb),
              objectId: change.value.post_id || change.value.comment_id,
              objectType: change.value.post_id ? 'post' : 'comment',
              timestamp: new Date(change.value.created_time * 1000)
            });
          }
        });
      });
    }

    return engagements;
  }

  /**
   * Helper method to map webhook changes to engagement actions
   */
  private mapChangeToAction(field: string, verb: string): FacebookEngagement['action'] {
    if (field === 'likes') {
      return verb === 'add' ? 'like' : 'unlike';
    }
    if (field === 'comments') {
      return 'comment';
    }
    if (field === 'feed' && verb === 'share') {
      return 'share';
    }
    return 'like'; // default
  }

  /**
   * Get comprehensive page analytics
   */
  async getPageAnalytics(pageId: string, pageToken: string): Promise<FacebookPageData> {
    try {
      const [pageInfo, insights, posts] = await Promise.all([
        this.client.get(`/${pageId}`, {
          params: {
            access_token: pageToken,
            fields: 'id,name,followers_count,fan_count'
          }
        }),
        this.getPageInsights(pageId, pageToken),
        this.getPagePosts(pageId, pageToken, 10)
      ]);

      // Calculate engagement metrics from recent posts
      const totalReactions = posts.reduce((sum, post) => 
        sum + (post.likes?.summary?.total_count || 0), 0);
      const totalComments = posts.reduce((sum, post) => 
        sum + (post.comments?.summary?.total_count || 0), 0);
      const totalShares = posts.reduce((sum, post) => 
        sum + (post.shares?.count || 0), 0);

      return {
        id: pageInfo.data.id,
        name: pageInfo.data.name,
        likes: pageInfo.data.fan_count || 0,
        followers: pageInfo.data.followers_count || 0,
        engagement: {
          posts: posts.length,
          reactions: totalReactions,
          shares: totalShares,
          comments: totalComments
        }
      };
    } catch (error) {
      throw new Error(`Failed to get page analytics: ${error}`);
    }
  }
}