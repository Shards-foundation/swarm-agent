ALTER TABLE `agents` MODIFY COLUMN `capabilities` json;--> statement-breakpoint
ALTER TABLE `tasks` MODIFY COLUMN `executionTime` bigint;