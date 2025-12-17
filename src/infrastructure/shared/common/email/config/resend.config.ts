// config/email.config.ts
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Validate required environment variables
if (!process.env.SMTP_HOST) {
  throw new Error("❌ SMTP_HOST is not set in environment variables");
}

if (!process.env.SMTP_USER) {
  throw new Error("❌ SMTP_USER is not set in environment variables");
}

if (!process.env.SMTP_PASSWORD) {
  throw new Error("❌ SMTP_PASSWORD is not set in environment variables");
}

if (!process.env.SENDER_EMAIL) {
  throw new Error("❌ SENDER_EMAIL is not set in environment variables");
}

// Create transporter with cPanel SMTP settings
export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "465"),
  secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
  tls: {
    // Do not fail on invalid certs (useful for self-signed certificates)
    rejectUnauthorized: false
  }
});

export const senderEmail = process.env.SENDER_EMAIL;

// Verify connection configuration on startup
transporter.verify((error, success) => {
  if (error) {
    //console.error("❌ Email configuration error:", error);
    //console.error(process.env.SMTP_PASSWORD)
  } else {
    console.log("✅ Email server is ready to send messages");
  }
});