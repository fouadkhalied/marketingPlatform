import { User } from "../../../../infrastructure/shared/schema/schema";
import { ResponseBuilder } from "../../../../infrastructure/shared/common/apiResponse/apiResponseBuilder";
import { ApiResponseInterface } from "../../../../infrastructure/shared/common/apiResponse/interfaces/apiResponse.interface";
import { ErrorBuilder } from "../../../../infrastructure/shared/common/errors/errorBuilder";
import { ErrorCode } from "../../../../infrastructure/shared/common/errors/enums/basic.error.enum";
import { UserRole } from "../../../../infrastructure/shared/common/auth/enums/userRole";
import { GoogleRepositoryImpl } from "../../infrastructure/repositories/google.repository.impl";
import passport from "passport";
import { NextFunction, Request, Response } from "express";
import { JwtService } from "../../../../infrastructure/shared/common/auth/module/jwt.module";
import { JwtPayload } from "../../../../infrastructure/shared/common/auth/interfaces/jwtPayload";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { appConfig } from "../../../../infrastructure/config/app.config";

export class GoogleAppService {
  constructor(
    private readonly googleRepository: GoogleRepositoryImpl,
    private readonly jwtService: JwtService
  ) {}

  // 1. Handle Google login (find or create user)

async handleGoogleLogin(profile: any): Promise<ApiResponseInterface<User>> {
  try {
    // First, try to find user by Google ID
    let googleUser = await this.googleRepository.getUserByGoogleId(profile.id);

    if (!googleUser) {
      // Check if user exists with this email (created via email/password)
      const email = profile.emails?.[0]?.value || "";
      const existingUser = await this.googleRepository.getUserByEmail(email);

      if (existingUser) {
        // Link the Google account to existing user
        googleUser = await this.googleRepository.linkGoogleAccount(
          existingUser.id,
          profile.id
        );
      } else {
        // Create new user
        googleUser = await this.createUserFromGoogle(profile);
      }
    }

    return ResponseBuilder.success(googleUser);
  } catch (error) {
    return ErrorBuilder.build(
      ErrorCode.INTERNAL_SERVER_ERROR,
      "Google login failed",
      error instanceof Error ? error.message : error
    );
  }
}

  // 2. Create user with OAuth flag
  async createUserFromGoogle(profile: any): Promise<User> {
    const newUser = await this.googleRepository.createUser({
      googleId: profile.id,
      email: profile.emails?.[0]?.value || "",
      username: profile.displayName || "Google User",
      role: UserRole.USER,
      oauth: "google",
      verified: true,
    });
  
    return newUser;
  }

  async generateGoogleAuthUrl(): Promise<string> {
    const clientId = appConfig.GOOGLE_CLIENT_ID;
    const redirectUri = appConfig.GOOGLE_CALLBACK_URL;
    const scope = 'profile email';
    const responseType = 'code';
    const accessType = 'offline';
    const prompt = 'consent';

    const params = new URLSearchParams({
      client_id: clientId!,
      redirect_uri: redirectUri,
      scope: scope,
      response_type: responseType,
      access_type: accessType,
      prompt: prompt
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }



  setGoogleStrategy() {
    passport.use(
      new GoogleStrategy(
        {
          clientID: appConfig.GOOGLE_CLIENT_ID!,
          clientSecret: appConfig.GOOGLE_CLIENT_SECRET!,
          callbackURL: appConfig.GOOGLE_CALLBACK_URL!,
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            let user = await this.googleRepository.getUserByGoogleId(profile.id);
  
            if (!user) {
              // Check for existing user by email
              const email = profile.emails?.[0]?.value || "";
              const existingUser = await this.googleRepository.getUserByEmail(email);
  
              if (existingUser) {
                // Link Google account to existing user
                user = await this.googleRepository.linkGoogleAccount(
                  existingUser.id,
                  profile.id
                );
              } else {
                // Create new user
                user = await this.googleRepository.createUser({
                  googleId: profile.id,
                  email: email,
                  username: profile.displayName || "Google User",
                  role: "user",
                  oauth: "google",
                  verified: true,
                });
              }
            }
  
            return done(null, user);
          } catch (err) {
            return done(err, false);
          }
        }
      )
    );
  }

  // Route handler for initiating Google OAuth
  googleAuth(req: Request, res: Response, next: NextFunction) {
    passport.authenticate("google", { scope: ["profile", "email"], session: false })(req, res, next);
  }

  // Route handler for Google OAuth callback
  googleAuthCallback(req: Request, res: Response, next: NextFunction) {
    passport.authenticate(
      "google",
      { failureRedirect: "/api/auth/google/failure", session: false },
      async (err, user: User) => {
        if (err || !user) return res.redirect("/api/auth/google/failure");

        const jwtPayload: JwtPayload = {
          userId: user.id,
          email: user.email,
          role: user.role,
          oauth: "google",
        };

        const token = this.jwtService.sign(jwtPayload);

        res.cookie("auth_token", token, {
          httpOnly: true,
          secure: true,
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.json({ 
          "success": true,
          "message": "Request successful",
          "data": {
            "token": token,
            "role": user.role,
            "username":user.username
          }
         });
      }
    )(req, res, next);
  }

  authFailure(req: Request, res: Response) {
    res.status(401).json({ error: "Google authentication failed" });
  }

  logout(req: Request, res: Response) {
    req.logout((err) => {
      if (err) return res.status(500).json({ error: "Logout failed" });
      res.json({ message: "Logged out successfully" });
    });
  }

  me(req: Request, res: Response) {
    res.json({ user: req.user });
  }
  
}
