import { ResponseBuilder } from "../../../../infrastructure/shared/common/apiResponse/apiResponseBuilder";
import { ApiResponseInterface } from "../../../../infrastructure/shared/common/apiResponse/interfaces/apiResponse.interface";
import { JwtService } from "../../../../infrastructure/shared/common/auth/module/jwt.module";
import { ErrorCode } from "../../../../infrastructure/shared/common/errors/enums/basic.error.enum";
import { ErrorBuilder } from "../../../../infrastructure/shared/common/errors/errorBuilder";
import { OTPResult } from "../../../../infrastructure/shared/common/otp/interfaces/optResult";
import { OTPService } from "../../../../infrastructure/shared/common/otp/module/otp.module";
import { CreateUser, User } from "../../../../infrastructure/shared/schema/schema";
import { UserRepositoryImpl } from "../../infrastructure/repositories/user.repository.impl";
import { FacebookAuthService } from "./facebookAuth.service";
import { FacebookTokenResponse } from "../../../../infrastructure/shared/common/auth/interfaces/facebookAuthResponse";
import { PaginationParams } from "../../../../infrastructure/shared/common/pagination.vo";

export class UserAppService {
  constructor(
    private readonly userRepository: UserRepositoryImpl,
    private readonly otpService: OTPService,
    private readonly jwtService: JwtService,
    private readonly facebookAuthService: FacebookAuthService 
  ) {
    
  }

  // Create a new user
  async createUser(input: CreateUser): Promise<ApiResponseInterface<OTPResult>> {
    try {
      // Perform application-level validation
      const existingUser = await this.userRepository.getUserByEmail(input.email);
      if (existingUser) {
        return ErrorBuilder.build(ErrorCode.USER_ALREADY_EXISTS, "Email already exists");
      }

      await this.userRepository.createUser(input);
      
      // Generate and send OTP for verification
      const otp = this.otpService.generateOTP();
      const otpResult = await this.otpService.sendOTP({
        email: input.email,
        otp,
        subject: "Verify your account"
      });

      if (!otpResult.success) {
        return ErrorBuilder.build(ErrorCode.INTERNAL_SERVER_ERROR, otpResult.message || "failed to send otp");
      }

      return ResponseBuilder.success({
        success : true,
        message : "otp sent to verify email"
      });
    } catch (error:any) {
      console.error("Error creating user:", error);
      return ErrorBuilder.build(ErrorCode.INTERNAL_SERVER_ERROR, error.message);
    }
  }

  async login(email: string, password: string): Promise<ApiResponseInterface<{token: string}>> {
    try {
      // 1. Find the user by email
      const user = await this.userRepository.getUserByEmail(email);
      if (!user) {
        return ErrorBuilder.build(ErrorCode.INVALID_CREDENTIALS, "Invalid credentials");
      }
    
      // 2. Compare the provided password with the stored hash
      const isPasswordValid = await this.jwtService.comparePassword(password, user.password);
      if (!isPasswordValid) {
        return ErrorBuilder.build(ErrorCode.INVALID_CREDENTIALS, "Wrong password");
      }
    
      // 3. Ensure the user is verified before allowing login
      if (!user.verified) {
        return ErrorBuilder.build(ErrorCode.USER_NOT_VERIFIED, "Account not verified. Please check your email for the verification code.");
      }
    
      // 4. Generate a JWT token
      const payload = { userId: user.id, email: user.email, role: user.role };
      const token = this.jwtService.sign(payload);
    
      return ResponseBuilder.success({token : token});
    } catch (error) {
      console.error("Error during login:", error);
      return ErrorBuilder.build(ErrorCode.INTERNAL_SERVER_ERROR, "Login failed");
    }
  }

  // Get user by ID
  async getUser(id: string): Promise<ApiResponseInterface<User>> {
    try {
      const user = await this.userRepository.getUser(id);
      if (!user) {
        return ErrorBuilder.build(ErrorCode.USER_NOT_FOUND, "User not found");
      }
      return ResponseBuilder.success(user);
    } catch (error) {
      console.error("Error getting user:", error);
      return ErrorBuilder.build(ErrorCode.INTERNAL_SERVER_ERROR, "Failed to retrieve user");
    }
  }

  // Get user by email
  async getUserByEmail(email: string): Promise<ApiResponseInterface<User>> {
    try {
      const user = await this.userRepository.getUserByEmail(email);
      if (!user) {
        return ErrorBuilder.build(ErrorCode.USER_NOT_FOUND, "User not found");
      }
      return ResponseBuilder.success(user);
    } catch (error) {
      console.error("Error getting user by email:", error);
      return ErrorBuilder.build(ErrorCode.INTERNAL_SERVER_ERROR, "Failed to retrieve user");
    }
  }

  // Get user by username
  async getUserByUsername(username: string): Promise<ApiResponseInterface<User>> {
    try {
      const user = await this.userRepository.getUserByUsername(username);
      if (!user) {
        return ErrorBuilder.build(ErrorCode.USER_NOT_FOUND, "User not found");
      }
      return ResponseBuilder.success(user);
    } catch (error) {
      console.error("Error getting user by username:", error);
      return ErrorBuilder.build(ErrorCode.INTERNAL_SERVER_ERROR, "Failed to retrieve user");
    }
  }

  // Verify user with OTP
  async verifyUser(email: string, providedOTP: string): Promise<ApiResponseInterface<{ success: boolean; message: string }>> {
    try {
      const user = await this.userRepository.getUserByEmail(email);
      if (!user) {
        return ErrorBuilder.build(ErrorCode.USER_NOT_FOUND, "User does not exist");
      }

      if (user.verified) {
        return ErrorBuilder.build(ErrorCode.USER_ALREADY_VERIFIED, "User is already verified");
      }

      const verificationResult = await this.otpService.verifyOTP(
        email, providedOTP
      );

      if (verificationResult.success) {
        // Mark user as verified in database
        await this.userRepository.verifyUser(user.id);
        return ResponseBuilder.success({
          success: true,
          message: "User verified successfully"
        });
      } else {
        return ErrorBuilder.build(ErrorCode.INVALID_OTP, verificationResult.message || "OTP verification failed");
      }

    } catch (error) {
      console.error("Error verifying user:", error);
      return ErrorBuilder.build(ErrorCode.INTERNAL_SERVER_ERROR, "Internal server error during verification");
    }
  }

  // Resend OTP for verification
  async resendVerificationOTP(email: string): Promise<ApiResponseInterface<{ success: boolean; message: string }>> {
    try {
      const user = await this.userRepository.getUserByEmail(email);
      if (!user) {
        return ErrorBuilder.build(ErrorCode.USER_NOT_FOUND, "User not found");
      }

      if (user.verified) {
        return ErrorBuilder.build(ErrorCode.USER_ALREADY_VERIFIED, "User is already verified");
      }

      const otpResult = await this.otpService.resendOTP(email);

      if (otpResult.success) {
        // In a real application, you would store the new OTP and expiration in database
        return ResponseBuilder.success({
          success: true,
          message: "Verification OTP sent successfully"
        });
      } else {
        return ErrorBuilder.build(ErrorCode.OTP_SEND_FAILED, otpResult.message || "Failed to resend OTP");
      }

    } catch (error) {
      console.error("Error resending OTP:", error);
      return ErrorBuilder.build(ErrorCode.INTERNAL_SERVER_ERROR, "Failed to resend verification OTP");
    }
  }

  // send password reset email

  async sendPasswordResetEmail(email: string) {
    try {
      const user = await this.userRepository.getUserByEmail(email);
      if (!user) {
        return ErrorBuilder.build(ErrorCode.USER_NOT_FOUND, "User not found");
      }

      const passwordResetResult = await this.otpService.sendGeneratedPasswordResetToken(email);

      if (passwordResetResult.success) {
        // In a real application, you would store the new OTP and expiration in database
        return ResponseBuilder.success({
          success: true,
          message: "password reset email sent successfully"
        });
      } else {
        return ErrorBuilder.build(ErrorCode.OTP_SEND_FAILED, passwordResetResult.message || "Failed to send password reset email");
      }

    } catch (error) {
      console.error("Error resending OTP:", error);
      return ErrorBuilder.build(ErrorCode.INTERNAL_SERVER_ERROR, "Failed to send password reset email");
    }
  } 

// Assuming this is within your ApplicationService
async verifyTokenAndChangePassword(email: string, password: string, token: string) : Promise<ApiResponseInterface<OTPResult>> {
  try {
      const user = await this.userRepository.getUserByEmail(email);
      if (!user) {
          // Fail fast if user isn't found
          return ErrorBuilder.build(ErrorCode.USER_NOT_FOUND, "User not found");
      }

      const verifyToken = await this.otpService.verifyPasswordResetToken(email, token);

      if (!verifyToken.success) {
          // Return the specific error message from the OTPService
          return ErrorBuilder.build(ErrorCode.OTP_VERIFICATION_FAILED, verifyToken.error?.message || "");
      }

      const updatePassword: boolean = await this.userRepository.updatePassword(email, password);

      if (updatePassword) {
          // Attempt to delete the token. Log the error but don't fail the entire process
          // since the password was already updated.
          const deleteResult = await this.otpService.deletePasswordResetToken(token);
          if (!deleteResult.success) {
              // Log the failure to delete the token for debugging
              console.warn(`Failed to delete token for email ${email}: ${deleteResult.message}`);
          }

          return { success: true, message: "Password updated successfully." };
      } else {
          // Handle the case where the password update itself failed
          return ErrorBuilder.build(ErrorCode.INTERNAL_SERVER_ERROR, "Failed to update password.");
      }
  } catch (error) {
      // Log the error for debugging purposes
      console.error("Error in verifyTokenAndChangePassword:", error);
      
      // Return a generic error message to the client
      return ErrorBuilder.build(ErrorCode.INTERNAL_SERVER_ERROR, "Failed to complete password reset.");
  }
}
  // oauth facebook 
  async tokenExchange(code : any, state: any) : Promise<string> {
    
    const tokenResponse : FacebookTokenResponse = await this.facebookAuthService.exchangeCodeForToken(code, state);

    return tokenResponse.access_token as string
  }

  // get all users 
  async getUsers(params: PaginationParams): Promise<ApiResponseInterface<Partial<User>[]>> {
    try {
      const users = await this.userRepository.getUsers(params);
      return ResponseBuilder.paginatedSuccess(users.data, users.pagination);
    } catch (error) {
       return ErrorBuilder.build(
      ErrorCode.INTERNAL_SERVER_ERROR,
      "Unexpected error while listing users for admin",
      error instanceof Error ? error.message : error)
    }
}

  // Update Stripe info
  async updateUserStripeInfo(
    id: string,
    customerId: string,
    subscriptionId?: string
  ): Promise<ApiResponseInterface<User>> {
    try {
      const user = await this.userRepository.updateUserStripeInfo(id, customerId, subscriptionId);
      if (!user) {
        return ErrorBuilder.build(ErrorCode.USER_NOT_FOUND, "User not found or update failed");
      }
      return ResponseBuilder.success(user);
    } catch (error) {
      console.error("Error updating user Stripe info:", error);
      return ErrorBuilder.build(ErrorCode.INTERNAL_SERVER_ERROR, "Failed to update user Stripe information");
    }
  }
}