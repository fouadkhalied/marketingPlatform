import { transporter, senderEmail } from "../config/resend.config";

export interface EmailResult {
  success: boolean;
  message?: string;
  errorCode?: string;
  data?: any;
}

export class EmailService {
  constructor() {}

  /**
   * Send verification email with custom content
   * @param email - Recipient email address
   * @param subject - Email subject
   * @param htmlContent - HTML content of the email
   * @returns Promise<EmailResult>
   */
  async sendVerificationEmail(
    email: string,
    subject: string,
    htmlContent: string
  ): Promise<EmailResult> {
    try {
      console.log("=== EMAIL SERVICE DEBUG ===");
      console.log("Attempting to send email:");
      console.log("- from:", senderEmail);
      console.log("- to:", email);
      console.log("- subject:", subject);
      console.log("- htmlContent length:", htmlContent.length);
      console.log("- Transporter exists:", !!transporter);

      // Send email using nodemailer
      const info = await transporter.sendMail({
        from: `"OctopusAd" <${senderEmail}>`, // sender address with name
        to: email, // recipient
        subject: subject, // Subject line
        html: htmlContent, // HTML body
        text: this.stripHtml(htmlContent), // Plain text body (fallback)
      });

      console.log("Email sent successfully!");
      console.log("Message ID:", info.messageId);
      console.log("Response:", info.response);
      console.log("Accepted:", info.accepted);
      console.log("Rejected:", info.rejected);
      console.log("=== EMAIL SERVICE SUCCESS ===");

      return {
        success: true,
        message: "Email sent successfully",
        data: {
          messageId: info.messageId,
          response: info.response,
          accepted: info.accepted,
          rejected: info.rejected,
          envelope: info.envelope,
        },
      };
    } catch (error: any) {
      console.error("=== EMAIL SERVICE ERROR ===");
      console.error("Failed to send verification email:", error);
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error code:", error.code);
      console.error("Error stack:", error.stack);

      // Handle specific SMTP errors
      let errorMessage = error.message || "Failed to send verification email";
      let errorCode = error.code || error.name || "UNKNOWN_ERROR";

      // Provide user-friendly error messages
      if (error.code === "EAUTH") {
        errorMessage = "SMTP Authentication failed. Please check your email credentials.";
        errorCode = "AUTH_FAILED";
      } else if (error.code === "ECONNECTION" || error.code === "ECONNREFUSED") {
        errorMessage = "Cannot connect to email server. Please check SMTP host and port.";
        errorCode = "CONNECTION_FAILED";
      } else if (error.code === "ETIMEDOUT") {
        errorMessage = "Connection to email server timed out. Please try again.";
        errorCode = "TIMEOUT";
      } else if (error.code === "EENVELOPE") {
        errorMessage = "Invalid sender or recipient email address.";
        errorCode = "INVALID_EMAIL";
      } else if (error.responseCode === 550) {
        errorMessage = "Recipient email address does not exist or is invalid.";
        errorCode = "RECIPIENT_NOT_FOUND";
      }

      return {
        success: false,
        message: errorMessage,
        errorCode: errorCode,
        data: {
          originalError: error.message,
          code: error.code,
          command: error.command,
        },
      };
    }
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }
}