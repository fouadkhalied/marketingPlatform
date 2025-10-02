// auth-service.ts
import { Request, Response, NextFunction } from "express";
import { User } from "../../../../infrastructure/shared/schema/schema";
import { ApiResponseInterface } from "../../../../infrastructure/shared/common/apiResponse/interfaces/apiResponse.interface";
import { GoogleAppService } from "./google-app-service";
import { ResponseBuilder } from "../../../../infrastructure/shared/common/apiResponse/apiResponseBuilder";
import FacebookAppService from "./facebook-app-service";
import { ErrorBuilder } from "../../../../infrastructure/shared/common/errors/errorBuilder";
import { ErrorCode } from "../../../../infrastructure/shared/common/errors/enums/basic.error.enum";

export class AuthService {
  constructor(
    private readonly googleAppService: GoogleAppService,
    private readonly facebookAppService: FacebookAppService
  ) {}

  // ==================== GOOGLE AUTH ====================  
  async setupGoogleStrategy(): Promise<void> {
    this.googleAppService.setGoogleStrategy();
  }

  async handleGoogleLogin(profile: any): Promise<ApiResponseInterface<User>> {
    return await this.googleAppService.handleGoogleLogin(profile);
  }

  async createUserFromGoogle(profile: any): Promise<User> {
    return await this.googleAppService.createUserFromGoogle(profile);
  }

  initiateGoogleAuth(req: Request, res: Response, next: NextFunction) {
    this.googleAppService.googleAuth(req, res, next);
  }

  handleGoogleCallback(req: Request, res: Response, next: NextFunction) {
    this.googleAppService.googleAuthCallback(req, res, next);
  }

  handleAuthFailure(req: Request, res: Response) {
    this.googleAppService.authFailure(req, res);
  }

  handleLogout(req: Request, res: Response) {
    this.googleAppService.logout(req, res);
  }

  getCurrentUser(req: Request, res: Response) {
    this.googleAppService.me(req, res);
  }

  async generateGoogleAuthUrl(): Promise<ApiResponseInterface<{ url: string }>> {
    const url: string = await this.googleAppService.generateGoogleAuthUrl();
    return ResponseBuilder.success({ url });
  }

  // ==================== FACEBOOK AUTH ====================

  // Generate Facebook Auth URL
  async generateFacebookAuthUrl(): Promise<ApiResponseInterface<{ url: string }>> {
    const url: string = await this.facebookAppService.generateFacebookAuthUrl();
    return ResponseBuilder.success({ url });
  }

  // Handle Facebook Login
  async handleFacebookLogin(profile: any): Promise<ApiResponseInterface<User>> {
    return await this.facebookAppService.handleFacebookLogin(profile);
  }

  // Create User from Facebook Profile
  async createUserFromFacebook(profile: any): Promise<User> {
    return await this.facebookAppService.createUserFromFacebook(profile);
  }

  // Express route wrapper for initiating Facebook OAuth
  async initiateFacebookAuth(req: Request, res: Response) {
    try {
      const response = await this.generateFacebookAuthUrl();
      res.json(response);
    } catch (error: any) {
      res.status(500).json(ResponseBuilder.fail(ErrorBuilder.build(ErrorCode.INTERNAL_SERVER_ERROR, error.message)));
    }
  }

  // Express route wrapper for handling Facebook OAuth callback
  async handleFacebookAuthCallback(req: Request, res: Response) {
    try {
      const code = req.query.code as string;
      
      if (!code) {
        return res.status(400).json(
          ResponseBuilder.fail(ErrorBuilder.build(ErrorCode.BAD_REQUEST, "No authorization code provided"))
        );
      }

      // Get access token
      const accessToken = await this.facebookAppService.getAccessToken(code);
      
      // Get user data from Facebook
      const userData = await this.facebookAppService.getUserData(accessToken);
      
      // Handle user login/creation
      await this.handleFacebookLogin(userData);

      res.json(accessToken);
      
    } catch (error: any) {
      const errorResponse = ErrorBuilder.build(ErrorCode.INTERNAL_SERVER_ERROR, error.response?.data?.error?.message || error.message || "Facebook authentication failed")
      res.status(500).json(
        ResponseBuilder.fail(
          errorResponse
        )
      );
    }
  }
}