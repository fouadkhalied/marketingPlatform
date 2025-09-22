export interface PasswordResetResult {
    success: boolean;
    message?: string;
    url?: string;
    expiresAt?: Date;
  }