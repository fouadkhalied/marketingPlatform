import { eq } from "drizzle-orm";
import { EmailService } from "../../email/module/resend.module";
import { ErrorCode } from "../../errors/enums/basic.error.enum";
import { ErrorBuilder } from "../../errors/errorBuilder";
import { OTPResult } from "../interfaces/optResult";
import { VerificationEmailParams } from "../interfaces/verificationEmailParams";
import { otps } from "../../../schema/schema";
import { db } from "../../../../db/connection";
import crypto from 'crypto'; 
import { PasswordResetParams } from "../interfaces/passwordResetParams";

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


  async sendGeneratedPasswordResetToken(payload: PasswordResetParams) {
    
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
      if (!this.isValidEmail(email)) {
        return ErrorBuilder.build(ErrorCode.VALIDATION_ERROR, "Invalid email format");
      }

      const expiresAt = this.calculateExpirationTime(expirationMinutes);

      await this.upsertOTP(email, otp, expiresAt);

      const htmlContent = this.generateEmailTemplate(otp, expirationMinutes);

      const emailResult = await this.emailService.sendVerificationEmail(email, subject, htmlContent);

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

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
