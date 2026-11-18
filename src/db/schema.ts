import {
  bigint,
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

const now = (name: string) => timestamp(name, { withTimezone: true }).notNull().defaultNow();

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
  role: text("role").notNull().default("user"),
  banned: boolean("banned").notNull().default(false),
  banReason: text("banReason"),
  banExpires: timestamp("banExpires", { withTimezone: true }),
  twoFactorEnabled: boolean("twoFactorEnabled").notNull().default(false),
  createdAt: now("createdAt"),
  updatedAt: now("updatedAt"),
}, (table) => [uniqueIndex("one_portfolio_admin").on(table.role).where(sql`${table.role} = 'admin'`)]);

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt", { withTimezone: true }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: now("createdAt"),
  updatedAt: now("updatedAt"),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
  impersonatedBy: text("impersonatedBy"),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt", { withTimezone: true }),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt", { withTimezone: true }),
  scope: text("scope"),
  password: text("password"),
  createdAt: now("createdAt"),
  updatedAt: now("updatedAt"),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt", { withTimezone: true }).notNull(),
  createdAt: now("createdAt"),
  updatedAt: now("updatedAt"),
});

export const rateLimit = pgTable("rateLimit", {
  id: text("id").primaryKey(),
  key: text("key").notNull(),
  count: integer("count").notNull(),
  lastRequest: bigint("lastRequest", { mode: "number" }).notNull(),
});

export const twoFactor = pgTable("twoFactor", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }).unique(),
  secret: text("secret").notNull(),
  backupCodes: text("backupCodes").notNull(),
  verified: boolean("verified").notNull().default(false),
  failedVerificationCount: integer("failedVerificationCount").notNull().default(0),
  lockedUntil: timestamp("lockedUntil", { withTimezone: true }),
});

export const posts = pgTable("posts", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  bodyMarkdown: text("bodyMarkdown").notNull(),
  status: text("status", { enum: ["draft", "published"] }).notNull().default("draft"),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  readTime: text("readTime"),
  coverImage: text("coverImage"),
  coverImageAlt: text("coverImageAlt"),
  seoTitle: text("seoTitle"),
  seoDescription: text("seoDescription"),
  canonicalUrl: text("canonicalUrl"),
  socialImage: text("socialImage"),
  publishedAt: timestamp("publishedAt", { withTimezone: true }),
  authorId: text("authorId").notNull().references(() => user.id, { onDelete: "restrict" }),
  createdAt: now("createdAt"),
  updatedAt: now("updatedAt"),
});

export const feedback = pgTable("feedback", {
  id: text("id").primaryKey(),
  message: text("message").notNull(),
  category: text("category", { enum: ["general", "bug", "accessibility", "content"] }).notNull().default("general"),
  status: text("status", { enum: ["new", "reviewed", "archived"] }).notNull().default("new"),
  createdAt: now("createdAt"),
});

export const feedbackRateLimits = pgTable("feedback_rate_limits", {
  keyHash: text("key_hash").primaryKey(),
  windowStartedAt: timestamp("window_started_at", { withTimezone: true }).notNull(),
  count: integer("count").notNull(),
});

export const bootstrapAttempts = pgTable("bootstrap_attempts", {
  keyHash: text("key_hash").primaryKey(),
  windowStartedAt: timestamp("window_started_at", { withTimezone: true }).notNull(),
  count: integer("count").notNull(),
});

export const bootstrapClaim = pgTable("bootstrap_claim", {
  id: text("id").primaryKey(),
  createdAt: now("created_at"),
});

export const auditEvents = pgTable("audit_events", {
  id: text("id").primaryKey(),
  actorId: text("actor_id").notNull().references(() => user.id, { onDelete: "restrict" }),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  metadata: jsonb("metadata").$type<Record<string, string | null>>().notNull().default({}),
  createdAt: now("created_at"),
});

export const resources = pgTable("resources", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  author: text("author"),
  category: text("category", { enum: ["learning", "tools", "reading", "media"] }).notNull(),
  url: text("url").notNull(),
  coverImage: text("coverImage"),
  coverImageAlt: text("coverImageAlt"),
  status: text("status", { enum: ["draft", "published"] }).notNull().default("draft"),
  seoTitle: text("seoTitle"),
  seoDescription: text("seoDescription"),
  authorId: text("authorId").notNull().references(() => user.id, { onDelete: "restrict" }),
  createdAt: now("createdAt"),
  updatedAt: now("updatedAt"),
});
