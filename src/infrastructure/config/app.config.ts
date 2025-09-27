import dotenv from "dotenv";
dotenv.config()

function requireEnv(key: string): string {
    const value = process.env[key];
    if (!value) {
      throw new Error(`❌ Missing required environment variable: ${key}`);
    }
    return value;
  }
  
  export const appConfig = {
    DATABASE_URL: requireEnv("DATABASE_URL"),
    STRIPE_SECRET_KEY: requireEnv("STRIPE_SECRET_KEY"),
    STRIPE_PUBLISHABLE_KEY: requireEnv("STRIPE_PUBLISHABLE_KEY"),
    STRIPE_WEBHOOK_SECRET: requireEnv("STRIPE_WEBHOOK_SECRET"),
    JWT_SECRET: requireEnv("JWT_SECRET"),
    RESEND_API_KEY: requireEnv("RESEND_API_KEY"),
    SENDER_EMAIL: requireEnv("SENDER_EMAIL"),
  
    FACEBOOK_APP_ID: requireEnv("FACEBOOK_APP_ID"),
    FACEBOOK_APP_SECRET: requireEnv("FACEBOOK_APP_SECRET"),
    FACEBOOK_APP_ACCESS_TOKEN: requireEnv("FACEBOOK_APP_ACCESS_TOKEN"),
    FACEBOOK_APP_SECRET_STATE:requireEnv("FACEBOOK_APP_SECRET_STATE"),
    FACEBOOK_AUTH_URL:requireEnv("FACEBOOK_AUTH_URL"),

    FACEBOOK_APP_OAUTH_ID: requireEnv("FACEBOOK_APP_OAUTH_ID"),
    FACEBOOK_APP_OAUTH_SECRET: requireEnv("FACEBOOK_APP_OAUTH_SECRET"),
    FACEBOOK_APP_OAUTH_ACCESS_TOKEN: requireEnv("FACEBOOK_APP_OAUTH_ACCESS_TOKEN"),
    FACEBOOK_REDIRECT_URI: requireEnv("FACEBOOK_REDIRECT_URI"),

  };
  