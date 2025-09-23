import { resend, senderEmail } from "../config/resend.config";
import { ErrorCode } from "../../errors/enums/basic.error.enum";
import { ErrorBuilder } from "../../errors/errorBuilder";

export interface EmailResult {
  success: boolean;
  message?: string;
  errorCode?: string;
  data?: any; // Add this to capture Resend response data
}

export class EmailService {
  constructor() {}

 
  async sendVerificationEmail(email: string, subject: string, htmlContent: string): Promise<EmailResult> {
    try {
      console.log("=== EMAIL SERVICE DEBUG ===");
      console.log("Attempting to send email:");
      console.log("- from:", senderEmail);
      console.log("- to:", email);
      console.log("- subject:", subject);
      console.log("- htmlContent length:", htmlContent.length);
      console.log("- Resend instance exists:", !!resend);

      // IMPORTANT: Capture the response from Resend
      const response = await resend.emails.send({
        from: senderEmail,
        to: email,
        subject: subject,
        html: htmlContent,
      });

      console.log("Resend API response:", JSON.stringify(response, null, 2));

      // Check if Resend returned an error
      if (response.error) {
        console.error("Resend API returned error:", response.error);
        return {
          success: false,
          message: `Resend API error: ${response.error.message}`,
          errorCode: response.error.name,
          data: response
        };
      }

      // Check if we have a valid response with data
      if (!response.data || !response.data.id) {
        console.error("Resend API returned invalid response:", response);
        return {
          success: false,
          message: "Invalid response from email service",
          data: response
        };
      }

      console.log("Email sent successfully with ID:", response.data.id);
      console.log("=== EMAIL SERVICE SUCCESS ===");
      
      return {
        success: true,
        message: "Email sent successfully",
        data: response.data
      };

    } catch (error: any) {
      console.error("=== EMAIL SERVICE ERROR ===");
      console.error("Failed to send verification email:", error);
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
      
      // Check for specific Resend errors
      if (error.name === 'ResendError') {
        console.error("This is a Resend-specific error");
      }

      return {
        success: false,
        message: error.message || "Failed to send verification email",
        errorCode: error.name || "UNKNOWN_ERROR"
      };
    }
  }
}