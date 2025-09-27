// user/interfaces/controllers/user.controller.factory.ts
import { JwtService } from "../../../../infrastructure/shared/common/auth/module/jwt.module";
import { EmailService } from "../../../../infrastructure/shared/common/email/module/resend.module";
import { OTPService } from "../../../../infrastructure/shared/common/otp/module/otp.module";
import { FacebookPageService } from "../../application/services/facebook-app.service";
import { UserAppService } from "../../application/services/user-app.service";
import { FacebookPageRepositoryImpl } from "../../infrastructure/repositories/facebook.repository.impl";
import { UserRepositoryImpl } from "../../infrastructure/repositories/user.repository.impl";
import { UserController } from "../controllers/user.controller";

// Factory function to create the fully wired controller
export function createUserController(): UserController {
  // Validate required environment variables
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error("JWT_SECRET environment variable is required");
  }

  // Create repository implementation (infrastructure)
  const userRepository = new UserRepositoryImpl();

  const facebookRepository = new FacebookPageRepositoryImpl();

  const emailService = new EmailService();

  const otpService = new OTPService(emailService);

  const facebookPageService = new FacebookPageService(facebookRepository)

  // Pass the actual environment variable value, not the string
  const jwtService = new JwtService(jwtSecret);

  // Pass repository to application service
  const userService = new UserAppService(userRepository, otpService, jwtService, facebookPageService);

  // Pass application service to controller
  const userController = new UserController(userService);

  return userController;
}