import { FacebookPageService } from "../../application/services/facebook-app.service";
import { FacebookPageRepositoryImpl } from "../../infrastructure/repositories/facebook.repository.impl";
import { createLogger, ILogger } from "../../../../infrastructure/shared/common/logging";
import { JwtService } from "../../../../infrastructure/shared/common/auth/module/jwt.module";
import { OTPService } from "../../../../infrastructure/shared/common/otp/module/otp.module";
import { EmailService } from "../../../../infrastructure/shared/common/email/module/resend.module";

// Repositories
import { UserRepository } from "../../infrastructure/repositories/UserRepository";
import { UserProfileRepository } from "../../infrastructure/repositories/UserProfileRepository";
import { UserVerificationRepository } from "../../infrastructure/repositories/UserVerificationRepository";
import { UserCreditsRepository } from "../../infrastructure/repositories/UserCreditsRepository";
import { AdInteractionRepository } from "../../infrastructure/repositories/AdInteractionRepository";
import { AdReportRepository } from "../../infrastructure/repositories/AdReportRepository";
import { ImpressionRatioRepository } from "../../infrastructure/repositories/ImpressionRatioRepository";
import { SeoRepositoryImpl } from "../../infrastructure/repositories/seo.repository.impl";

// Services
import { AuthAppService } from "../../application/services/auth-app.service";
import { ProfileAppService } from "../../application/services/profile-app.service";
import { UserManagementAppService } from "../../application/services/user-management-app.service";
import { CreditsAppService } from "../../application/services/credits-app.service";
import { AdInteractionAppService } from "../../application/services/ad-interaction-app.service";
import { AdReportAppService } from "../../application/services/ad-report-app.service";
import { OAuthAppService } from "../../application/services/oauth-app.service";
import { EmailAppService } from "../../application/services/email-app.service";
import { SeoAppService } from "../../application/services/seo-app.service";

// Controllers
import { AuthController } from "../controllers/auth.controller";
import { ProfileController } from "../controllers/profile.controller";
import { UserManagementController } from "../controllers/user-management.controller";
import { CreditsController } from "../controllers/credits.controller";
import { AdInteractionController } from "../controllers/ad-interaction.controller";
import { AdReportController } from "../controllers/ad-report.controller";
import { OAuthController } from "../controllers/oauth.controller";
import { EmailController } from "../controllers/email.controller";
import { SeoController } from "../controllers/seo.controller";

// Factory functions for shared dependencies
function createSharedDependencies() {
    const logger = createLogger('user');
    const jwtService = new JwtService();
    const emailService = new EmailService();
    const otpService = new OTPService(emailService);
    const facebookRepo = new FacebookPageRepositoryImpl();
    const facebookService = new FacebookPageService(facebookRepo);

    return { logger, jwtService, otpService, facebookService };
}

// Repository factories
function createUserRepository(): UserRepository {
    return new UserRepository();
}

function createUserProfileRepository(): UserProfileRepository {
    return new UserProfileRepository();
}

function createUserVerificationRepository(): UserVerificationRepository {
    return new UserVerificationRepository();
}

function createUserCreditsRepository(): UserCreditsRepository {
    return new UserCreditsRepository();
}

function createAdInteractionRepository(): AdInteractionRepository {
    return new AdInteractionRepository();
}

function createAdReportRepository(): AdReportRepository {
    return new AdReportRepository();
}

function createImpressionRatioRepository(): ImpressionRatioRepository {
    return new ImpressionRatioRepository();
}

// Service factories
function createAuthAppService(logger: ILogger, jwtService: JwtService, otpService: OTPService): AuthAppService {
    const userRepo = createUserRepository();
    const verificationRepo = createUserVerificationRepository();

    return new AuthAppService(userRepo, verificationRepo, otpService, jwtService, logger);
}

function createProfileAppService(logger: ILogger): ProfileAppService {
    const profileRepo = createUserProfileRepository();

    return new ProfileAppService(profileRepo, logger);
}

function createUserManagementAppService(logger: ILogger): UserManagementAppService {
    const userRepo = createUserRepository();

    return new UserManagementAppService(userRepo, logger);
}

function createCreditsAppService(logger: ILogger): CreditsAppService {
    const creditsRepo = createUserCreditsRepository();
    const impressionRatioRepo = createImpressionRatioRepository();

    return new CreditsAppService(creditsRepo, impressionRatioRepo, logger);
}

function createAdInteractionAppService(logger: ILogger): AdInteractionAppService {
    const adInteractionRepo = createAdInteractionRepository();

    return new AdInteractionAppService(adInteractionRepo, logger);
}

function createAdReportAppService(logger: ILogger): AdReportAppService {
    const adReportRepo = createAdReportRepository();

    return new AdReportAppService(adReportRepo, logger);
}

function createOAuthAppService(logger: ILogger, facebookService: FacebookPageService): OAuthAppService {
    return new OAuthAppService(facebookService, logger);
}

function createEmailAppService(logger: ILogger): EmailAppService {
    const userRepo = createUserRepository();

    return new EmailAppService(userRepo, logger);
}

// Controller factories
function createAuthController(logger: ILogger, jwtService: JwtService, otpService: OTPService): AuthController {
    const authService = createAuthAppService(logger, jwtService, otpService);
    return new AuthController(authService);
}

function createProfileController(logger: ILogger): ProfileController {
    const profileService = createProfileAppService(logger);
    return new ProfileController(profileService);
}

function createUserManagementController(logger: ILogger): UserManagementController {
    const userManagementService = createUserManagementAppService(logger);
    return new UserManagementController(userManagementService);
}

function createCreditsController(logger: ILogger): CreditsController {
    const creditsService = createCreditsAppService(logger);
    return new CreditsController(creditsService);
}

function createAdInteractionController(logger: ILogger): AdInteractionController {
    const adInteractionService = createAdInteractionAppService(logger);
    return new AdInteractionController(adInteractionService);
}

function createAdReportController(logger: ILogger): AdReportController {
    const adReportService = createAdReportAppService(logger);
    return new AdReportController(adReportService);
}

function createOAuthController(logger: ILogger, facebookService: FacebookPageService): OAuthController {
    const oauthService = createOAuthAppService(logger, facebookService);
    return new OAuthController(oauthService);
}

function createEmailController(logger: ILogger): EmailController {
    const emailService = createEmailAppService(logger);
    return new EmailController(emailService);
}

function createSeoController(logger: ILogger): SeoController {
    const seoRepository = new SeoRepositoryImpl();
    const seoService = new SeoAppService(seoRepository, logger);
    return new SeoController(seoService);
}

// Composite factory for all controllers
export function createAllUserControllers() {
    const { logger, jwtService, otpService, facebookService } = createSharedDependencies();

    return {
        auth: createAuthController(logger, jwtService, otpService),
        profile: createProfileController(logger),
        userManagement: createUserManagementController(logger),
        credits: createCreditsController(logger),
        adInteraction: createAdInteractionController(logger),
        adReport: createAdReportController(logger),
        oauth: createOAuthController(logger, facebookService),
        email: createEmailController(logger),
        seo: createSeoController(logger),
    };
}