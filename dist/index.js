var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// api/index.ts
import express from "express";

// src/modules/user/application/services/user-app.service.ts
var UserAppService = class {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }
  // Create a new user
  async createUser(input) {
    const existingUser = await this.userRepository.getUserByEmail(input.email);
    if (existingUser) {
      throw new Error("Email already exists");
    }
    const newUser = await this.userRepository.createUser(input);
    return newUser;
  }
  // Get user by ID
  async getUser(id) {
    return this.userRepository.getUser(id);
  }
  // Get user by email
  async getUserByEmail(email) {
    return this.userRepository.getUserByEmail(email);
  }
  // Get user by username
  async getUserByUsername(username) {
    return this.userRepository.getUserByUsername(username);
  }
  // Update user
  //   async updateUser(id: string, updates: UpdateUserDto): Promise<User> {
  //     return this.userRepository.updateUser(id, updates);
  //   }
  // Update Stripe info
  async updateUserStripeInfo(id, customerId, subscriptionId) {
    return this.userRepository.updateUserStripeInfo(id, customerId, subscriptionId);
  }
};

// src/infrastructure/db/connection.ts
import dotenv from "dotenv";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";

// src/infrastructure/shared/schema/schema.ts
var schema_exports = {};
__export(schema_exports, {
  adminActionSchema: () => adminActionSchema,
  ads: () => ads,
  adsRelations: () => adsRelations,
  aggregatedStats: () => aggregatedStats,
  auditLogs: () => auditLogs,
  clicksEvents: () => clicksEvents,
  clicksEventsRelations: () => clicksEventsRelations,
  createAdSchema: () => createAdSchema,
  impressionsEvents: () => impressionsEvents,
  impressionsEventsRelations: () => impressionsEventsRelations,
  insertAdSchema: () => insertAdSchema,
  insertClickEventSchema: () => insertClickEventSchema,
  insertImpressionEventSchema: () => insertImpressionEventSchema,
  insertPurchaseSchema: () => insertPurchaseSchema,
  insertUserSchema: () => insertUserSchema,
  loginSchema: () => loginSchema,
  purchaseCreditsSchema: () => purchaseCreditsSchema,
  purchases: () => purchases,
  purchasesRelations: () => purchasesRelations,
  signupSchema: () => signupSchema,
  userRoleEnum: () => userRoleEnum,
  users: () => users,
  usersRelations: () => usersRelations
});
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, jsonb, decimal, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var userRoleEnum = pgEnum("user_role", ["advertiser", "marketing", "admin"]);
var users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: userRoleEnum("role").notNull().default("advertiser"),
  freeViewsCredits: integer("free_views_credits").notNull().default(1e4),
  stripeCustomerId: text("stripe_customer_id"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`)
});
var ads = pgTable("ads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  titleEn: text("title_en").notNull(),
  titleAr: text("title_ar").notNull(),
  descriptionEn: text("description_en").notNull(),
  descriptionAr: text("description_ar").notNull(),
  targetUrl: text("target_url").notNull(),
  imageUrl: text("image_url"),
  //status: adStatusEnum("status").notNull().default("draft"),
  targetAudience: text("target_audience"),
  budgetType: text("budget_type"),
  // "impressions" or "clicks"
  publishToken: text("publish_token"),
  approvedBy: varchar("approved_by").references(() => users.id),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`)
});
var purchases = pgTable("purchases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  adId: varchar("ad_id").references(() => ads.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  impressionsAllocated: integer("impressions_allocated").notNull().default(0),
  //status: purchaseStatusEnum("status").notNull().default("pending"),
  stripeSessionId: text("stripe_session_id"),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`)
});
var impressionsEvents = pgTable("impressions_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().unique(),
  adId: varchar("ad_id").notNull().references(() => ads.id),
  source: text("source").notNull().default("web"),
  viewerHash: text("viewer_hash"),
  ipHash: text("ip_hash"),
  userAgent: text("user_agent"),
  fallbackHash: text("fallback_hash"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`)
});
var clicksEvents = pgTable("clicks_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull(),
  adId: varchar("ad_id").notNull().references(() => ads.id),
  impressionEventId: varchar("impression_event_id").references(() => impressionsEvents.id),
  source: text("source").notNull().default("web"),
  ipHash: text("ip_hash"),
  userAgent: text("user_agent"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`)
});
var aggregatedStats = pgTable("aggregated_stats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  adId: varchar("ad_id").notNull().references(() => ads.id),
  date: timestamp("date").notNull(),
  impressions: integer("impressions").notNull().default(0),
  clicks: integer("clicks").notNull().default(0),
  ctr: decimal("ctr", { precision: 5, scale: 4 }).notNull().default("0"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`)
});
var auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  action: text("action").notNull(),
  resourceType: text("resource_type").notNull(),
  resourceId: varchar("resource_id"),
  details: jsonb("details"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`)
});
var usersRelations = relations(users, ({ many }) => ({
  ads: many(ads),
  purchases: many(purchases),
  auditLogs: many(auditLogs)
}));
var adsRelations = relations(ads, ({ one, many }) => ({
  user: one(users, {
    fields: [ads.userId],
    references: [users.id]
  }),
  approver: one(users, {
    fields: [ads.approvedBy],
    references: [users.id]
  }),
  purchases: many(purchases),
  impressionsEvents: many(impressionsEvents),
  clicksEvents: many(clicksEvents),
  aggregatedStats: many(aggregatedStats)
}));
var purchasesRelations = relations(purchases, ({ one }) => ({
  user: one(users, {
    fields: [purchases.userId],
    references: [users.id]
  }),
  ad: one(ads, {
    fields: [purchases.adId],
    references: [ads.id]
  })
}));
var impressionsEventsRelations = relations(impressionsEvents, ({ one, many }) => ({
  ad: one(ads, {
    fields: [impressionsEvents.adId],
    references: [ads.id]
  }),
  clicksEvents: many(clicksEvents)
}));
var clicksEventsRelations = relations(clicksEvents, ({ one }) => ({
  ad: one(ads, {
    fields: [clicksEvents.adId],
    references: [ads.id]
  }),
  impressionEvent: one(impressionsEvents, {
    fields: [clicksEvents.impressionEventId],
    references: [impressionsEvents.id]
  })
}));
var insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  freeViewsCredits: true,
  stripeCustomerId: true
});
var insertAdSchema = createInsertSchema(ads).omit({
  id: true,
  userId: true,
  //status: true,
  publishToken: true,
  approvedBy: true,
  rejectionReason: true,
  createdAt: true,
  updatedAt: true
});
var insertPurchaseSchema = createInsertSchema(purchases).omit({
  id: true,
  //status: true,
  stripeSessionId: true,
  stripePaymentIntentId: true,
  createdAt: true,
  updatedAt: true
});
var insertImpressionEventSchema = createInsertSchema(impressionsEvents).omit({
  id: true,
  createdAt: true
});
var insertClickEventSchema = createInsertSchema(clicksEvents).omit({
  id: true,
  createdAt: true
});
var loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});
var signupSchema = insertUserSchema.extend({
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});
var createAdSchema = insertAdSchema.extend({
  targetAudience: z.string().min(1, "Target audience is required"),
  budgetType: z.enum(["impressions", "clicks"])
});
var purchaseCreditsSchema = z.object({
  amount: z.number().min(10, "Minimum purchase is $10"),
  impressions: z.number().min(1e3, "Minimum 1000 impressions")
});
var adminActionSchema = z.object({
  action: z.enum(["approve", "reject", "publish"]),
  reason: z.string().optional()
});

// src/infrastructure/db/connection.ts
dotenv.config();
neonConfig.webSocketConstructor = ws;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle({ client: pool, schema: schema_exports });

// src/modules/user/infrastructure/repositories/user.repository.impl.ts
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
var UserRepositoryImpl = class {
  async hashPassword(password) {
    return bcrypt.hash(password, 12);
  }
  async validateUser(email, password) {
    const user = await this.getUserByEmail(email);
    if (!user) return null;
    const isValid = await bcrypt.compare(password, user.password);
    return isValid ? user : null;
  }
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  async getUserByEmail(email) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }
  async getUserByUsername(username) {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  async createUser(insertUser) {
    const hashedPassword = await this.hashPassword(insertUser.password);
    const [user] = await db.insert(users).values({
      ...insertUser,
      password: hashedPassword
    }).returning();
    return user;
  }
  async updateUser(id, updates) {
    const [user] = await db.update(users).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(users.id, id)).returning();
    return user;
  }
  async updateUserStripeInfo(id, customerId, subscriptionId) {
    const [user] = await db.update(users).set({
      stripeCustomerId: customerId,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(users.id, id)).returning();
    return user;
  }
};

// src/modules/user/interfaces/controllers/user.controller.ts
var UserController = class {
  constructor(userService) {
    this.userService = userService;
  }
  // Create a new user
  async createUser(req, res) {
    try {
      const newUser = await this.userService.createUser(req.body);
      return res.status(201).json({
        success: true,
        data: newUser,
        message: "User created successfully"
      });
    } catch (err) {
      console.error("Error creating user:", err);
      return res.status(400).json({
        success: false,
        error: err.message || "Failed to create user"
      });
    }
  }
  // Get user by ID
  async getUser(req, res) {
    try {
      const user = await this.userService.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: "User not found"
        });
      }
      return res.status(200).json({
        success: true,
        data: user
      });
    } catch (err) {
      console.error("Error fetching user:", err);
      return res.status(500).json({
        success: false,
        error: "Internal server error"
      });
    }
  }
  // Get user by email
  async getUserByEmail(req, res) {
    try {
      const { email } = req.query;
      if (!email) {
        return res.status(400).json({
          success: false,
          error: "Email parameter is required"
        });
      }
      const user = await this.userService.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: "User not found"
        });
      }
      return res.status(200).json({
        success: true,
        data: user
      });
    } catch (err) {
      console.error("Error fetching user by email:", err);
      return res.status(500).json({
        success: false,
        error: "Internal server error"
      });
    }
  }
  // Get user by username
  async getUserByUsername(req, res) {
    try {
      const { username } = req.query;
      if (!username) {
        return res.status(400).json({
          success: false,
          error: "Username parameter is required"
        });
      }
      const user = await this.userService.getUserByUsername(username);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: "User not found"
        });
      }
      return res.status(200).json({
        success: true,
        data: user
      });
    } catch (err) {
      console.error("Error fetching user by username:", err);
      return res.status(500).json({
        success: false,
        error: "Internal server error"
      });
    }
  }
  // Update Stripe info
  async updateUserStripeInfo(req, res) {
    try {
      const { id } = req.params;
      const { customerId, subscriptionId } = req.body;
      if (!customerId) {
        return res.status(400).json({
          success: false,
          error: "Customer ID is required"
        });
      }
      const updatedUser = await this.userService.updateUserStripeInfo(
        id,
        customerId,
        subscriptionId
      );
      return res.status(200).json({
        success: true,
        data: updatedUser,
        message: "Stripe information updated successfully"
      });
    } catch (err) {
      console.error("Error updating Stripe info:", err);
      return res.status(500).json({
        success: false,
        error: "Failed to update Stripe information"
      });
    }
  }
};

// src/modules/user/interfaces/factories/user.factories.ts
function createUserController() {
  const userRepository = new UserRepositoryImpl();
  const userService = new UserAppService(userRepository);
  const userController2 = new UserController(userService);
  return userController2;
}

// api/index.ts
var app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
var userController = createUserController();
app.get("/", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
});
app.post("/api/auth/register", (req, res) => userController.createUser(req, res));
app.listen(4e3, () => console.log("Server running on http://localhost:4000"));
var index_default = app;
export {
  index_default as default
};
