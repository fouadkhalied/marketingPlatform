export interface OTPResult {
  success: boolean;
  message?: string;
  otp?: string;
  expiresAt?: Date;
}