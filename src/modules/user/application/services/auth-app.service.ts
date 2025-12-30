import { ResponseBuilder } from "../../../../infrastructure/shared/common/apiResponse/apiResponseBuilder";
import { ApiResponseInterface } from "../../../../infrastructure/shared/common/apiResponse/interfaces/apiResponse.interface";
import { JwtService } from "../../../../infrastructure/shared/common/auth/module/jwt.module";
import { ErrorCode } from "../../../../infrastructure/shared/common/errors/enums/basic.error.enum";
import { ErrorBuilder } from "../../../../infrastructure/shared/common/errors/errorBuilder";
import { OTPResult } from "../../../../infrastructure/shared/common/otp/interfaces/optResult";
import { OTPService } from "../../../../infrastructure/shared/common/otp/module/otp.module";
import { AdminImpressionRatio, Ad, CreateUser, User } from "../../../../infrastructure/shared/schema/schema";
import { UserRepository } from "../../infrastructure/repositories/UserRepository";
import { UserVerificationRepository } from "../../infrastructure/repositories/UserVerificationRepository";
import { ILogger } from "../../../../infrastructure/shared/common/logging";

export class AuthAppService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly verificationRepository: UserVerificationRepository,
    private readonly otpService: OTPService,
    private readonly jwtService: JwtService,
    private readonly logger: ILogger
  ) {

  }

  // Create a new user
  async createUser(input: CreateUser): Promise<ApiResponseInterface<{token : string ;username: string | null; role : "user" | "admin"; }>> {
    try {
      this.logger.info('Creating new user', { email: input.email });

      // Perform application-level validation
      const existingUser = await this.userRepository.getUserByEmail(input.email);
      if (existingUser) {
        this.logger.warn('User creation failed - email already exists', { email: input.email });
        return ErrorBuilder.build(ErrorCode.USER_ALREADY_EXISTS, "Email already exists");
      }

      const user = await this.userRepository.createUser(input);
      this.logger.info('User created successfully', { userId: user.id, email: user.email });

      await this.verificationRepository.verifyUser(user.id)

      // Generate and send OTP for verification
      // const otp = this.otpService.generateOTP();
      // const otpResult = await this.otpService.sendOTP({
      //   email: input.email,
      //   otp,
      //   subject: "Verify your account"
      // });

      // if (!otpResult.success) {
      //   return ErrorBuilder.build(ErrorCode.INTERNAL_SERVER_ERROR, otpResult.message || "failed to send otp");
      // }


      const payload = { userId: user.id, email: user.email, role: user.role , oauth: "normal"};
      const token = this.jwtService.sign(payload);


      return ResponseBuilder.success({
        token: token,
        username: user.username,
        role: user.role,
      });

    } catch (error: any) {
      const err = error as Error;
      this.logger.error('Error creating user', { error: err.message, email: input.email });
      return ErrorBuilder.build(ErrorCode.INTERNAL_SERVER_ERROR, err.message);
    }
  }

  async login(email: string, password: string): Promise<ApiResponseInterface<{role : "admin" | "user"; username : string | null; token: string}>> {
    try {
      this.logger.info('User login attempt', { email });

      // 1. Find the user by email
      const user = await this.userRepository.getUserByEmail(email);
      if (!user) {
        this.logger.warn('Login failed - user not found', { email });
        return ErrorBuilder.build(ErrorCode.INVALID_CREDENTIALS, "Invalid credentials");
      }

      // 2. Ensure the user is verified before allowing login
      // if (!user.verified) {
      //   return ErrorBuilder.build(ErrorCode.USER_NOT_VERIFIED, "Account not verified. Please check your email for the verification code.");
      // }

      // 3. Compare the provided password with the stored hash
      const isPasswordValid = await this.jwtService.comparePassword(password, user.password, "normal");
      if (!isPasswordValid) {
        this.logger.warn('Login failed - invalid password', { email });
        return ErrorBuilder.build(ErrorCode.INVALID_CREDENTIALS, "Wrong password");
      }

      // 4. Generate a JWT token
      const payload = { userId: user.id, email: user.email, role: user.role , oauth: "normal"};
      const token = this.jwtService.sign(payload);

      this.logger.info('User logged in successfully', { userId: user.id, email });

      return ResponseBuilder.success({
        token : token,
        role : payload.role,
        username : user.username
      });

    } catch (error) {
      const err = error as Error;
      this.logger.error('Error during login', { error: err.message, email });
      return ErrorBuilder.build(ErrorCode.INTERNAL_SERVER_ERROR, "Login failed");
    }
  }

  // Verify user with OTP
  async verifyUser(email: string, providedOTP: string): Promise<ApiResponseInterface<{ success: boolean; message: string }>> {
    try {
      this.logger.info('User verification attempt', { email });

      const user = await this.userRepository.getUserByEmail(email);
      if (!user) {
        this.logger.warn('User verification failed - user not found', { email });
        return ErrorBuilder.build(ErrorCode.USER_NOT_FOUND, "User does not exist");
      }

      if (user.verified) {
        this.logger.warn('User verification failed - already verified', { email });
        return ErrorBuilder.build(ErrorCode.USER_ALREADY_VERIFIED, "User is already verified");
      }

      const verificationResult = await this.otpService.verifyOTP(
        email, providedOTP
      );

      if (verificationResult.success) {
        // Mark user as verified in database
        await this.verificationRepository.verifyUser(user.id);
        this.logger.info('User verified successfully', { userId: user.id, email });
        return ResponseBuilder.success({
          success: true,
          message: "User verified successfully"
        });
      } else {
        this.logger.warn('User verification failed - invalid OTP', { email });
        return ErrorBuilder.build(ErrorCode.INVALID_OTP, verificationResult.message || "OTP verification failed");
      }

    } catch (error) {
      const err = error as Error;
      this.logger.error('Error verifying user', { error: err.message, email });
      return ErrorBuilder.build(ErrorCode.INTERNAL_SERVER_ERROR, "Internal server error during verification");
    }
  }

  // Resend OTP for verification
  async resendVerificationOTP(email: string): Promise<ApiResponseInterface<{ success: boolean; message: string }>> {
    try {
      this.logger.info('Resend verification OTP', { email });

      const user = await this.userRepository.getUserByEmail(email);
      if (!user) {
        this.logger.warn('Resend OTP failed - user not found', { email });
        return ErrorBuilder.build(ErrorCode.USER_NOT_FOUND, "User not found");
      }

      if (user.verified) {
        this.logger.warn('Resend OTP failed - user already verified', { email });
        return ErrorBuilder.build(ErrorCode.USER_ALREADY_VERIFIED, "User is already verified");
      }

      const otpResult = await this.otpService.resendOTP(email);

      if (otpResult.success) {
        // In a real application, you would store the new OTP and expiration in database
        this.logger.info('Verification OTP sent successfully', { email });
        return ResponseBuilder.success({
          success: true,
          message: "Verification OTP sent successfully"
        });
      } else {
        this.logger.warn('Resend OTP failed', { email, error: otpResult.message });
        return ErrorBuilder.build(ErrorCode.OTP_SEND_FAILED, otpResult.message || "Failed to resend OTP");
      }

    } catch (error) {
      const err = error as Error;
      this.logger.error('Error resending OTP', { error: err.message, email });
      return ErrorBuilder.build(ErrorCode.INTERNAL_SERVER_ERROR, "Failed to resend verification OTP");
    }
  }

  // send password reset email
  async sendPasswordResetEmail(email: string): Promise<ApiResponseInterface<{ success: boolean; message: string }>> {
    try {
      this.logger.info('Send password reset email', { email });

      const user = await this.userRepository.getUserByEmail(email);

      if (!user) {
        this.logger.warn('Password reset failed - user not found', { email });
        return ErrorBuilder.build(ErrorCode.USER_NOT_FOUND, "User not found");
      }

      // if (user.verified) {
      //   return ErrorBuilder.build(ErrorCode.USER_ALREADY_VERIFIED, "User is already verified");
      // }

      const passwordResetResult = await this.otpService.sendGeneratedPasswordResetToken(email);

      if (passwordResetResult.success) {
        // In a real application, you would store the new OTP and expiration in database
        this.logger.info('Password reset email sent successfully', { email });
        return ResponseBuilder.success({
          success: true,
          message: "password reset email sent successfully"
        });
      } else {
        this.logger.warn('Password reset email failed', { email, error: passwordResetResult.message });
        return ErrorBuilder.build(ErrorCode.OTP_SEND_FAILED, passwordResetResult.message || "Failed to send password reset email");
      }

    } catch (error) {
      const err = error as Error;
      this.logger.error('Error sending password reset email', { error: err.message, email });
      return ErrorBuilder.build(ErrorCode.INTERNAL_SERVER_ERROR, "Failed to send password reset email");
    }
  }

// Assuming this is within your ApplicationService
async verifyTokenAndChangePassword(email: string, password: string, token: string) : Promise<ApiResponseInterface<OTPResult>> {
  try {
      this.logger.info('Verify token and change password', { email });

      const user = await this.userRepository.getUserByEmail(email);
      if (!user) {
          // Fail fast if user isn't found
          this.logger.warn('Password change failed - user not found', { email });
          return ErrorBuilder.build(ErrorCode.USER_NOT_FOUND, "User not found");
      }

      const verifyToken = await this.otpService.verifyPasswordResetToken(email, token);

      if (!verifyToken.success) {
          // Return the specific error message from the OTPService
          this.logger.warn('Password change failed - invalid token', { email });
          return ErrorBuilder.build(ErrorCode.OTP_VERIFICATION_FAILED, verifyToken.error?.message || "");
      }

      const updatePassword: boolean = await this.userRepository.updatePassword(email, password);

      if (updatePassword) {
          // Attempt to delete the token. Log the error but don't fail the entire process
          // since the password was already updated.
          const deleteResult = await this.otpService.deletePasswordResetToken(token);
          if (!deleteResult.success) {
              // Log the failure to delete the token for debugging
              this.logger.warn(`Failed to delete token for email ${email}: ${deleteResult.message}`);
          }

          this.logger.info('Password updated successfully', { email });
          return { success: true, message: "Password updated successfully." };
      } else {
          // Handle the case where the password update itself failed
          this.logger.warn('Password update failed', { email });
          return ErrorBuilder.build(ErrorCode.INTERNAL_SERVER_ERROR, "Failed to update password.");
      }
  } catch (error) {
      // Log the error for debugging purposes
      const err = error as Error;
      this.logger.error('Error in verifyTokenAndChangePassword', { error: err.message, email });

      // Return a generic error message to the client
      return ErrorBuilder.build(ErrorCode.INTERNAL_SERVER_ERROR, "Failed to complete password reset.");
  }
}
}