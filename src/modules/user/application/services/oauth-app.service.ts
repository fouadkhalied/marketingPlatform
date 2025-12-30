import { ResponseBuilder } from "../../../../infrastructure/shared/common/apiResponse/apiResponseBuilder";
import { ApiResponseInterface } from "../../../../infrastructure/shared/common/apiResponse/interfaces/apiResponse.interface";
import { FacebookPageService } from "./facebook-app.service";
import { ILogger } from "../../../../infrastructure/shared/common/logging";

export class OAuthAppService {
  constructor(
    private readonly facebookAuthService: FacebookPageService,
    private readonly logger: ILogger
  ) {

  }

  // oauth facebook
  async tokenExchange(code: string , userId: string, state?: string, expectedState?: string): Promise<ApiResponseInterface<{data : any}>> {
    try {
      this.logger.info('Facebook OAuth token exchange', { userId });

      // Validate state parameter for CSRF protection
      if (expectedState && state !== expectedState) {
        this.logger.warn('Facebook OAuth failed - invalid state', { userId });
        throw new Error("Invalid state parameter - possible CSRF attack");
      }

      // Exchange code for token
      const tokenResponse = await this.facebookAuthService.exchangeCodeForToken({
        code
      });

      const savePageData = await this.facebookAuthService.getUserPagesAndSaveTokens(tokenResponse.access_token, userId);

      // // Validate the token
      // const isValidToken = await this.facebookAuthService.validateToken(tokenResponse.access_token);
      // if (!isValidToken) {
      //   throw new Error("Received invalid access token from Facebook");
      // }

      // Get user profile
      //const user = await this.facebookAuthService.getUserProfile(tokenResponse.access_token);

      this.logger.info('Facebook OAuth token exchange successful', { userId });
      return ResponseBuilder.success({data : savePageData.savedPages}, "access token for page saved successfully");
    } catch (error) {
      const err = error as Error;
      this.logger.error('Facebook OAuth token exchange failed', { error: err.message, userId });
      throw new Error("Facebook authentication failed");
    }
  }


  // generate facebook auth url
  async generateFacebookAuthUrl(userId: string) : Promise<string> {
    this.logger.info('Generating Facebook auth URL', { userId });

    const redirectUri = "https://marketing-platform-six.vercel.app/api/auth/facebook/callback";
      const state = `12345_${userId}`;

      const authUrl = `https://www.facebook.com/v23.0/dialog/oauth?` +
        `client_id=562659103570379&` +
        `redirect_uri=${redirectUri}&` +
        `state=${state}&` +
        `scope=email,public_profile,pages_show_list,pages_read_engagement,pages_read_user_content,pages_manage_engagement&` +
        `response_type=code`;

        this.logger.info('Facebook auth URL generated', { userId });
        return authUrl
  }
}