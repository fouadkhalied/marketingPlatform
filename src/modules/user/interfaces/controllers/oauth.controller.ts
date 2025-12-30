// user/interfaces/controllers/oauth.controller.ts
import { Request, Response } from 'express';
import { OAuthAppService } from "../../application/services/oauth-app.service";
import { ApiResponseInterface } from '../../../../infrastructure/shared/common/apiResponse/interfaces/apiResponse.interface';
import { ERROR_STATUS_MAP } from '../../../../infrastructure/shared/common/errors/mapper/mapperErrorEnum';
import { ErrorBuilder } from '../../../../infrastructure/shared/common/errors/errorBuilder';
import { ErrorCode } from '../../../../infrastructure/shared/common/errors/enums/basic.error.enum';

export class OAuthController {
  constructor(
    private readonly oauthService: OAuthAppService
  ) {}

  // Helper method to get status code from error code
  private getStatusCode(response: ApiResponseInterface<any>): number {
    if (response.success) {
      return 200;
    }

    if (response.error?.code && ERROR_STATUS_MAP[response.error.code as keyof typeof ERROR_STATUS_MAP]) {
      return ERROR_STATUS_MAP[response.error.code as keyof typeof ERROR_STATUS_MAP];
    }

    return 500; // Default to internal server error
  }

  async facebookOAuth(req: Request, res: Response): Promise<void> {
    try {
      const { code, state } = req.query;

      // Validate required parameters
      if (!code) {
        res.status(400).json({
          success: false,
          message: "Facebook authorization code is required",
          error: {
            code: "MISSING_REQUIRED_FIELD",
            message: "Facebook authorization code is required"
          }
        });
        return;
      }

      if (!state) {
        res.status(400).json({
          success: false,
          message: "State parameter is required for security",
          error: {
            code: "MISSING_REQUIRED_FIELD",
            message: "State parameter is required for security"
          }
        });
        return;
      }

      const [expectedState, userId] = (state as string).split('_');

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "User must be authenticated",
          error: {
            code: "UNAUTHORIZED",
            message: "User must be authenticated"
          }
        });
        return;
      }


      // Exchange code for access token and get user data
      const authResult = await this.oauthService.tokenExchange(
        code as string,
        userId as string,
        expectedState as string,
        "appConfig.FACEBOOK_APP_SECRET_STATE",
      );

      const statusCode = this.getStatusCode(authResult);
      res.status(statusCode).json(authResult);

    } catch (err: any) {
      console.error("Facebook OAuth error:", err);

      // Handle different types of errors
      if (err instanceof Error) {
        if (err.message.includes("Invalid state parameter")) {
          res.status(400).json({
            success: false,
            message: "Possible CSRF attack detected",
            error: {
              code: "INVALID_INPUT",
              message: "Invalid state parameter",
              details: err.message
            }
          });
          return;
        }

        if (err.message.includes("Facebook OAuth error")) {
          res.status(400).json({
            success: false,
            message: "Invalid authorization code or Facebook service error",
            error: {
              code: "EXTERNAL_SERVICE_ERROR",
              message: "Facebook authentication failed",
              details: err.message
            }
          });
          return;
        }

        if (err.message.includes("Please re-authenticate")) {
          // Extract auth URL from error message if present
          const authUrlMatch = err.message.match(/Please re-authenticate: (https?:\/\/[^\s]+)/);
          const authUrl = authUrlMatch ? authUrlMatch[1] : "appConfig.FACEBOOK_AUTH_URL";

          res.status(401).json({
            success: false,
            message: "Authentication required",
            error: {
              code: "UNAUTHORIZED",
              message: err.message,
              details: err.message
            },
            authUrl: authUrl
          });
          return;
        }

        if (err.message.includes("Rate limit exceeded")) {
          res.status(429).json({
            success: false,
            message: "Rate limit exceeded. Please try again later",
            error: {
              code: "RATE_LIMIT_EXCEEDED",
              message: "Rate limit exceeded. Please try again later",
              details: err.message
            }
          });
          return;
        }
      }

      // Generic error response
      res.status(500).json({
        success: false,
        message: "Facebook authentication failed",
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Facebook authentication failed",
          details: err.message
        }
      });
    }
  }

  // When generating Facebook OAuth URL
  async generateFacebookAuthUrl(req: Request, res: Response): Promise<void> {
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        message: "User must be authenticated",
        error: {
          code: "UNAUTHORIZED",
          message: "User must be authenticated"
        }
      });
      return;
    }

    const userId = req.user.id;

    // Add userId as query parameter to YOUR redirect URI
    const authUrl = await this.oauthService.generateFacebookAuthUrl(userId);

    res.status(200).json({ success: true, data: { url: authUrl } });
  }
}