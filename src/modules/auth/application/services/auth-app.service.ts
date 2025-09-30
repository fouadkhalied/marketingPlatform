import { Request, Response, NextFunction } from "express";
import { User } from "../../../../infrastructure/shared/schema/schema";
import { ApiResponseInterface } from "../../../../infrastructure/shared/common/apiResponse/interfaces/apiResponse.interface";
import { GoogleAppService } from "./google-app-service";
import { ResponseBuilder } from "../../../../infrastructure/shared/common/apiResponse/apiResponseBuilder";

export class AuthService {
  constructor(
    private readonly googleAppService: GoogleAppService
  ) {}

  // Setup Google OAuth Strategy
  async setupGoogleStrategy(): Promise<void> {
    this.googleAppService.setGoogleStrategy();
  }

  // Handle Google Login (directly via profile object)
  async handleGoogleLogin(profile: any): Promise<ApiResponseInterface<User>> {
    return await this.googleAppService.handleGoogleLogin(profile);
  }

  // Create User from Google Profile
  async createUserFromGoogle(profile: any): Promise<User> {
    return await this.googleAppService.createUserFromGoogle(profile);
  }

  // Express route wrapper for initiating Google OAuth
  initiateGoogleAuth(req: Request, res: Response, next: NextFunction) {
    this.googleAppService.googleAuth(req, res, next);
  }

  // Express route wrapper for handling Google OAuth callback
  handleGoogleCallback(req: Request, res: Response, next: NextFunction) {
    this.googleAppService.googleAuthCallback(req, res, next);
  }

  // Express route wrapper for authentication failure
  handleAuthFailure(req: Request, res: Response) {
    this.googleAppService.authFailure(req, res);
  }

  // Express route wrapper for logout
  handleLogout(req: Request, res: Response) {
    this.googleAppService.logout(req, res);
  }

  // Express route wrapper for getting current user
  getCurrentUser(req: Request, res: Response) {
    this.googleAppService.me(req, res);
  }

  // Generate Google Auth URL (API response)
  async generateGoogleAuthUrl(): Promise<ApiResponseInterface<{ url: string }>> {
    const url = await this.googleAppService.generateGoogleAuthUrl();
    return ResponseBuilder.success({ url });
  }
}
