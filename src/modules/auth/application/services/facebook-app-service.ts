// facebook-app-service.ts
import axios, { AxiosInstance } from "axios";
import { appConfig } from "../../../../infrastructure/config/app.config";
import { FacebookTokenResponse } from "../../../../infrastructure/shared/common/auth/interfaces/facebookAuthResponse";
import { FacebookUserData } from "../dto/facebook/facebookUserData";
import { IFacebookRepository } from "../../domain/repositories/facebook.interface";
import { User } from "../../../../infrastructure/shared/schema/schema";
import { ApiResponseInterface } from "../../../../infrastructure/shared/common/apiResponse/interfaces/apiResponse.interface";
import { ResponseBuilder } from "../../../../infrastructure/shared/common/apiResponse/apiResponseBuilder";
import { UserRole } from "../../../../infrastructure/shared/common/auth/enums/userRole";
import { ErrorBuilder } from "../../../../infrastructure/shared/common/errors/errorBuilder";
import { ErrorCode } from "../../../../infrastructure/shared/common/errors/enums/basic.error.enum";

class FacebookAppService {
    private axiosInstance: AxiosInstance;
    private appId: string;
    private appSecret: string;
    private redirectUri: string;
    private graphApiVersion: string = 'v20.0';
  
    constructor(private readonly facebookRepository: IFacebookRepository) {
      this.axiosInstance = axios.create({
        baseURL: `https://graph.facebook.com/${this.graphApiVersion}`,
        timeout: 15000,
      });
      this.appId = appConfig.FACEBOOK_APP_OAUTH_ID;
      this.appSecret = appConfig.FACEBOOK_APP_OAUTH_SECRET;
      this.redirectUri = appConfig.FACEBOOK_APP_OAUTH_REDIRECT_URL;
    }
    
    // Generate Facebook login URL
    async getLoginUrl(): Promise<string> {
        const permissions = ['email', 'public_profile'];
        
        return `https://www.facebook.com/${this.graphApiVersion}/dialog/oauth?` +
            `client_id=${this.appId}` +
            `&redirect_uri=${encodeURIComponent(this.redirectUri)}` +
            `&scope=${permissions.join(',')}` +
            `&response_type=code`;
    }

    // Exchange authorization code for access token
    async getAccessToken(code: string): Promise<string> {
        const response = await this.axiosInstance.get<FacebookTokenResponse>(
            `/oauth/access_token?` +
            `client_id=${this.appId}` +
            `&client_secret=${this.appSecret}` +
            `&redirect_uri=${encodeURIComponent(this.redirectUri)}` +
            `&code=${code}`
        );
        
        return response.data.access_token;
    }

    // Get user email and ID using access token
    async getUserData(accessToken: string): Promise<FacebookUserData> {
        const response = await this.axiosInstance.get<FacebookUserData>(
            `/me?fields=id,email&access_token=${accessToken}`
        );
        
        return response.data;
    }

    // Handle Facebook Login - create or find user
    async handleFacebookLogin(profile: FacebookUserData): Promise<ApiResponseInterface<User>> {
        try {
            // Check if user exists with Facebook ID
            let user = await this.facebookRepository.getUserByFacebookId(profile.id);

            if (user) {
                return ResponseBuilder.success(user);
            }

            // Check if user exists with email
            const existingUser = await this.facebookRepository.getUserByEmail(profile.email);

            if (existingUser) {
                // Link Facebook account to existing user
                user = await this.facebookRepository.linkFacebookAccount(existingUser.id, profile.id);
                return ResponseBuilder.success(user);
            }

            // Create new user
            user = await this.createUserFromFacebook(profile);
            return ResponseBuilder.success(user);

        } catch (error: any) {
            return ErrorBuilder.build(
                ErrorCode.INTERNAL_SERVER_ERROR,
                error.message || "Facebook login failed"
            );
        }
    }

    // Create user from Facebook profile
    async createUserFromFacebook(profile: FacebookUserData): Promise<User> {
        const newUser = await this.facebookRepository.createUser({
            email: profile.email,
            facebookId: profile.id,
            oauth: 'facebook',
            verified: true,
            role: UserRole.USER,
            adsCount: 0,
            totalSpend: 0,
            balance: 0,
            username: profile.name,
        });

        return newUser;
    }

    // Generate Facebook auth URL (wrapper)
    async generateFacebookAuthUrl(): Promise<string> {
        return await this.getLoginUrl();
    }
}

export default FacebookAppService;