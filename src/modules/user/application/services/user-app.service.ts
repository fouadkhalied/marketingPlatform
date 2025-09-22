import { ResponseBuilder } from "../../../../infrastructure/shared/common/apiResponse/apiResponseBuilder";
import { ApiResponseInterface } from "../../../../infrastructure/shared/common/apiResponse/interfaces/apiResponse.interface";
import { JwtService } from "../../../../infrastructure/shared/common/auth/module/jwt.module";
import { ErrorCode } from "../../../../infrastructure/shared/common/errors/enums/basic.error.enum";
import { ErrorBuilder } from "../../../../infrastructure/shared/common/errors/errorBuilder";
import { OTPService } from "../../../../infrastructure/shared/common/otp/module/otp.module";
import { CreateUser, User } from "../../../../infrastructure/shared/schema/schema";
import { UserRepositoryImpl } from "../../infrastructure/repositories/user.repository.impl";

export class UserAppService {
  constructor(
    private readonly userRepository: UserRepositoryImpl,
    private readonly otpService: OTPService,
    private readonly jwtService: JwtService
  ) {
    
  }

  // Create a new user
  async createUser(input: CreateUser): Promise<ApiResponseInterface<User>> {
    try {
      // Perform application-level validation
      const existingUser = await this.userRepository.getUserByEmail(input.email);
      if (existingUser) {
        return ErrorBuilder.build(ErrorCode.USER_ALREADY_EXISTS, "Email already exists");
      }

      const newUser = await this.userRepository.createUser(input);
      
      // Generate and send OTP for verification
      const otp = this.otpService.generateOTP();
      const otpResult = await this.otpService.sendOTP({
        email: input.email,
        otp,
        subject: "Verify your account"
      });

      if (!otpResult.success) {
        console.warn("Failed to send OTP email for user:", input.email);
        // You might want to handle this differently - maybe queue for retry
      }

      return ResponseBuilder.success(newUser);
    } catch (error) {
      console.error("Error creating user:", error);
      return ErrorBuilder.build(ErrorCode.INTERNAL_SERVER_ERROR, "Failed to create user");
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

      // In a real application, you would retrieve the stored OTP and expiration from database
      // For this example, we'll simulate it
      const storedOTP = "123456"; // This should come from your database
      const storedExpiration = new Date(Date.now() + 10 * 60 * 1000); // This should come from your database

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