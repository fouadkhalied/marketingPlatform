import { ResponseBuilder } from "../../../../infrastructure/shared/common/apiResponse/apiResponseBuilder";
import { ApiResponseInterface } from "../../../../infrastructure/shared/common/apiResponse/interfaces/apiResponse.interface";
import { JwtService } from "../../../../infrastructure/shared/common/auth/module/jwt.module";
import { ErrorCode } from "../../../../infrastructure/shared/common/errors/enums/basic.error.enum";
import { ErrorBuilder } from "../../../../infrastructure/shared/common/errors/errorBuilder";
import { OTPResult } from "../../../../infrastructure/shared/common/otp/interfaces/optResult";
import { OTPService } from "../../../../infrastructure/shared/common/otp/module/otp.module";
import { CreateUser, User } from "../../../../infrastructure/shared/schema/schema";
import { UserRepositoryImpl } from "../../infrastructure/repositories/user.repository.impl";
import { PaginationParams } from "../../../../infrastructure/shared/common/pagination.vo";
import { FacebookPageService } from "./facebook-app.service";

export class UserAppService {
  constructor(
    private readonly userRepository: UserRepositoryImpl,
    private readonly otpService: OTPService,
    private readonly jwtService: JwtService,
    private readonly facebookAuthService: FacebookPageService
  ) {
    
  }

  // Create a new user
  async createUser(input: CreateUser): Promise<ApiResponseInterface<{token : string ;username: string | null; role : "user" | "admin"; }>> {
    try {
      // Perform application-level validation
      const existingUser = await this.userRepository.getUserByEmail(input.email);
      if (existingUser) {
        return ErrorBuilder.build(ErrorCode.USER_ALREADY_EXISTS, "Email already exists");
      }

      const user = await this.userRepository.createUser(input);

      await this.userRepository.verifyUser(user.id)
      
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
      
    } catch (error:any) {
      console.error("Error creating user:", error);
      return ErrorBuilder.build(ErrorCode.INTERNAL_SERVER_ERROR, error.message);
    }
  }

    // Promote user to admin
  async makeUserAdmin(id: string): Promise<ApiResponseInterface<User>> {
      try {
        const user = await this.userRepository.makeUserAdmin(id);
        if (!user) {
          return ErrorBuilder.build(ErrorCode.USER_NOT_FOUND, "User not found");
        }
        return ResponseBuilder.success(user, "User promoted to admin successfully");
      } catch (error) {
        console.error("Error promoting user to admin:", error);
        return ErrorBuilder.build(ErrorCode.INTERNAL_SERVER_ERROR, "Failed to promote user to admin");
      }
    }  

      // Delete user by ID
  async deleteUser(id: string): Promise<ApiResponseInterface<null>> {
    try {
      const deletedUser = await this.userRepository.deleteUser(id);

      if (!deletedUser) {
        return ErrorBuilder.build(ErrorCode.USER_NOT_FOUND, "User not found");
      }

      return ResponseBuilder.success(null, "User deleted successfully");
    } catch (error) {
      console.error("Error deleting user:", error);
      return ErrorBuilder.build(ErrorCode.INTERNAL_SERVER_ERROR, "Failed to delete user");
    }
  }

  async login(email: string, password: string): Promise<ApiResponseInterface<{role : "admin" | "user"; username : string | null; token: string}>> {
    try {
      // 1. Find the user by email
      const user = await this.userRepository.getUserByEmail(email);
      if (!user) {
        return ErrorBuilder.build(ErrorCode.INVALID_CREDENTIALS, "Invalid credentials");
      }

      // 2. Ensure the user is verified before allowing login
      if (!user.verified) {
        return ErrorBuilder.build(ErrorCode.USER_NOT_VERIFIED, "Account not verified. Please check your email for the verification code.");
      }
    
      // 3. Compare the provided password with the stored hash
      const isPasswordValid = await this.jwtService.comparePassword(password, user.password, "normal");
      if (!isPasswordValid) {
        return ErrorBuilder.build(ErrorCode.INVALID_CREDENTIALS, "Wrong password");
      }
    
      // 4. Generate a JWT token
      const payload = { userId: user.id, email: user.email, role: user.role , oauth: "normal"};
      const token = this.jwtService.sign(payload);
    
      return ResponseBuilder.success({
        token : token,
        role : payload.role,
        username : user.username
      });
      
    } catch (error) {
      console.error("Error during login:", error);
      return ErrorBuilder.build(ErrorCode.INTERNAL_SERVER_ERROR, "Login failed");
    }
  }

  // Get user by ID
  async getUser(id: string): Promise<ApiResponseInterface<Partial<User & { socialMediaPages: Array<{ pageId: string; pageName: string; pageType: string; isActive: boolean }> }> | undefined>> {
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

  async sendPasswordResetEmail(email: string): Promise<ApiResponseInterface<{ success: boolean; message: string }>> {
    try {

      const user = await this.userRepository.getUserByEmail(email);
      
      if (!user) {
        return ErrorBuilder.build(ErrorCode.USER_NOT_FOUND, "User not found");
      }

      // if (user.verified) {
      //   return ErrorBuilder.build(ErrorCode.USER_ALREADY_VERIFIED, "User is already verified");
      // }

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
  async tokenExchange(code: string , userId: string, state?: string, expectedState?: string): Promise<ApiResponseInterface<{data : any}>> {
    try {
      // Validate state parameter for CSRF protection
      if (expectedState && state !== expectedState) {
        throw new Error("Invalid state parameter - possible CSRF attack");
      }

      // Exchange code for token
      const tokenResponse = await this.facebookAuthService.exchangeCodeForToken({
        code
      });

      const savePageData = await this.facebookAuthService.getUserPagesAndSaveTokens(tokenResponse.access_token, userId);

      // // Validate the token
      // const isValidToken = await this.facebookAuthService.validateToken(tokenResponse.access_token);
      // if (!isValidToken) {
      //   throw new Error("Received invalid access token from Facebook");
      // }

      // Get user profile
      //const user = await this.facebookAuthService.getUserProfile(tokenResponse.access_token);

      return ResponseBuilder.success({data : savePageData.savedPages}, "access token for page saved successfully");
    } catch (error) {
      console.error("Facebook OAuth token exchange failed:", error);
      throw new Error("Facebook authentication failed");
    }
  }


  // generate facebook auth url 
  async generateFacebookAuthUrl(userId: string) : Promise<string> {
    const redirectUri = "https://marketing-platform-six.vercel.app/api/auth/facebook/callback";
      const state = `12345_${userId}`;
      
      const authUrl = `https://www.facebook.com/v23.0/dialog/oauth?` +
        `client_id=562659103570379&` +
        `redirect_uri=${redirectUri}&` +
        `state=${state}&` +
        `scope=email,public_profile,pages_show_list,pages_read_engagement,pages_read_user_content,pages_manage_engagement&` +
        `response_type=code`;

        return authUrl
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
  async createAdClick(
    adId: string, 
    userId: string
  ): Promise<ApiResponseInterface<string>> {
    try {
      await this.userRepository.createAdClick(adId, userId);
  
      return ResponseBuilder.success("Click recorded successfully");
    } catch (error: any) {
  
      // Handle specific error for duplicate click
      if (error.message === "USER_ALREADY_CLICKED") {
        return ErrorBuilder.build(
          ErrorCode.DUPLICATE_ENTRY,
          "User already clicked this ad"
        );
      }
  
      return ErrorBuilder.build(
        ErrorCode.INTERNAL_SERVER_ERROR,
        "Failed to record click",
        error.message || "Unknown error"
      );
    }
  }
}