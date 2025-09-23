import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, jsonb, decimal, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);
export const adStatusEnum = pgEnum("ad_status", ["pending", "approved", "rejected"]);
export const purchaseStatusEnum = pgEnum("purchase_status", ["pending", "completed", "failed", "refunded"]);

export const users = pgTable("users", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    username: text("username").notNull().unique(),
    email: text("email").notNull().unique(),
    password: text("password").notNull(),
    role: userRoleEnum("role").notNull().default("user"),
    verified: boolean("verified").notNull().default(false),
    freeViewsCredits: integer("free_views_credits").notNull().default(10000),
    stripeCustomerId: text("stripe_customer_id"),
    createdAt: timestamp("created_at").notNull().default(sql`now()`),
    updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
  });
  
  export const ads = pgTable("ads", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id").notNull().references(() => users.id),
    titleEn: text("title_en").notNull(),
    titleAr: text("title_ar").notNull(),
    descriptionEn: text("description_en").notNull(),
    descriptionAr: text("description_ar").notNull(),
    targetUrl: text("target_url").notNull(),
    imageUrl: text("image_url"),
    status: adStatusEnum("status").notNull().default("pending"),
    targetAudience: text("target_audience"),
    budgetType: text("budget_type"), // "impressions" or "clicks"
    publishToken: text("publish_token"),
    approvedBy: varchar("approved_by").references(() => users.id),
    rejectionReason: text("rejection_reason"),
    createdAt: timestamp("created_at").notNull().default(sql`now()`),
    updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
  });
  
  export const purchases = pgTable("purchases", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id").notNull().references(() => users.id),
    adId: varchar("ad_id").references(() => ads.id),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    impressionsAllocated: integer("impressions_allocated").notNull().default(0),
    status: purchaseStatusEnum("status").notNull().default("pending"),
    currency: text("currency").notNull(),
    method: text("method").notNull(),
    stripeSessionId: text("stripe_session_id"),
    stripePaymentIntentId: text("stripe_payment_intent_id"),
    createdAt: timestamp("created_at").notNull().default(sql`now()`),
    updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
  });
  
  export const impressionsEvents = pgTable("impressions_events", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    eventId: varchar("event_id").notNull().unique(),
    adId: varchar("ad_id").notNull().references(() => ads.id),
    source: text("source").notNull().default("web"),
    viewerHash: text("viewer_hash"),
    ipHash: text("ip_hash"),
    userAgent: text("user_agent"),
    fallbackHash: text("fallback_hash"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").notNull().default(sql`now()`),
  });
  
  export const clicksEvents = pgTable("clicks_events", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    eventId: varchar("event_id").notNull(),
    adId: varchar("ad_id").notNull().references(() => ads.id),
    impressionEventId: varchar("impression_event_id").references(() => impressionsEvents.id),
    source: text("source").notNull().default("web"),
    ipHash: text("ip_hash"),
    userAgent: text("user_agent"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").notNull().default(sql`now()`),
  });
  
  export const aggregatedStats = pgTable("aggregated_stats", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    adId: varchar("ad_id").notNull().references(() => ads.id),
    date: timestamp("date").notNull(),
    impressions: integer("impressions").notNull().default(0),
    clicks: integer("clicks").notNull().default(0),
    ctr: decimal("ctr", { precision: 5, scale: 4 }).notNull().default("0"),
    createdAt: timestamp("created_at").notNull().default(sql`now()`),
    updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
  });
  
  export const auditLogs = pgTable("audit_logs", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id").references(() => users.id),
    action: text("action").notNull(),
    resourceType: text("resource_type").notNull(),
    resourceId: varchar("resource_id"),
    details: jsonb("details"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").notNull().default(sql`now()`),
  });


  export const otps = pgTable("otps", {
  // Cache key — could be "email:otp"
  id: varchar("id").primaryKey(),  

  // Metadata
  otpCode: varchar("otpCode").notNull(),
  type: varchar("type").notNull(), // e.g., "EMAIL_VERIFICATION"
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").notNull().default(false),
  email: varchar("email").notNull().default("blank"),

  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  });

  
  // Relations
  export const usersRelations = relations(users, ({ many }) => ({
    ads: many(ads),
    purchases: many(purchases),
    auditLogs: many(auditLogs),
  }));
  
  export const adsRelations = relations(ads, ({ one, many }) => ({
    user: one(users, {
      fields: [ads.userId],
      references: [users.id],
    }),
    approver: one(users, {
      fields: [ads.approvedBy],
      references: [users.id],
    }),
    purchases: many(purchases),
    impressionsEvents: many(impressionsEvents),
    clicksEvents: many(clicksEvents),
    aggregatedStats: many(aggregatedStats),
  }));
  
  export const purchasesRelations = relations(purchases, ({ one }) => ({
    user: one(users, {
      fields: [purchases.userId],
      references: [users.id],
    }),
    ad: one(ads, {
      fields: [purchases.adId],
      references: [ads.id],
    }),
  }));
  
  export const impressionsEventsRelations = relations(impressionsEvents, ({ one, many }) => ({
    ad: one(ads, {
      fields: [impressionsEvents.adId],
      references: [ads.id],
    }),
    clicksEvents: many(clicksEvents),
  }));
  
  export const clicksEventsRelations = relations(clicksEvents, ({ one }) => ({
    ad: one(ads, {
      fields: [clicksEvents.adId],
      references: [ads.id],
    }),
    impressionEvent: one(impressionsEvents, {
      fields: [clicksEvents.impressionEventId],
      references: [impressionsEvents.id],
    }),
  }));
  
  // Zod schemas
  export const insertUserSchema = createInsertSchema(users).omit({
    id: true,
    
    createdAt: true,
    updatedAt: true,
    freeViewsCredits: true,
    stripeCustomerId: true,
  });
  
  export const insertAdSchema = createInsertSchema(ads).omit({
    id: true,
    //userId: true,
    //status: true,
    publishToken: true,
    approvedBy: true,
    rejectionReason: true,
    createdAt: true,
    updatedAt: true,
  });
  
  export const insertPurchaseSchema = createInsertSchema(purchases).omit({
    id: true,
   //status: true,
    stripeSessionId: true,
    stripePaymentIntentId: true,
    createdAt: true,
    updatedAt: true,
  });
  
  export const insertImpressionEventSchema = createInsertSchema(impressionsEvents).omit({
    id: true,
    createdAt: true,
  });
  
  export const insertClickEventSchema = createInsertSchema(clicksEvents).omit({
    id: true,
    createdAt: true,
  });
  
  export const insertPaymentSchema = createInsertSchema(purchases).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  });
  
  // Additional validation schemas
  export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
  });
  
  export const signupSchema = insertUserSchema.extend({
    confirmPassword: z.string(),
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });
  
  export const createAdSchema = insertAdSchema.extend({
    targetAudience: z.string().min(1, "Target audience is required"),
    budgetType: z.enum(["impressions", "clicks"]),
  });
  
  export const purchaseCreditsSchema = z.object({
    amount: z.number().min(10, "Minimum purchase is $10"),
    impressions: z.number().min(1000, "Minimum 1000 impressions"),
  });
  
  export const adminActionSchema = z.object({
    action: z.enum(["approve", "reject", "publish"]),
    reason: z.string().optional(),
  });

  
  
  // Type exports
  export type User = typeof users.$inferSelect;
  export type CreateUser = z.infer<typeof insertUserSchema>;

  export type Ad = typeof ads.$inferSelect;
  export type InsertAd = z.infer<typeof insertAdSchema>;
  
  export type Purchase = typeof purchases.$inferSelect;
  export type InsertPurchase = z.infer<typeof insertPurchaseSchema>;
  export type ImpressionEvent = typeof impressionsEvents.$inferSelect;
  export type ClickEvent = typeof clicksEvents.$inferSelect;
  export type AggregatedStats = typeof aggregatedStats.$inferSelect;
  export type AuditLog = typeof auditLogs.$inferSelect;
  export type Payment = typeof purchases.$inferSelect;
  
  export type LoginData = z.infer<typeof loginSchema>;
  export type SignupData = z.infer<typeof signupSchema>;
  export type CreateAdData = z.infer<typeof createAdSchema>;
  export type PurchaseCreditsData = z.infer<typeof purchaseCreditsSchema>;
  export type AdminActionData = z.infer<typeof adminActionSchema>;
  export type InsertPayment = z.infer<typeof insertPaymentSchema>;
  
