import axios, { AxiosInstance } from "axios";
import { FacebookTokenResponse } from "../interfaces/facebookAuthResponse";

export class FacebookAuthService {
  private axiosInstance: AxiosInstance;
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor(
    clientId: string,
    clientSecret: string,
    redirectUri: string
  ) {
    this.axiosInstance = axios.create({
      baseURL: "https://graph.facebook.com/v20.0",
    });
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.redirectUri = redirectUri;
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
