import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, jsonb, decimal, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { number, z } from "zod";

export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);
export const adStatusEnum = pgEnum("ad_status", ["pending", "approved", "rejected"]);
export const purchaseStatusEnum = pgEnum("purchase_status", ["pending", "completed", "failed", "refunded"]);
export const pagesTypeEnum = pgEnum("page_type", ["facebook", "instagram", "snapchat"]);
export const oauthEnum = pgEnum("oauth_provider", ["normal", "google", "facebook"]);
export const currencyEnum = pgEnum("currency_enum", ["usd", "sar"]);
export const middleEastCountries = pgEnum("middleEastCountries", [
  "riyadh",
  "jeddah",
  "mecca",
  "medina",
  "dammam",
  "khobar",
  "dhahran",
  "jubail",
  "tabuk",
  "abha",
  "khamis-mushait",
  "taif",
  "qassim",
  "buraydah",
  "hail",
  "najran",
  "jazan",
  "yanbu",
  "al-kharj",
  "hafr-al-batin",
  "al-baha",
  "ar-ar",
  "sakaka",
  "al-majmaah",
  "al-qatif",
  "al-zulfi"
]);


export const ksaCitiesEnum = pgEnum("ksa_cities", [
 "riyadh",
  "jeddah",
  "mecca",
  "medina",
  "dammam",
  "khobar",
  "dhahran",
  "jubail",
  "tabuk",
  "abha",
  "khamis-mushait",
  "taif",
  "qassim",
  "buraydah",
  "hail",
  "najran",
  "jazan",
  "yanbu",
  "al-kharj",
  "hafr-al-batin",
  "al-baha",
  "ar-ar",
  "sakaka",
  "al-majmaah",
  "al-qatif",
  "al-zulfi"
]);

export const pixelPlatformEnum = pgEnum("pixel_platform", [
  "facebook",
  "instagram",
  "tiktok",
  "snapchat",
  "google_ads",
  "pinterest",
  "linkedin",
  "twitter",
  "reddit",
  "quora",
  "bing",
  "youtube",
  "shopify",
]);

export const targetAudienceEnum = pgEnum("target_audience", [
  "cars",
  "realestate",
  "devices",
  "animals",
  "furniture",
  "jobs",
  "services",
  "fashion",
  "games",
  "rarities",
  "art",
  "trips",
  "food",
  "gardens",
  "occasions",
  "tourism",
  "lost",
  "coach",
  "code",
  "fund",
  "sports",
  "more"
]);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username"),
  email: text("email").notNull().unique(),
  password: text("password"), // nullable now
  firstName: text("fisrt_name"),
  lastName:text("last_name"),
  phoneNumber:text("phone_number"),
  googleId: text("google_id"),
  facebookId: text("facebook_id"),
  oauth: oauthEnum("oauth").notNull().default("normal"), // <--- new
  role: userRoleEnum("role").notNull().default("user"),
  verified: boolean("verified").notNull().default(false),
  freeViewsCredits: integer("free_views_credits").notNull().default(0),
  adsCount: integer("adsCount").default(0),
  totalSpend: integer("totalSpend").default(0),
  balance: integer("balance").default(0),
  stripeCustomerId: text("stripe_customer_id"),
  country: middleEastCountries("country"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const freeCredits = pgTable("free_credits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  credits: integer("credits").notNull().default(0),
})

  export const ads = pgTable("ads", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
    postIdOnPlatform: varchar("post_id_on_platform").unique(),
    pageId: varchar("page_id").references(() => socialMediaPages.pageId),
    titleEn: text("title_en").notNull(),
    titleAr: text("title_ar").notNull(),
    descriptionEn: text("description_en").notNull(),
    descriptionAr: text("description_ar").notNull(),

    websiteUrl: text("target_url").notNull(),
    websiteClicks: integer().notNull().default(0),
    
    imageUrl: text("image_url").array().notNull().default([]),
    phoneNumber:text("phone_number").notNull().default(""),

    status: adStatusEnum("status").notNull().default("pending"),
    targetAudience: targetAudienceEnum("target_audience"),
    budgetType: text("budget_type").notNull(), // "impressions" or "clicks"
    impressionsCredit: integer().notNull().default(0), 
    spended: integer("budget_credit").notNull().default(0),
    publishToken: text("publish_token"),
    approvedBy: varchar("approved_by").references(() => users.id),
    rejectionReason: text("rejection_reason"),
    createdAt: timestamp("created_at").notNull().default(sql`now()`),
    updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
    likesCount:integer().notNull().default(0),
    active:boolean().notNull().default(false),
    hasPromoted:boolean().notNull().default(false),
    
    userActivation:boolean().notNull().default(true),
    
    totalImpressionsOnAdd:integer().notNull().default(0),

    targetCities: ksaCitiesEnum("target_cities").array().notNull(), 

    tiktokLink: text("tiktok_link"),
    youtubeLink: text("youtube_link"),
    youtubeVideo: text("youtube_video"),
    googleAdsLink: text("google_ads_link"),
    instagramLink: text("instagram_link"),
    facebookLink: text("facebook_link"),
    snapchatLink: text("snapchat_link"),
  });

  export const adsReport = pgTable("ads_report", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    adId: varchar("ad_id").notNull().references(() => ads.id , { onDelete: 'cascade' }),
    email: text("email").notNull().default(""),
    username: text("username").notNull().default(""),
    phoneNumber: text("phone_number").notNull().default(""),
    reportDescription: text("report_description").notNull(),
    createdAt: timestamp("created_at").notNull().default(sql`now()`),
    updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
  });

  export const adminImpressionRatio = pgTable("admin_impression_ratio", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Currency code (USD, EUR, EGP, etc.)
  currency: currencyEnum("currency")
    .notNull(),
  
  promoted: boolean("promoted").notNull().default(false),  

  impressionsPerUnit: integer("impressions_per_unit")
    .notNull(),
  
    // Track who made the change
  updatedBy: varchar("updated_by").references(() => users.id),
  
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
  
  });

  export const socialMediaPages = pgTable("social_media_pages", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id").notNull().references(() => users.id , { onDelete: 'cascade' }),
    pageType: pagesTypeEnum("pageType").notNull(),
    pageId: text("page_id").notNull().unique(),
    pageName: text("page_name").notNull(),
    pageAccessToken: text("page_access_token").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    connectedAt: timestamp("connected_at").notNull().default(sql`now()`),
    updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
  });
  
  export const purchases = pgTable("purchases", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    //impressionsAllocated: integer("impressions_allocated").notNull().default(0),
    status: purchaseStatusEnum("status").notNull().default("pending"),
    currency: text("currency").notNull(),
    method: text("method").notNull(),
    stripeSessionId: text("stripe_session_id"),
    stripePaymentIntentId: text("stripe_payment_intent_id"),
    createdAt: timestamp("created_at").notNull().default(sql`now()`),
    updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
  });


  export const seoVariables = pgTable("seo_variables", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    title: text("title").notNull(),
    description: text("description").notNull(),
    tag_line: text("tag_line").notNull()
  });
  
  export const impressionsEvents = pgTable("impressions_events", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    eventId: varchar("event_id").notNull().unique(),
    adId: varchar("ad_id").notNull().references(() => ads.id , { onDelete: 'cascade' }),
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
    //eventId: varchar("event_id").notNull(),
    adId: varchar("ad_id").notNull().references(() => ads.id , { onDelete: 'cascade' }),
    //userId: varchar("user_id").notNull().references(() => users.id),
    //impressionEventId: varchar("impression_event_id").references(() => impressionsEvents.id),
    source: text("source").notNull().default("web"),
    // ipHash: text("ip_hash"),
    // userAgent: text("user_agent"),
    // metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").notNull().default(sql`now()`),
  });
  
  export const aggregatedStats = pgTable("aggregated_stats", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    adId: varchar("ad_id").notNull().references(() => ads.id , { onDelete: 'cascade' }),
    date: timestamp("date").notNull(),
    impressions: integer("impressions").notNull().default(0),
    clicks: integer("clicks").notNull().default(0),
    ctr: decimal("ctr", { precision: 5, scale: 4 }).notNull().default("0"),
    createdAt: timestamp("created_at").notNull().default(sql`now()`),
    updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
  });
  
  export const auditLogs = pgTable("audit_logs", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id").references(() => users.id , { onDelete: 'cascade' }),
    action: text("action").notNull(),
    resourceType: text("resource_type").notNull(),
    resourceId: varchar("resource_id"),
    details: jsonb("details"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").notNull().default(sql`now()`),
  });

  export const adUserEngagement = pgTable("ad_user_engagement", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    adId: varchar("ad_id").notNull().references(() => ads.id , { onDelete: 'cascade' }),
    userId: varchar("user_id").notNull().references(() => users.id),
  
    liked: boolean("liked").notNull().default(false),
    commented: boolean("commented").notNull().default(false),
    shared: boolean("shared").notNull().default(false),
    reactions: jsonb("reactions"), // e.g., store emojis {"love": true, "wow": true}
  
    createdAt: timestamp("created_at").notNull().default(sql`now()`),
    updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
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

  export const pixels = pgTable('pixels', {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    name: varchar("name").notNull(),
    pixelId: varchar("pixel_id").notNull(),
    platform: pixelPlatformEnum("platform").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  });
  
  // Relations
  export const usersRelations = relations(users, ({ many }) => ({
    ads: many(ads),
    purchases: many(purchases),
    auditLogs: many(auditLogs),
    adminImpressionRatio: many(adminImpressionRatio)
  }));
  
  export const adsRelations = relations(ads, ({ one, many }) => ({
    user: one(users, {
      fields: [ads.userId],
      references: [users.id],
    }),
    page: one(socialMediaPages, {
      fields: [ads.pageId],
      references: [socialMediaPages.pageId],
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

  export const socialMediaPagesRelations = relations(socialMediaPages, ({ one, many }) => ({
    user: one(users, {
      fields: [socialMediaPages.userId],
      references: [users.id],
    }),
    ads: many(ads), // This allows you to query all ads for a specific page
  }));
  
  export const purchasesRelations = relations(purchases, ({ one }) => ({
    user: one(users, {
      fields: [purchases.userId],
      references: [users.id],
    })
  }));
  
  export const impressionsEventsRelations = relations(impressionsEvents, ({ one, many }) => ({
    ad: one(ads, {
      fields: [impressionsEvents.adId],
      references: [ads.id],
    }),
    clicksEvents: many(clicksEvents),
  }));
  
  // export const clicksEventsRelations = relations(clicksEvents, ({ one }) => ({
  //   ad: one(ads, {
  //     fields: [clicksEvents.adId],
  //     references: [ads.id],
  //   }),
  //   impressionEvent: one(impressionsEvents, {
  //     fields: [clicksEvents.impressionEventId],
  //     references: [impressionsEvents.id],
  //   }),
  // }));
  
  // Zod schemas
  export const insertUserSchema = createInsertSchema(users).omit({
    id: true,
    
    createdAt: true,
    updatedAt: true,
    freeViewsCredits: true,
    stripeCustomerId: true,
  });

  export const insertGoogleUserSchema = createInsertSchema(users).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    freeViewsCredits: true,
    stripeCustomerId: true,
    password: true,       
    facebookId: true,    
  })

  export const insertFacebookUserSchema = createInsertSchema(users).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    freeViewsCredits: true,
    stripeCustomerId: true,
    password: true,       
    googleId: true,    
  })
  
  export const insertAdSchema = createInsertSchema(ads).omit({
    id: true,
    //userId: true,
    //status: true,
    // postIdOnPlatform: true,
    // pageId: true,
    imageUrl: true,
    publishToken: true,
    approvedBy: true,
    rejectionReason: true,
    createdAt: true,
    updatedAt: true,
  });
  
  export const insertPurchaseSchema = createInsertSchema(purchases).omit({
    id: true,
   //status: true,
    // stripeSessionId: true,
    // stripePaymentIntentId: true,
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
    postIdOnPlatform: z.string().optional(),
    pageId: z.string().optional(),
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
  export type CreateGoogleUser = z.infer<typeof insertGoogleUserSchema>;
  export type CreateFacebookUser = z.infer<typeof insertFacebookUserSchema>
  export type SeoVariable = typeof seoVariables.$inferSelect;
   
  export type Ad = typeof ads.$inferSelect;
  export type InsertAd = z.infer<typeof insertAdSchema>;
  export type CreateSeoVariable = typeof seoVariables.$inferInsert;
  export type Purchase = typeof purchases.$inferSelect;
  export type InsertPurchase = z.infer<typeof insertPurchaseSchema>;
  export type ImpressionEvent = typeof impressionsEvents.$inferSelect;
  export type ClickEvent = typeof clicksEvents.$inferSelect;
  export type AggregatedStats = typeof aggregatedStats.$inferSelect;
  export type AuditLog = typeof auditLogs.$inferSelect;
  export type Payment = typeof purchases.$inferSelect;
  export type AdUserEngagement = typeof adUserEngagement.$inferSelect;
  export type AdminImpressionRatio = typeof adminImpressionRatio.$inferSelect;
  
  export type LoginData = z.infer<typeof loginSchema>;
  export type SignupData = z.infer<typeof signupSchema>;
  export type CreateAdData = z.infer<typeof createAdSchema>;
  export type PurchaseCreditsData = z.infer<typeof purchaseCreditsSchema>;
  export type AdminActionData = z.infer<typeof adminActionSchema>;
  export type InsertPayment = z.infer<typeof insertPaymentSchema>;