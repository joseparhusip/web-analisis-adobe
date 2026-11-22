CREATE TABLE `workspaces` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
DROP INDEX `saved_keywords_keyword_unique`;--> statement-breakpoint
ALTER TABLE `saved_keywords` ADD `workspace_id` text DEFAULT 'default' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `saved_keywords_workspace_keyword_idx` ON `saved_keywords` (`workspace_id`,`keyword`);--> statement-breakpoint
DROP INDEX `adobe_observations_keyword_idx`;--> statement-breakpoint
ALTER TABLE `adobe_observations` ADD `workspace_id` text DEFAULT 'default' NOT NULL;--> statement-breakpoint
CREATE INDEX `adobe_observations_keyword_idx` ON `adobe_observations` (`workspace_id`,`keyword`,`asset_type`,`observed_at`);--> statement-breakpoint
INSERT OR IGNORE INTO `workspaces` (`id`, `name`, `created_at`) VALUES ('default', 'Workspace Utama', 0);--> statement-breakpoint
UPDATE `app_settings` SET `id` = 'default' WHERE `id` = 'app';
