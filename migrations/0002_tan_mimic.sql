CREATE TYPE "public"."notification_module" AS ENUM('AD', 'PAYMENT', 'CREDIT', 'USER');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('AD_APPROVED', 'AD_REJECTED', 'AD_ACTIVATED', 'AD_DEACTIVATED', 'PAYMENT_SUCCESS', 'PAYMENT_FAILED', 'PAYMENT_PENDING', 'PAYMENT_REFUNDED', 'CREDIT_ADDED', 'CREDIT_DEDUCTED', 'CREDIT_LOW_BALANCE');--> statement-breakpoint
CREATE TABLE "ads_packages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text DEFAULT '' NOT NULL,
	"amount" integer DEFAULT 0 NOT NULL,
	"created_by" varchar,
	"updated_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"module" "notification_module" NOT NULL,
	"type" "notification_type" NOT NULL,
	"title" jsonb NOT NULL,
	"message" jsonb NOT NULL,
	"metadata" jsonb,
	"read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_email" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "user_email_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "ads" ADD COLUMN "freeViews" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "fisrt_name" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_name" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "phone_number" text;--> statement-breakpoint
ALTER TABLE "ads_packages" ADD CONSTRAINT "ads_packages_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ads_packages" ADD CONSTRAINT "ads_packages_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;