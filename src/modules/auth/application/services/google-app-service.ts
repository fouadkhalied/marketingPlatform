import { User } from "../../../../infrastructure/shared/schema/schema";
import { JwtService } from "../../../../infrastructure/shared/common/auth/module/jwt.module";
import { JwtPayload } from "../../../../infrastructure/shared/common/auth/interfaces/jwtPayload";
import { GoogleRepositoryImpl } from "../../infrastructure/repositories/google.repository.impl";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Request, Response, NextFunction } from "express";
import { appConfig } from "../../../../infrastructure/config/app.config";

export class GoogleAppService {
  constructor(
    private readonly googleRepository: GoogleRepositoryImpl,
    private readonly jwtService: JwtService
  ) {}

  // Setup Google strategy
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
              user = await this.googleRepository.createUser({
                googleId: profile.id,
                email: profile.emails?.[0]?.value || "",
                username: profile.displayName || "Google User",
                role: "user",
                oauth: "google",
                verified: true,
              });
            }

            return done(null, user);
          } catch (err) {
            return done(err, false);
          }
        }
      )
    );

    passport.serializeUser((user: any, done) => done(null, user.id));
    passport.deserializeUser(async (id: string, done) => {
      const user = await this.googleRepository.getUserByGoogleId(id);
      done(null, user || false);
    });
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

        res.json({ token });
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
