import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(), // Clerk user ID
  email: text("email"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const bandi = pgTable("bandi", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const documents = pgTable("documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  bandoId: uuid("bando_id")
    .notNull()
    .references(() => bandi.id, { onDelete: "cascade" }),
  fileName: text("file_name").notNull(),
  mimeType: text("mime_type"),
  content: text("content").notNull(),
  sourceType: text("source_type").notNull(), // 'file' | 'url' | 'paste'
  sourceUrl: text("source_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const analyses = pgTable("analyses", {
  id: uuid("id").defaultRandom().primaryKey(),
  bandoId: uuid("bando_id")
    .notNull()
    .references(() => bandi.id, { onDelete: "cascade" }),
  documentId: uuid("document_id").references(() => documents.id, {
    onDelete: "set null",
  }),
  title: text("title"),
  summary: text("summary").notNull(),
  requirements: text("requirements"),
  deadlines: text("deadlines"),
  criteria: text("criteria"),
  insights: text("insights"),
  suggestions: text("suggestions"),
  rawContent: text("raw_content"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const chatMessages = pgTable("chat_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  bandoId: uuid("bando_id")
    .notNull()
    .references(() => bandi.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // 'user' | 'assistant'
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  stripePriceId: text("stripe_price_id"),
  status: text("status").notNull(), // active | canceled | past_due | trialing
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const usage = pgTable("usage", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  month: text("month").notNull(), // YYYY-MM
  analysisCount: integer("analysis_count").default(0).notNull(),
  messageCount: integer("message_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const rateLimits = pgTable("rate_limits", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  slug: text("slug").notNull(), // e.g. "chat_minute"
  windowKey: text("window_key").notNull(), // e.g. "2025-03-09-12-45"
  count: integer("count").default(0).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const feedback = pgTable("feedback", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type Bando = typeof bandi.$inferSelect;
export type Document = typeof documents.$inferSelect;
export type Analysis = typeof analyses.$inferSelect;
export type ChatMessageRow = typeof chatMessages.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type Usage = typeof usage.$inferSelect;
export type Feedback = typeof feedback.$inferSelect;
export type RateLimit = typeof rateLimits.$inferSelect;
