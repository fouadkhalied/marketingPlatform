import { eq } from "drizzle-orm";
import { EmailService } from "../../email/module/resend.module";
import { ErrorCode } from "../../errors/enums/basic.error.enum";
import { ErrorBuilder } from "../../errors/errorBuilder";
import { OTPResult } from "../interfaces/optResult";
import { VerificationEmailParams } from "../interfaces/verificationEmailParams";
import { otps, users } from "../../../schema/schema";
import { db } from "../../../../db/connection";
import crypto from 'crypto'; 
import { PasswordResetParams } from "../interfaces/passwordResetParams";
import { PasswordResetResult } from "../interfaces/passwordResetResult";
import { ResponseBuilder } from "../../apiResponse/apiResponseBuilder";
import { ApiResponseInterface } from "../../apiResponse/interfaces/apiResponse.interface";

export class OTPService {
  private readonly DEFAULT_EXPIRATION_MINUTES = 10;
  private readonly DEFAULT_SUBJECT = "Verify your account";

  constructor(private readonly emailService: EmailService) {}

  generatePasswordResetToken(): { plaintextToken: string; hashedToken: string } {
    // Generates a cryptographically secure random string
    const plaintextToken = crypto.randomBytes(32).toString('hex');
    
    // Creates a SHA-256 hash (fingerprint) of the token for secure storage
    const hashedToken = crypto.createHash('sha256').update(plaintextToken).digest('hex');

    return { plaintextToken, hashedToken };
  }


  async sendGeneratedPasswordResetToken(email: string): Promise<PasswordResetResult> {
    
    const [user] = await db.select().from(users).where(eq(users.email, email));
    
    if (!user) {
        // NOTE: We return a success message here to prevent user enumeration attacks.
        // It's a security best practice to not reveal if a user exists or not.
        return ResponseBuilder.success({
            success: true,
            message: "If a user with that email exists, a password reset link has been sent.",
        });
    }

    try {
        const { plaintextToken, hashedToken } = this.generatePasswordResetToken();
        const expiresAt = this.calculateExpirationTime(15);

        await db.insert(otps)
            .values({
                id: hashedToken,
                otpCode: hashedToken,
                type: "PASSWORD_RESET",
                email: email,
                expiresAt,
                used: false,
                createdAt: new Date(),
            })
            .onConflictDoUpdate({
                target: otps.id,
                set: {
                    otpCode: plaintextToken,
                    expiresAt,
                    used: false,
                },
            });

        const resetUrl = `https://your-app-domain.com/reset-password?token=${plaintextToken}`;
        const emailHtml = this.generatePasswordResetEmailTemplate(resetUrl, 15);
        
        const emailResult = await this.emailService.sendVerificationEmail(
            email,
            "Password Reset",
            emailHtml
        );

        if (!emailResult.success) {
            return ErrorBuilder.build(ErrorCode.EXTERNAL_SERVICE_ERROR, "Failed to send password reset email.");
        }

        return {
            success: true,
            message: "Password reset email sent successfully.",
            url: resetUrl,
            expiresAt,
        };

    } catch (error) {
        console.error("Failed to send password reset email:", error);
        return ErrorBuilder.build(ErrorCode.INTERNAL_SERVER_ERROR, "Failed to initiate password reset.");
    }
}



  // in your OTPService or a dedicated PasswordResetService
  

async verifyPasswordResetToken(email: string, token: string): Promise<ApiResponseInterface<OTPResult>> {
  try {
      // Step 1: Create the hash from the token to use for a secure lookup.
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
      
      // Step 2: Find the token record in the database using the secure hash.
      const [record] = await db.select().from(otps).where(eq(otps.otpCode, hashedToken));

      // Step 3: Validate the record in the correct, sequential order.
      if (!record) {
        return ErrorBuilder.build(ErrorCode.VALIDATION_ERROR, "record does not exsist");
      }
      if (record.type.toUpperCase() !== "PASSWORD_RESET") {
          return ErrorBuilder.build(ErrorCode.VALIDATION_ERROR, "Invalid or expired token.");
        }
      if (new Date() > new Date(record.expiresAt)) {
          return ErrorBuilder.build(ErrorCode.VALIDATION_ERROR, "Token has expired.");
      }
      if (record.used) {
          return ErrorBuilder.build(ErrorCode.VALIDATION_ERROR, "Token has already been used.");
      }
  
      if (record.email !== email) { 
          return ErrorBuilder.build(ErrorCode.VALIDATION_ERROR, "Token is not for this email address.");
      }

      return { success: true, message: "Token is valid." };

  } catch (error) {
      console.error("Token verification failed:", error);
      return ErrorBuilder.build(ErrorCode.INTERNAL_SERVER_ERROR, "Token verification failed.");
  }
}

async deletePasswordResetToken(token: string): Promise<OTPResult> {
  try {
      // Step 1: Hash the plaintext token to get the secure lookup key.
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

      // Step 2: Delete the record from the database using the secure hash.
      const result = await db.delete(otps).where(eq(otps.otpCode, hashedToken));

      if (result.rowCount === 0) {
          return ErrorBuilder.build(ErrorCode.INVALID_OTP, "Token not found for deletion.");
      }

      return { success: true, message: "Token deleted successfully." };

  } catch (error) {
      console.error("Failed to delete password reset token:", error);
      return ErrorBuilder.build(ErrorCode.INTERNAL_SERVER_ERROR, "Failed to delete token.");
  }
}

  // OTP generation methods

  generateOTP(length: number = 6): string {
    const digits = "0123456789";
    let otp = "";
    for (let i = 0; i < length; i++) {
      otp += digits[Math.floor(Math.random() * digits.length)];
    }
    return otp;
  }

  calculateExpirationTime(minutes: number = this.DEFAULT_EXPIRATION_MINUTES): Date {
    const now = new Date();
    now.setMinutes(now.getMinutes() + minutes);
    return now;
  }

  async sendOTP(params: VerificationEmailParams): Promise<OTPResult> {
    try {
      const {
        email,
        otp,
        subject = this.DEFAULT_SUBJECT,
        expirationMinutes = this.DEFAULT_EXPIRATION_MINUTES,
      } = params;

      if (!email || !otp) {
        return ErrorBuilder.build(ErrorCode.VALIDATION_ERROR, "Email and OTP are required");
      }

      const expiresAt = this.calculateExpirationTime(expirationMinutes);

      await this.upsertOTP(email, otp, expiresAt);

      const htmlContent = this.generateEmailTemplate(otp, expirationMinutes);

      const emailResult = await this.emailService.sendVerificationEmail(email, subject, htmlContent);

      console.log("Email service result:", JSON.stringify(emailResult, null, 2));
      console.log(email, subject);

      if (!emailResult.success) {
        return ErrorBuilder.build(
          ErrorCode.EXTERNAL_SERVICE_ERROR,
          emailResult.message || "Failed to send OTP email"
        );
      }

      return { success: true, message: "OTP sent successfully", otp, expiresAt };
    } catch (error) {
      console.error("Failed to send OTP:", error);
      return ErrorBuilder.build(ErrorCode.EXTERNAL_SERVICE_ERROR, "Failed to send OTP. Please try again.");
    }
  }

  async resendOTP(email: string): Promise<OTPResult> {
    try {
      if (!email) {
        return ErrorBuilder.build(ErrorCode.VALIDATION_ERROR, "Email is required");
      }

      const newOTP = this.generateOTP();

      return await this.sendOTP({
        email,
        otp: newOTP,
        subject: "New Verification Code",
        expirationMinutes: this.DEFAULT_EXPIRATION_MINUTES,
      });
    } catch (error) {
      console.error("Failed to resend OTP:", error);
      return ErrorBuilder.build(ErrorCode.INTERNAL_SERVER_ERROR, "Failed to resend OTP. Please try again.");
    }
  }

  async verifyOTP(email: string, providedOTP: string): Promise<OTPResult> {
    try {
      const key = `${email}:otp`;
      const [record] = await db.select().from(otps).where(eq(otps.id, key));

      if (!record) {
        return ErrorBuilder.build(ErrorCode.VALIDATION_ERROR, "OTP not found");
      }
      if (record.used) {
        return ErrorBuilder.build(ErrorCode.VALIDATION_ERROR, "OTP already used");
      }
      if (new Date() > new Date(record.expiresAt)) {
        return ErrorBuilder.build(ErrorCode.VALIDATION_ERROR, "OTP has expired");
      }
      if (!providedOTP) {
        return ErrorBuilder.build(ErrorCode.VALIDATION_ERROR, "provided otp parameter is required for OTP verification");
      }
      if (providedOTP !== record.otpCode) {
        return ErrorBuilder.build(ErrorCode.VALIDATION_ERROR, "Invalid OTP code");
      }

      await db.update(otps).set({ used: true }).where(eq(otps.id, key));

      return { success: true, message: "OTP verified successfully" };
    } catch (error) {
      console.error("OTP verification failed:", error);
      return ErrorBuilder.build(ErrorCode.INTERNAL_SERVER_ERROR, "OTP verification failed");
    }
  }

  private generateEmailTemplate(otp: string, expirationMinutes: number): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Email Verification</h2>
        <p>Hello 👋,</p>
        <p>Your OTP code is:</p>
        <div style="font-size: 32px; font-weight: bold; color: #007bff; text-align: center; margin: 20px 0; letter-spacing: 5px;">
          ${otp}
        </div>
        <p>This code expires in ${expirationMinutes} minutes.</p>
        <p>If you didn't request this code, please ignore this email.</p>
      </div>
    `;
  }

  private generatePasswordResetEmailTemplate(resetUrl: string, expirationMinutes: number): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset Request</h2>
        <p>Hello,</p>
        <p>You have requested to reset your password. Click the link below to continue:</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: #ffffff; text-decoration: none; border-radius: 5px;">
            Reset Password
        </a>
        <p>This link will expire in ${expirationMinutes} minutes.</p>
        <p>If you did not request a password reset, please ignore this email.</p>
      </div>
    `;
  }


  private async upsertOTP(email: string, newOTP: string, expiresAt: Date) {
    const sanitizedEmail = email.trim().toLowerCase();
    const id = `${sanitizedEmail}:otp`;

    try {
      await db.insert(otps)
        .values({
          id,
          otpCode: newOTP,
          type: "EMAIL_VERIFICATION",
          expiresAt,
          used: false,
          createdAt: new Date(),
        })
        .onConflictDoUpdate({
          target: otps.id,
          set: {
            otpCode: newOTP,
            expiresAt,
            used: false,
          },
        });
      console.log(`OTP upserted for ${id}`);
    } catch (error) {
      console.error(`Failed to upsert OTP for ${id}`, error);
      throw error;
    }
  }

  // private isValidEmail(email: string): boolean {
  //   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  //   return emailRegex.test(email);
  // }
}
