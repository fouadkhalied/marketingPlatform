import axios, { AxiosError, AxiosInstance } from "axios";
import { FacebookTokenResponse } from "../../../../infrastructure/shared/common/auth/interfaces/facebookAuthResponse";
import { appConfig } from "../../../../infrastructure/config/app.config";
import { TokenExchangeParams } from "../dtos/facebookDto/tokenExchangeParams";
import { ErrorBuilder } from "../../../../infrastructure/shared/common/errors/errorBuilder";
import { ErrorCode } from "../../../../infrastructure/shared/common/errors/enums/basic.error.enum";
import { FacebookPostInsights } from "../dtos/facebookDto/facebookInsights.dto";
import { FacebookPageRepository } from "../../domain/repositories/facebook.interface";
import { FacebookPage } from "../dtos/facebookDto/facebookPage.dto";
import { FacebookPagesResponse } from "../dtos/facebookDto/facebookPageResponse.dto";
import { FacebookPost } from "../dtos/facebookDto/facebookPost.dto";


export class FacebookPageService {
  private axiosInstance: AxiosInstance;
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor(private readonly facebookRepository: FacebookPageRepository) {
    this.axiosInstance = axios.create({
      baseURL: "https://graph.facebook.com/v20.0",
      timeout: 15000,
    });
    this.clientId = appConfig.FACEBOOK_APP_ID;
    this.clientSecret = appConfig.FACEBOOK_APP_SECRET;
    this.redirectUri = appConfig.FACEBOOK_REDIRECT_URI;
  }

  // OAuth Token Exchange with Page Access Token Saving
  
  async exchangeCodeForToken(params: TokenExchangeParams): Promise<FacebookTokenResponse> {
    try {
      const response = await this.axiosInstance.get<FacebookTokenResponse>(
        "/oauth/access_token",
        {
          params: {
            client_id: this.clientId,
            client_secret: this.clientSecret,
            redirect_uri: this.redirectUri,
            code: params.code,
            ...(params.state && { state: params.state }),
          },
        }
      );

      if (!response.data.access_token) {
        throw ErrorBuilder.build(ErrorCode.INVALID_INPUT, "No access token received from Facebook");
      }

      return response.data;

    } catch (error) {
      if (error instanceof Error && error.message.includes("ErrorBuilder")) {
        throw error; // Re-throw ErrorBuilder errors
      }
      
      if (error instanceof AxiosError) {
        const errorMessage = error.response?.data?.error?.message || error.message;
        const errorCode = error.response?.data?.error?.code;
        
        if (errorCode === 100) {
          throw ErrorBuilder.build(
            ErrorCode.UNAUTHORIZED, 
            `Invalid authorization code. Please authenticate again: ${appConfig.FACEBOOK_AUTH_URL}`
          );
        }
        
        throw ErrorBuilder.build(
          ErrorCode.INVALID_INPUT, 
          `Facebook OAuth error: ${errorMessage}`
        );
      }
      
      throw ErrorBuilder.build(ErrorCode.INTERNAL_SERVER_ERROR, "OAuth token exchange failed");
    }
  }

  // Step 2: Get User's Pages with their access tokens
  async getUserPagesAndSaveTokens(
    userAccessToken: string, 
    userId: string
  ): Promise<{ pages: FacebookPage[]; savedPages: string[] }> {
    try {
      const response = await this.axiosInstance.get<FacebookPagesResponse>(
        "/me/accounts",
        {
          params: {
            access_token: userAccessToken,
          },
        }
      );

      if (!response.data.data) {
        throw ErrorBuilder.build(ErrorCode.RESOURCE_NOT_FOUND, "No pages found for this user");
      }

      const pages = response.data.data;
      const savedPages: string[] = [];

      // Save page access tokens to database if repository is available
      if (this.facebookRepository) {
        try {
          for (const page of pages) {
            await this.facebookRepository.savePageAccessToken(
              userId, 
              page.id, 
              page.access_token, 
              page.name
            );
            savedPages.push(page.id);
          }
        } catch (saveError) {
          console.error("Failed to save page access tokens:", saveError);
          throw ErrorBuilder.build(
            ErrorCode.DATABASE_ERROR, 
            "Failed to save page access tokens to database"
          );
        }
      }

      return {
        pages,
        savedPages
      };

    } catch (error) {
      if (error instanceof Error && error.message.includes("ErrorBuilder")) {
        throw error; // Re-throw ErrorBuilder errors
      }

      if (error instanceof AxiosError) {
        const errorMessage = error.response?.data?.error?.message || error.message;
        const errorCode = error.response?.data?.error?.code;
        
        if (errorCode === 190) {
          throw ErrorBuilder.build(
            ErrorCode.UNAUTHORIZED, 
            `User access token expired or invalid. Please re-authenticate: ${appConfig.FACEBOOK_AUTH_URL}`
          );
        } else if (errorCode === 200 || errorCode === 10) {
          throw ErrorBuilder.build(
            ErrorCode.FORBIDDEN, 
            `Insufficient permissions to access pages. Please re-authenticate with 'pages_manage_posts' permission: ${appConfig.FACEBOOK_AUTH_URL}`
          );
        }
        
        throw ErrorBuilder.build(
          ErrorCode.EXTERNAL_SERVICE_ERROR, 
          `Failed to fetch user pages: ${errorMessage}`
        );
      }
      
      throw ErrorBuilder.build(ErrorCode.INTERNAL_SERVER_ERROR, "Failed to fetch user pages");
    }
  }

  // Validate page access token with proper error handling
  private async validatePageAccess(pageId: string, pageAccessToken: string): Promise<boolean> {
    try {
      await this.axiosInstance.get(`/${pageId}`, {
        params: {
          access_token: pageAccessToken,
          fields: "id,name",
        },
      });
      return true;
    } catch (error) {
      if (error instanceof AxiosError) {
        const errorCode = error.response?.data?.error?.code;
        const errorMessage = error.response?.data?.error?.message || "Authentication required";
        
        if (errorCode === 190) {
          throw ErrorBuilder.build(
            ErrorCode.UNAUTHORIZED, 
            `Access token expired or invalid. Please re-authenticate: ${appConfig.FACEBOOK_AUTH_URL}`
          );
        } else if (errorCode === 200 || errorCode === 10) {
          throw ErrorBuilder.build(
            ErrorCode.FORBIDDEN, 
            `Insufficient permissions to access this page. Please re-authenticate with proper permissions: ${appConfig.FACEBOOK_AUTH_URL}`
          );
        } else if (errorCode === 803) {
          throw ErrorBuilder.build(
            ErrorCode.FORBIDDEN, 
            `Page access restricted. Please ensure you have admin access to this page: ${appConfig.FACEBOOK_AUTH_URL}`
          );
        }
        
        throw ErrorBuilder.build(
          ErrorCode.BAD_REQUEST, 
          `Page validation failed: ${errorMessage}. Re-authenticate: ${appConfig.FACEBOOK_AUTH_URL}`
        );
      }
      return false;
    }
  }

  // 1. Get Page Posts with improved error handling
  async getPagePosts(
    pageId: string,
    pageAccessToken: string,
    options: {
      limit?: number;
      since?: string;
      until?: string;
      fields?: string[];
    } = {}
  ): Promise<{
    posts: FacebookPost[];
    paging?: {
      next?: string;
      previous?: string;
    };
  }> {
    try {
      // Validate access first - this will throw ErrorBuilder errors if invalid
      await this.validatePageAccess(pageId, pageAccessToken);

      // Log API usage 
      await this.facebookRepository.logApiUsage("system", `/${pageId}/posts`, new Date());

      const defaultFields = [
        "id",
        "message",
        "story",
        "created_time",
        "updated_time",
        "type",
        "status_type",
        "permalink_url",
        "full_picture",
        "attachments{type,url,media}"
      ];

      const response = await this.axiosInstance.get<{
        data: FacebookPost[];
        paging?: {
          next?: string;
          previous?: string;
        };
      }>(`/${pageId}/posts`, {
        params: {
          access_token: pageAccessToken,
          limit: options.limit || 25,
          fields: (options.fields || defaultFields).join(","),
          ...(options.since && { since: options.since }),
          ...(options.until && { until: options.until }),
        },
      });

      if (!response.data.data) {
        return { posts: [] };
      }

      return {
        posts: response.data.data,
        paging: response.data.paging,
      };

    } catch (error) {
      // Re-throw ErrorBuilder errors from validation
      if (error instanceof Error && error.message.includes("ErrorBuilder")) {
        throw error;
      }
      
      if (error instanceof AxiosError) {
        const errorCode = error.response?.data?.error?.code;
        const errorMessage = error.response?.data?.error?.message || error.message;
        
        // Handle specific Facebook API errors
        if (errorCode === 190) {
          throw ErrorBuilder.build(
            ErrorCode.UNAUTHORIZED, 
            `Access token expired. Please re-authenticate: ${appConfig.FACEBOOK_AUTH_URL}`
          );
        } else if (errorCode === 200 || errorCode === 10) {
          throw ErrorBuilder.build(
            ErrorCode.FORBIDDEN, 
            `Insufficient permissions to access page posts. Please re-authenticate: ${appConfig.FACEBOOK_AUTH_URL}`
          );
        } else if (errorCode === 803) {
          throw ErrorBuilder.build(
            ErrorCode.FORBIDDEN, 
            `Some posts may be unavailable due to privacy restrictions. Re-authenticate: ${appConfig.FACEBOOK_AUTH_URL}`
          );
        } else if (errorCode === 613) {
          throw ErrorBuilder.build(
            ErrorCode.TOO_MANY_REQUESTS, 
            "Rate limit exceeded. Please try again later"
          );
        }
        
        throw ErrorBuilder.build(
          ErrorCode.BAD_REQUEST, 
          `Failed to fetch page posts: ${errorMessage}`
        );
      }
      
      throw ErrorBuilder.build(ErrorCode.INTERNAL_SERVER_ERROR, "Unknown error occurred while fetching page posts");
    }
  }

  // 2. Get Post Insights with improved error handling
  async getPostInsights(
    postId: string,
    pageAccessToken: string,
    metrics: string[] = [
      "post_impressions",
      "post_engaged_users",
      "post_clicks",
      "post_reactions_like_total",
      "post_reactions_love_total",
      "post_reactions_wow_total",
      "post_reactions_haha_total",
      "post_reactions_sorry_total",
      "post_reactions_anger_total"
    ]
  ): Promise<FacebookPostInsights> {
    try {
      // Log API usage 

      await this.facebookRepository.logApiUsage("system", `/${postId}/insights`, new Date());

      const response = await this.axiosInstance.get<{
        data: Array<{
          name: string;
          values: Array<{
            value: number;
            end_time: string;
          }>;
          title: string;
          description: string;
        }>;
      }>(`/${postId}/insights`, {
        params: {
          access_token: pageAccessToken,
          metric: metrics.join(","),
        },
      });

      if (!response.data.data) {
        throw ErrorBuilder.build(
          ErrorCode.AD_NOT_FOUND, 
          "No insights data available for this post"
        );
      }

      return {
        post_id: postId,
        insights: response.data.data,
      };

    } catch (error) {
      // Re-throw ErrorBuilder errors
      if (error instanceof Error && error.message.includes("ErrorBuilder")) {
        throw error;
      }
      
      if (error instanceof AxiosError) {
        const errorCode = error.response?.data?.error?.code;
        const errorMessage = error.response?.data?.error?.message || error.message;
        
        // Handle specific insights errors
        if (errorCode === 100) {
          throw ErrorBuilder.build(
            ErrorCode.AD_NOT_FOUND, 
            "Post not found or you don't have permission to view its insights"
          );
        } else if (errorCode === 190) {
          throw ErrorBuilder.build(
            ErrorCode.UNAUTHORIZED, 
            `Access token expired or invalid. Please re-authenticate: ${appConfig.FACEBOOK_AUTH_URL}`
          );
        } else if (errorCode === 200 || errorCode === 10) {
          throw ErrorBuilder.build(
            ErrorCode.FORBIDDEN, 
            `Insufficient permissions to access post insights. Please re-authenticate: ${appConfig.FACEBOOK_AUTH_URL}`
          );
        } else if (errorCode === 613) {
          throw ErrorBuilder.build(
            ErrorCode.TOO_MANY_REQUESTS, 
            "Rate limit exceeded. Please try again later"
          );
        } else if (errorCode === 17) {
          throw ErrorBuilder.build(
            ErrorCode.TOO_MANY_REQUESTS, 
            "User request limit reached. Please try again later"
          );
        }
        
        throw ErrorBuilder.build(
          ErrorCode.BAD_REQUEST, 
          `Failed to fetch post insights: ${errorMessage}`
        );
      }
      
      throw ErrorBuilder.build(ErrorCode.INTERNAL_SERVER_ERROR, "Unknown error occurred while fetching post insights");
    }
  }
}