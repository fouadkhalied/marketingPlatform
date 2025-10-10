export interface VerificationEmailParams {
    email: string;
    otp: string;
    subject?: string;
    expirationMinutes?: number;
}
  