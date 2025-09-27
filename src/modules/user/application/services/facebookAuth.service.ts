import axios, { AxiosInstance } from "axios";
import { FacebookTokenResponse } from "../../../../infrastructure/shared/common/auth/interfaces/facebookAuthResponse";
import { appConfig } from "../../../../infrastructure/config/app.config";

export class FacebookAuthService {
  private axiosInstance: AxiosInstance;
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor(

  ) {
    this.axiosInstance = axios.create({
      baseURL: "https://graph.facebook.com/v20.0",
    });
    this.clientId = appConfig.FACEBOOK_APP_ID;
    this.clientSecret = appConfig.FACEBOOK_APP_SECRET;
    this.redirectUri = appConfig.FACEBOOK_REDIRECT_URI;
  }

  async exchangeCodeForToken(code: any, state?: any): Promise<FacebookTokenResponse> {
    const response = await this.axiosInstance.get<FacebookTokenResponse>(
      "/oauth/access_token",
      {
        params: {
          client_id: this.clientId,
          client_secret: this.clientSecret,
          redirect_uri: this.redirectUri,
          code,
          state,
        },
      }
    );

    return response.data;
  }
}
