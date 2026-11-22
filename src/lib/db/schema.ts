import { index, integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const workspaces = sqliteTable("workspaces", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  position: integer("position").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const sourceCache = sqliteTable("source_cache", {
  key: text("key").primaryKey(),
  payload: text("payload", { mode: "json" }).notNull(),
  fetchedAt: integer("fetched_at", { mode: "timestamp_ms" }).notNull(),
});

export const adobeObservations = sqliteTable(
  "adobe_observations",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    workspaceId: text("workspace_id").notNull().default("default"),
    keyword: text("keyword").notNull(),
    assetType: text("asset_type", { enum: ["photo", "illustration", "vector", "video"] }).notNull(),
    sortOrder: text("sort_order").notNull(),
    total: integer("total").notNull(),
    samples: text("samples", { mode: "json" }).$type<AdobeSample[]>().notNull().default([]),
    source: text("source", { enum: ["extension", "manual"] }).notNull(),
    observedAt: integer("observed_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [index("adobe_observations_keyword_idx").on(table.workspaceId, table.keyword, table.assetType, table.observedAt)],
);

export const savedKeywords = sqliteTable(
  "saved_keywords",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    workspaceId: text("workspace_id").notNull().default("default"),
    keyword: text("keyword").notNull(),
    tags: text("tags", { mode: "json" }).$type<string[]>().notNull().default([]),
    bestAssetType: text("best_asset_type"),
    bestScore: real("best_score"),
    scores: text("scores", { mode: "json" }).$type<Record<string, number | null>>(),
    scoredAt: integer("scored_at", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [uniqueIndex("saved_keywords_workspace_keyword_idx").on(table.workspaceId, table.keyword)],
);

export const appSettings = sqliteTable("app_settings", {
  id: text("id").primaryKey(),
  value: text("value", { mode: "json" }).$type<Record<string, unknown>>().notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export interface AdobeSample {
  id: string;
  title: string;
  pageUrl: string;
  thumbnailUrl?: string;
}

export type Workspace = typeof workspaces.$inferSelect;
export type SavedKeyword = typeof savedKeywords.$inferSelect;
export type AdobeObservation = typeof adobeObservations.$inferSelect;
