import express from 'express';
import { AuthMiddleware } from "../../../../infrastructure/shared/common/auth/module/authModule";
import { UserRole } from "../../../../infrastructure/shared/common/auth/enums/userRole";

export function setupUserRoutes(userControllers: any) {
  const router = express.Router();

  // Auth routes
  router.post('/api/auth/register',
    (req, res) => userControllers.auth.createUser(req, res)
  );

  router.post('/api/auth/verify',
    (req, res) => userControllers.auth.verifyUser(req, res)
  );

  router.post('/api/auth/resend-otp',
    (req, res) => userControllers.auth.resendVerificationOTP(req, res)
  );

  router.get('/api/auth/verification-status',
    (req, res) => userControllers.userManagement.checkVerificationStatus(req, res)
  );

  router.post('/api/auth/login',
    (req, res) => userControllers.auth.login(req, res)
  );

  router.post('/api/auth/password-reset-email',
    (req, res) => userControllers.auth.sendPasswordResetEmail(req, res)
  );

  router.post('/api/auth/password-reset',
    (req, res) => userControllers.auth.updatePassword(req, res)
  );

  // Profile routes
  router.get('/api/users/profile',
    AuthMiddleware(UserRole.USER),
    (req, res) => userControllers.profile.getProfile(req, res)
  );

  router.put('/api/users/profile',
    AuthMiddleware(UserRole.USER),
    (req, res) => userControllers.profile.updateProfile(req, res)
  );

  // User management routes
  router.get('/api/users',
    AuthMiddleware(UserRole.ADMIN),
    (req, res) => userControllers.userManagement.getUsers(req, res)
  );

  router.get('/api/user/userDetails/:id',
    AuthMiddleware(UserRole.USER),
    (req, res) => userControllers.userManagement.getUser(req, res)
  );

  router.delete('/api/users/:id',
    AuthMiddleware(UserRole.ADMIN),
    (req, res) => userControllers.userManagement.deleteUser(req, res)
  );

  router.put('/api/users/promote/:id',
    AuthMiddleware(UserRole.ADMIN),
    (req, res) => userControllers.userManagement.makeUserAdmin(req, res)
  );

  // Credits routes
  router.put('/api/users/addCredit/:userId',
    AuthMiddleware(UserRole.ADMIN),
    (req, res) => userControllers.credits.addCretidToUserByAdmin(req, res)
  );

  router.get('/api/users/impression-ratios',
    (req, res) => userControllers.credits.getAvailableImpressionRatios(req, res)
  );

  router.put('/api/users/impression-ratios/:id',
    AuthMiddleware(UserRole.ADMIN),
    (req, res) => userControllers.credits.updateImpressionRatio(req, res)
  );

  router.put('/api/users/update-free-credits',
    AuthMiddleware(UserRole.ADMIN),
    (req, res) => userControllers.credits.updateFreeCredits(req, res)
  );

  router.get('/api/users/get-free-credits',
    AuthMiddleware(UserRole.ADMIN),
    (req, res) => userControllers.credits.getFreeCredits(req, res)
  );

  // Ad interaction routes
  router.put("/api/users/ad/:id/click",
    (req, res) => userControllers.adInteraction.createAdClick(req, res)
  );

  // Ad report routes
  router.post('/api/users/ad-report',
    (req, res) => userControllers.adReport.createAdReport(req, res)
  );

  router.get('/api/users/ad-reports',
    AuthMiddleware(UserRole.ADMIN),
    (req, res) => userControllers.adReport.getAdReports(req, res)
  );

  // OAuth routes
  router.get('/api/auth/facebook/callback',
    (req, res) => userControllers.oauth.facebookOAuth(req, res)
  );

  router.get('/api/auth/facebook/generateAuthUrl',
    AuthMiddleware(UserRole.USER),
    (req, res) => userControllers.oauth.generateFacebookAuthUrl(req, res)
  );

// Email routes
router.post('/api/users/email',
  (req, res) => userControllers.email.addUserEmail(req, res)
);

// SEO routes
router.post(
  "/api/seo",
  AuthMiddleware(UserRole.ADMIN),
  (req, res) => userControllers.seo.createSeoVariable(req, res)
);

// Get all SEO variables
router.get(
  "/api/seo",
  AuthMiddleware(UserRole.USER),
  (req, res) => userControllers.seo.getAllSeoVariables(req, res)
);

// Get SEO variable by ID
router.get(
  "/api/seo/:id",
  AuthMiddleware(UserRole.USER),
  (req, res) => userControllers.seo.getSeoVariableById(req, res)
);

// Update SEO variable
router.put(
  "/api/seo/:id",
  AuthMiddleware(UserRole.ADMIN),
  (req, res) => userControllers.seo.updateSeoVariable(req, res)
);

// Delete SEO variable
router.delete(
  "/api/seo/:id",
  AuthMiddleware(UserRole.ADMIN),
  (req, res) => userControllers.seo.deleteSeoVariable(req, res)
);

return router;
}