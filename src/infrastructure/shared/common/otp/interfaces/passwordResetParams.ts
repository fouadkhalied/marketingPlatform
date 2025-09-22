export interface PasswordResetParams {
    email: string;
    hashedToken: string;
    subject?: string;
    expirationMinutes?: number;
}