import { resend, senderEmail } from "../config/resend.config";
import { ErrorCode } from "../../errors/enums/basic.error.enum";
import { ErrorBuilder } from "../../errors/errorBuilder";

export interface EmailResult {
  success: boolean;
  message?: string;
  errorCode?: string;
}

export class EmailService {
  constructor() {}

  async sendVerificationEmail(email: string, subject: string, htmlContent: string): Promise<EmailResult> {
    try {
      await resend.emails.send({
        from: senderEmail, 
        to: email,
        subject: subject,
        html: htmlContent,
      });
      
      return {
        success: true,
        message: "Email sent successfully"
      };
    } catch (error) {
      console.error("Failed to send verification email:", error);
      
      return ErrorBuilder.build(
        ErrorCode.EXTERNAL_SERVICE_ERROR,
        "Failed to send verification email"
      );
    }
  }
}