CREATE TABLE `adobe_observations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`keyword` text NOT NULL,
	`asset_type` text NOT NULL,
	`sort_order` text NOT NULL,
	`total` integer NOT NULL,
	`samples` text DEFAULT '[]' NOT NULL,
	`source` text NOT NULL,
	`observed_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `adobe_observations_keyword_idx` ON `adobe_observations` (`keyword`,`asset_type`,`observed_at`);--> statement-breakpoint
CREATE TABLE `saved_keywords` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`keyword` text NOT NULL,
	`tags` text DEFAULT '[]' NOT NULL,
	`best_asset_type` text,
	`best_score` real,
	`scores` text,
	`scored_at` integer,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `saved_keywords_keyword_unique` ON `saved_keywords` (`keyword`);--> statement-breakpoint
CREATE TABLE `source_cache` (
	`key` text PRIMARY KEY NOT NULL,
	`payload` text NOT NULL,
	`fetched_at` integer NOT NULL
);
