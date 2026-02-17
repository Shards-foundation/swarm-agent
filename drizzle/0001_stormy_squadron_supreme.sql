CREATE TABLE `agent_messages` (
	`id` varchar(36) NOT NULL,
	`senderId` varchar(36) NOT NULL,
	`recipientId` varchar(36),
	`taskId` varchar(36),
	`messageType` enum('request','response','status_update','error','broadcast') NOT NULL,
	`content` json,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	`deliveryStatus` enum('pending','delivered','acknowledged','failed') DEFAULT 'pending',
	`metadata` json,
	CONSTRAINT `agent_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `agent_metrics` (
	`id` varchar(36) NOT NULL,
	`agentId` varchar(36) NOT NULL,
	`taskId` varchar(36),
	`executionTime` bigint,
	`tokenUsage` int,
	`estimatedCost` float,
	`successFlag` boolean,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `agent_metrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `agents` (
	`id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` enum('reasoning','execution','coordination','analysis') NOT NULL,
	`description` text,
	`capabilities` json DEFAULT ('[]'),
	`status` enum('active','inactive','error','maintenance') DEFAULT 'active',
	`llmModel` varchar(255),
	`parameters` json,
	`integrationFramework` varchar(255),
	`version` varchar(64),
	`healthScore` float DEFAULT 100,
	`successRate` float DEFAULT 100,
	`totalExecutions` int DEFAULT 0,
	`failedExecutions` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `execution_logs` (
	`id` varchar(36) NOT NULL,
	`taskId` varchar(36) NOT NULL,
	`agentId` varchar(36) NOT NULL,
	`eventType` enum('execution','decision','error','metric','state_change') NOT NULL,
	`level` enum('debug','info','warning','error','critical') DEFAULT 'info',
	`message` text,
	`metadata` json,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	`storageUrl` varchar(512),
	CONSTRAINT `execution_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `integration_modules` (
	`id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`framework` varchar(255) NOT NULL,
	`version` varchar(64),
	`description` text,
	`capabilities` json,
	`configuration` json,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `integration_modules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `llm_providers` (
	`id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`provider` enum('openai','anthropic','ollama','custom') NOT NULL,
	`modelId` varchar(255) NOT NULL,
	`apiEndpoint` varchar(512),
	`configuration` json,
	`isDefault` boolean DEFAULT false,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `llm_providers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orchestration_configs` (
	`id` varchar(36) NOT NULL,
	`workflowId` varchar(36) NOT NULL,
	`hierarchyRules` json,
	`sequenceRules` json,
	`concurrencyRules` json,
	`roundRobinRules` json,
	`consensusStrategy` json,
	`timeoutPolicy` json,
	`resourceLimits` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orchestration_configs_id` PRIMARY KEY(`id`),
	CONSTRAINT `orchestration_configs_workflowId_unique` UNIQUE(`workflowId`)
);
--> statement-breakpoint
CREATE TABLE `system_alerts` (
	`id` varchar(36) NOT NULL,
	`alertType` enum('agent_failure','task_timeout','system_error','task_completion','performance_degradation') NOT NULL,
	`severity` enum('info','warning','critical') DEFAULT 'info',
	`title` varchar(255) NOT NULL,
	`message` text,
	`relatedAgentId` varchar(36),
	`relatedTaskId` varchar(36),
	`isResolved` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`resolvedAt` timestamp,
	CONSTRAINT `system_alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` varchar(36) NOT NULL,
	`workflowId` varchar(36) NOT NULL,
	`input` json,
	`assignedAgents` json,
	`status` enum('pending','running','completed','failed','timeout') DEFAULT 'pending',
	`priority` int DEFAULT 5,
	`result` json,
	`consensusResult` json,
	`consensusMethod` enum('voting','judge','mixture_of_agents','none') DEFAULT 'none',
	`executionTime` bigint DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`startedAt` timestamp,
	`completedAt` timestamp,
	`retryCount` int DEFAULT 0,
	`errorLog` text,
	`storageUrl` varchar(512),
	CONSTRAINT `tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workflow_templates` (
	`id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`category` enum('hierarchical','sequential','concurrent','round_robin','mesh','mixture_of_agents') NOT NULL,
	`templateData` json,
	`previewImage` varchar(512),
	`isPublic` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workflow_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workflows` (
	`id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`orchestrationPattern` enum('hierarchical','sequential','concurrent','round_robin','mesh') NOT NULL,
	`nodes` json,
	`edges` json,
	`configuration` json,
	`status` enum('draft','active','paused','archived') DEFAULT 'draft',
	`templateId` varchar(36),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workflows_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `messages_sender_idx` ON `agent_messages` (`senderId`);--> statement-breakpoint
CREATE INDEX `messages_recipient_idx` ON `agent_messages` (`recipientId`);--> statement-breakpoint
CREATE INDEX `messages_task_idx` ON `agent_messages` (`taskId`);--> statement-breakpoint
CREATE INDEX `messages_timestamp_idx` ON `agent_messages` (`timestamp`);--> statement-breakpoint
CREATE INDEX `metrics_agent_idx` ON `agent_metrics` (`agentId`);--> statement-breakpoint
CREATE INDEX `metrics_task_idx` ON `agent_metrics` (`taskId`);--> statement-breakpoint
CREATE INDEX `metrics_timestamp_idx` ON `agent_metrics` (`timestamp`);--> statement-breakpoint
CREATE INDEX `agents_status_idx` ON `agents` (`status`);--> statement-breakpoint
CREATE INDEX `agents_type_idx` ON `agents` (`type`);--> statement-breakpoint
CREATE INDEX `agents_framework_idx` ON `agents` (`integrationFramework`);--> statement-breakpoint
CREATE INDEX `logs_task_idx` ON `execution_logs` (`taskId`);--> statement-breakpoint
CREATE INDEX `logs_agent_idx` ON `execution_logs` (`agentId`);--> statement-breakpoint
CREATE INDEX `logs_timestamp_idx` ON `execution_logs` (`timestamp`);--> statement-breakpoint
CREATE INDEX `logs_level_idx` ON `execution_logs` (`level`);--> statement-breakpoint
CREATE INDEX `modules_framework_idx` ON `integration_modules` (`framework`);--> statement-breakpoint
CREATE INDEX `llm_provider_idx` ON `llm_providers` (`provider`);--> statement-breakpoint
CREATE INDEX `llm_model_idx` ON `llm_providers` (`modelId`);--> statement-breakpoint
CREATE INDEX `config_workflow_idx` ON `orchestration_configs` (`workflowId`);--> statement-breakpoint
CREATE INDEX `alerts_type_idx` ON `system_alerts` (`alertType`);--> statement-breakpoint
CREATE INDEX `alerts_severity_idx` ON `system_alerts` (`severity`);--> statement-breakpoint
CREATE INDEX `alerts_created_idx` ON `system_alerts` (`createdAt`);--> statement-breakpoint
CREATE INDEX `tasks_workflow_idx` ON `tasks` (`workflowId`);--> statement-breakpoint
CREATE INDEX `tasks_status_idx` ON `tasks` (`status`);--> statement-breakpoint
CREATE INDEX `tasks_created_idx` ON `tasks` (`createdAt`);--> statement-breakpoint
CREATE INDEX `templates_category_idx` ON `workflow_templates` (`category`);--> statement-breakpoint
CREATE INDEX `workflows_status_idx` ON `workflows` (`status`);--> statement-breakpoint
CREATE INDEX `workflows_pattern_idx` ON `workflows` (`orchestrationPattern`);