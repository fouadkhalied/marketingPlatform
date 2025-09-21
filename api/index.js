"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc2) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc2 = __getOwnPropDesc(from, key)) || desc2.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/api/index.ts
var index_exports = {};
__export(index_exports, {
  default: () => index_default
});
module.exports = __toCommonJS(index_exports);
var import_express = __toESM(require("express"));

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
var import_dotenv = __toESM(require("dotenv"));
var import_serverless = require("@neondatabase/serverless");
var import_neon_serverless = require("drizzle-orm/neon-serverless");
var import_ws = __toESM(require("ws"));

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
var import_drizzle_orm = require("drizzle-orm");
var import_pg_core = require("drizzle-orm/pg-core");
var import_drizzle_orm2 = require("drizzle-orm");
var import_drizzle_zod = require("drizzle-zod");
var import_zod = require("zod");
var userRoleEnum = (0, import_pg_core.pgEnum)("user_role", ["advertiser", "marketing", "admin"]);
var users = (0, import_pg_core.pgTable)("users", {
  id: (0, import_pg_core.varchar)("id").primaryKey().default(import_drizzle_orm.sql`gen_random_uuid()`),
  username: (0, import_pg_core.text)("username").notNull().unique(),
  email: (0, import_pg_core.text)("email").notNull().unique(),
  password: (0, import_pg_core.text)("password").notNull(),
  role: userRoleEnum("role").notNull().default("advertiser"),
  freeViewsCredits: (0, import_pg_core.integer)("free_views_credits").notNull().default(1e4),
  stripeCustomerId: (0, import_pg_core.text)("stripe_customer_id"),
  createdAt: (0, import_pg_core.timestamp)("created_at").notNull().default(import_drizzle_orm.sql`now()`),
  updatedAt: (0, import_pg_core.timestamp)("updated_at").notNull().default(import_drizzle_orm.sql`now()`)
});
var ads = (0, import_pg_core.pgTable)("ads", {
  id: (0, import_pg_core.varchar)("id").primaryKey().default(import_drizzle_orm.sql`gen_random_uuid()`),
  userId: (0, import_pg_core.varchar)("user_id").notNull().references(() => users.id),
  titleEn: (0, import_pg_core.text)("title_en").notNull(),
  titleAr: (0, import_pg_core.text)("title_ar").notNull(),
  descriptionEn: (0, import_pg_core.text)("description_en").notNull(),
  descriptionAr: (0, import_pg_core.text)("description_ar").notNull(),
  targetUrl: (0, import_pg_core.text)("target_url").notNull(),
  imageUrl: (0, import_pg_core.text)("image_url"),
  //status: adStatusEnum("status").notNull().default("draft"),
  targetAudience: (0, import_pg_core.text)("target_audience"),
  budgetType: (0, import_pg_core.text)("budget_type"),
  // "impressions" or "clicks"
  publishToken: (0, import_pg_core.text)("publish_token"),
  approvedBy: (0, import_pg_core.varchar)("approved_by").references(() => users.id),
  rejectionReason: (0, import_pg_core.text)("rejection_reason"),
  createdAt: (0, import_pg_core.timestamp)("created_at").notNull().default(import_drizzle_orm.sql`now()`),
  updatedAt: (0, import_pg_core.timestamp)("updated_at").notNull().default(import_drizzle_orm.sql`now()`)
});
var purchases = (0, import_pg_core.pgTable)("purchases", {
  id: (0, import_pg_core.varchar)("id").primaryKey().default(import_drizzle_orm.sql`gen_random_uuid()`),
  userId: (0, import_pg_core.varchar)("user_id").notNull().references(() => users.id),
  adId: (0, import_pg_core.varchar)("ad_id").references(() => ads.id),
  amount: (0, import_pg_core.decimal)("amount", { precision: 10, scale: 2 }).notNull(),
  impressionsAllocated: (0, import_pg_core.integer)("impressions_allocated").notNull().default(0),
  //status: purchaseStatusEnum("status").notNull().default("pending"),
  stripeSessionId: (0, import_pg_core.text)("stripe_session_id"),
  stripePaymentIntentId: (0, import_pg_core.text)("stripe_payment_intent_id"),
  createdAt: (0, import_pg_core.timestamp)("created_at").notNull().default(import_drizzle_orm.sql`now()`),
  updatedAt: (0, import_pg_core.timestamp)("updated_at").notNull().default(import_drizzle_orm.sql`now()`)
});
var impressionsEvents = (0, import_pg_core.pgTable)("impressions_events", {
  id: (0, import_pg_core.varchar)("id").primaryKey().default(import_drizzle_orm.sql`gen_random_uuid()`),
  eventId: (0, import_pg_core.varchar)("event_id").notNull().unique(),
  adId: (0, import_pg_core.varchar)("ad_id").notNull().references(() => ads.id),
  source: (0, import_pg_core.text)("source").notNull().default("web"),
  viewerHash: (0, import_pg_core.text)("viewer_hash"),
  ipHash: (0, import_pg_core.text)("ip_hash"),
  userAgent: (0, import_pg_core.text)("user_agent"),
  fallbackHash: (0, import_pg_core.text)("fallback_hash"),
  metadata: (0, import_pg_core.jsonb)("metadata"),
  createdAt: (0, import_pg_core.timestamp)("created_at").notNull().default(import_drizzle_orm.sql`now()`)
});
var clicksEvents = (0, import_pg_core.pgTable)("clicks_events", {
  id: (0, import_pg_core.varchar)("id").primaryKey().default(import_drizzle_orm.sql`gen_random_uuid()`),
  eventId: (0, import_pg_core.varchar)("event_id").notNull(),
  adId: (0, import_pg_core.varchar)("ad_id").notNull().references(() => ads.id),
  impressionEventId: (0, import_pg_core.varchar)("impression_event_id").references(() => impressionsEvents.id),
  source: (0, import_pg_core.text)("source").notNull().default("web"),
  ipHash: (0, import_pg_core.text)("ip_hash"),
  userAgent: (0, import_pg_core.text)("user_agent"),
  metadata: (0, import_pg_core.jsonb)("metadata"),
  createdAt: (0, import_pg_core.timestamp)("created_at").notNull().default(import_drizzle_orm.sql`now()`)
});
var aggregatedStats = (0, import_pg_core.pgTable)("aggregated_stats", {
  id: (0, import_pg_core.varchar)("id").primaryKey().default(import_drizzle_orm.sql`gen_random_uuid()`),
  adId: (0, import_pg_core.varchar)("ad_id").notNull().references(() => ads.id),
  date: (0, import_pg_core.timestamp)("date").notNull(),
  impressions: (0, import_pg_core.integer)("impressions").notNull().default(0),
  clicks: (0, import_pg_core.integer)("clicks").notNull().default(0),
  ctr: (0, import_pg_core.decimal)("ctr", { precision: 5, scale: 4 }).notNull().default("0"),
  createdAt: (0, import_pg_core.timestamp)("created_at").notNull().default(import_drizzle_orm.sql`now()`),
  updatedAt: (0, import_pg_core.timestamp)("updated_at").notNull().default(import_drizzle_orm.sql`now()`)
});
var auditLogs = (0, import_pg_core.pgTable)("audit_logs", {
  id: (0, import_pg_core.varchar)("id").primaryKey().default(import_drizzle_orm.sql`gen_random_uuid()`),
  userId: (0, import_pg_core.varchar)("user_id").references(() => users.id),
  action: (0, import_pg_core.text)("action").notNull(),
  resourceType: (0, import_pg_core.text)("resource_type").notNull(),
  resourceId: (0, import_pg_core.varchar)("resource_id"),
  details: (0, import_pg_core.jsonb)("details"),
  ipAddress: (0, import_pg_core.text)("ip_address"),
  userAgent: (0, import_pg_core.text)("user_agent"),
  createdAt: (0, import_pg_core.timestamp)("created_at").notNull().default(import_drizzle_orm.sql`now()`)
});
var usersRelations = (0, import_drizzle_orm2.relations)(users, ({ many }) => ({
  ads: many(ads),
  purchases: many(purchases),
  auditLogs: many(auditLogs)
}));
var adsRelations = (0, import_drizzle_orm2.relations)(ads, ({ one, many }) => ({
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
var purchasesRelations = (0, import_drizzle_orm2.relations)(purchases, ({ one }) => ({
  user: one(users, {
    fields: [purchases.userId],
    references: [users.id]
  }),
  ad: one(ads, {
    fields: [purchases.adId],
    references: [ads.id]
  })
}));
var impressionsEventsRelations = (0, import_drizzle_orm2.relations)(impressionsEvents, ({ one, many }) => ({
  ad: one(ads, {
    fields: [impressionsEvents.adId],
    references: [ads.id]
  }),
  clicksEvents: many(clicksEvents)
}));
var clicksEventsRelations = (0, import_drizzle_orm2.relations)(clicksEvents, ({ one }) => ({
  ad: one(ads, {
    fields: [clicksEvents.adId],
    references: [ads.id]
  }),
  impressionEvent: one(impressionsEvents, {
    fields: [clicksEvents.impressionEventId],
    references: [impressionsEvents.id]
  })
}));
var insertUserSchema = (0, import_drizzle_zod.createInsertSchema)(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  freeViewsCredits: true,
  stripeCustomerId: true
});
var insertAdSchema = (0, import_drizzle_zod.createInsertSchema)(ads).omit({
  id: true,
  userId: true,
  //status: true,
  publishToken: true,
  approvedBy: true,
  rejectionReason: true,
  createdAt: true,
  updatedAt: true
});
var insertPurchaseSchema = (0, import_drizzle_zod.createInsertSchema)(purchases).omit({
  id: true,
  //status: true,
  stripeSessionId: true,
  stripePaymentIntentId: true,
  createdAt: true,
  updatedAt: true
});
var insertImpressionEventSchema = (0, import_drizzle_zod.createInsertSchema)(impressionsEvents).omit({
  id: true,
  createdAt: true
});
var insertClickEventSchema = (0, import_drizzle_zod.createInsertSchema)(clicksEvents).omit({
  id: true,
  createdAt: true
});
var loginSchema = import_zod.z.object({
  email: import_zod.z.string().email(),
  password: import_zod.z.string().min(8)
});
var signupSchema = insertUserSchema.extend({
  confirmPassword: import_zod.z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});
var createAdSchema = insertAdSchema.extend({
  targetAudience: import_zod.z.string().min(1, "Target audience is required"),
  budgetType: import_zod.z.enum(["impressions", "clicks"])
});
var purchaseCreditsSchema = import_zod.z.object({
  amount: import_zod.z.number().min(10, "Minimum purchase is $10"),
  impressions: import_zod.z.number().min(1e3, "Minimum 1000 impressions")
});
var adminActionSchema = import_zod.z.object({
  action: import_zod.z.enum(["approve", "reject", "publish"]),
  reason: import_zod.z.string().optional()
});

// src/infrastructure/db/connection.ts
import_dotenv.default.config();
import_serverless.neonConfig.webSocketConstructor = import_ws.default;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new import_serverless.Pool({ connectionString: process.env.DATABASE_URL });
var db = (0, import_neon_serverless.drizzle)({ client: pool, schema: schema_exports });

// src/modules/user/infrastructure/repositories/user.repository.impl.ts
var import_drizzle_orm3 = require("drizzle-orm");
var import_bcrypt = __toESM(require("bcrypt"));
var UserRepositoryImpl = class {
  async hashPassword(password) {
    return import_bcrypt.default.hash(password, 12);
  }
  async validateUser(email, password) {
    const user = await this.getUserByEmail(email);
    if (!user) return null;
    const isValid = await import_bcrypt.default.compare(password, user.password);
    return isValid ? user : null;
  }
  async getUser(id) {
    const [user] = await db.select().from(users).where((0, import_drizzle_orm3.eq)(users.id, id));
    return user;
  }
  async getUserByEmail(email) {
    const [user] = await db.select().from(users).where((0, import_drizzle_orm3.eq)(users.email, email));
    return user;
  }
  async getUserByUsername(username) {
    const [user] = await db.select().from(users).where((0, import_drizzle_orm3.eq)(users.username, username));
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
    const [user] = await db.update(users).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where((0, import_drizzle_orm3.eq)(users.id, id)).returning();
    return user;
  }
  async updateUserStripeInfo(id, customerId, subscriptionId) {
    const [user] = await db.update(users).set({
      stripeCustomerId: customerId,
      updatedAt: /* @__PURE__ */ new Date()
    }).where((0, import_drizzle_orm3.eq)(users.id, id)).returning();
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

// src/api/index.ts
var app = (0, import_express.default)();
app.use(import_express.default.json());
app.use(import_express.default.urlencoded({ extended: true }));
var userController = createUserController();
app.get("/", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
});
app.post("/api/auth/register", (req, res) => userController.createUser(req, res));
app.listen(4e3, () => console.log("Server running on http://localhost:4000"));
var index_default = app;
