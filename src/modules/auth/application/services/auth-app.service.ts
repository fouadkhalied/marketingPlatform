import { Request, Response } from "express";
import { User } from "../../../../infrastructure/shared/schema/schema";
import { ApiResponseInterface } from "../../../../infrastructure/shared/common/apiResponse/interfaces/apiResponse.interface";
import { GoogleAppService } from "./google-app-service";
import { ResponseBuilder } from "../../../../infrastructure/shared/common/apiResponse/apiResponseBuilder";

export class AuthService {
  constructor(
    private readonly googleAppService: GoogleAppService
  ) {}

  // Setup Google OAuth Strategy
  async setupGoogleStrategy(passport: any): Promise<void> {
    await this.googleAppService.setUpGoogleStrategy(passport);
  }

  // Handle Google Login
  async handleGoogleLogin(profile: any): Promise<ApiResponseInterface<User>> {
    return await this.googleAppService.handleGoogleLogin(profile);
  }

  // Create User from Google Profile
  async createUserFromGoogle(profile: any): Promise<User> {
    return await this.googleAppService.createUserFromGoogle(profile);
  }

  // Initiate Google Authentication
  async initiateGoogleAuth(): Promise<any> {
    return await this.googleAppService.authGoogle();
  }

  // Handle Google OAuth Callback
  async handleGoogleCallback(): Promise<any> {
    return await this.googleAppService.authGoogleCallback();
  }

  // Handle Authentication Failure
  async handleAuthFailure(req: Request, res: Response): Promise<void> {
    await this.googleAppService.authFailure(req, res);
  }

  // Handle User Logout
  async handleLogout(req: Request, res: Response): Promise<void> {
    await this.googleAppService.logout(req, res);
  }

  // Get Current User
  async getCurrentUser(req: Request, res: Response): Promise<void> {
    await this.googleAppService.me(req, res);
  }

  async generateGoogleAuthUrl(): Promise<ApiResponseInterface<{url : string}>> {
    const url : string = await this.googleAppService.generateGoogleAuthUrl();
    return ResponseBuilder.success({url : url});
  }
}