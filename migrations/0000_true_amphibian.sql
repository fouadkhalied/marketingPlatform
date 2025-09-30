CREATE TYPE "public"."ad_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."oauth_provider" AS ENUM('normal', 'google', 'facebook');--> statement-breakpoint
CREATE TYPE "public"."page_type" AS ENUM('facebook', 'instagram', 'snapchat');--> statement-breakpoint
CREATE TYPE "public"."purchase_status" AS ENUM('pending', 'completed', 'failed', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TABLE "ads" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"post_id_on_platform" varchar NOT NULL,
	"page_id" varchar,
	"title_en" text NOT NULL,
	"title_ar" text NOT NULL,
	"description_en" text NOT NULL,
	"description_ar" text NOT NULL,
	"target_url" text NOT NULL,
	"image_url" text,
	"status" "ad_status" DEFAULT 'pending' NOT NULL,
	"target_audience" text,
	"budget_type" text NOT NULL,
	"budget_credit" integer DEFAULT 0 NOT NULL,
	"publish_token" text,
	"approved_by" varchar,
	"rejection_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ads_post_id_on_platform_unique" UNIQUE("post_id_on_platform")
);
--> statement-breakpoint
CREATE TABLE "aggregated_stats" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ad_id" varchar NOT NULL,
	"date" timestamp NOT NULL,
	"impressions" integer DEFAULT 0 NOT NULL,
	"clicks" integer DEFAULT 0 NOT NULL,
	"ctr" numeric(5, 4) DEFAULT '0' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"action" text NOT NULL,
	"resource_type" text NOT NULL,
	"resource_id" varchar,
	"details" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clicks_events" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" varchar NOT NULL,
	"ad_id" varchar NOT NULL,
	"impression_event_id" varchar,
	"source" text DEFAULT 'web' NOT NULL,
	"ip_hash" text,
	"user_agent" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "impressions_events" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" varchar NOT NULL,
	"ad_id" varchar NOT NULL,
	"source" text DEFAULT 'web' NOT NULL,
	"viewer_hash" text,
	"ip_hash" text,
	"user_agent" text,
	"fallback_hash" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "impressions_events_event_id_unique" UNIQUE("event_id")
);
--> statement-breakpoint
CREATE TABLE "otps" (
	"id" varchar PRIMARY KEY NOT NULL,
	"otpCode" varchar NOT NULL,
	"type" varchar NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used" boolean DEFAULT false NOT NULL,
	"email" varchar DEFAULT 'blank' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purchases" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"status" "purchase_status" DEFAULT 'pending' NOT NULL,
	"currency" text NOT NULL,
	"method" text NOT NULL,
	"stripe_session_id" text,
	"stripe_payment_intent_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "social_media_pages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"pageType" "page_type" NOT NULL,
	"page_id" text NOT NULL,
	"page_name" text NOT NULL,
	"page_access_token" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"connected_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "social_media_pages_page_id_unique" UNIQUE("page_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text,
	"email" text NOT NULL,
	"password" text,
	"google_id" text,
	"facebook_id" text,
	"oauth" "oauth_provider" DEFAULT 'normal' NOT NULL,
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"free_views_credits" integer DEFAULT 10000 NOT NULL,
	"adsCount" integer DEFAULT 0,
	"totalSpend" integer DEFAULT 0,
	"balance" integer DEFAULT 0,
	"stripe_customer_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "ads" ADD CONSTRAINT "ads_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ads" ADD CONSTRAINT "ads_page_id_social_media_pages_page_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."social_media_pages"("page_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ads" ADD CONSTRAINT "ads_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "aggregated_stats" ADD CONSTRAINT "aggregated_stats_ad_id_ads_id_fk" FOREIGN KEY ("ad_id") REFERENCES "public"."ads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clicks_events" ADD CONSTRAINT "clicks_events_ad_id_ads_id_fk" FOREIGN KEY ("ad_id") REFERENCES "public"."ads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clicks_events" ADD CONSTRAINT "clicks_events_impression_event_id_impressions_events_id_fk" FOREIGN KEY ("impression_event_id") REFERENCES "public"."impressions_events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "impressions_events" ADD CONSTRAINT "impressions_events_ad_id_ads_id_fk" FOREIGN KEY ("ad_id") REFERENCES "public"."ads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_media_pages" ADD CONSTRAINT "social_media_pages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;