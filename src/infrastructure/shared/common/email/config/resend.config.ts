import { Resend } from "resend";
import dotenv from "dotenv";
dotenv.config();

if (!process.env.RESEND_API_KEY) {
  throw new Error("❌ RESEND_API_KEY is not set in environment variables");
}

if (!process.env.SENDER_EMAIL) {
    throw new Error("❌ SENDER_EMAIL is not set in environment variables");
}

export const resend = new Resend(process.env.RESEND_API_KEY);
export const senderEmail = process.env.SENDER_EMAIL