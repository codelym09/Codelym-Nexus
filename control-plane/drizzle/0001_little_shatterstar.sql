CREATE TABLE `raw_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`content` text NOT NULL,
	`source` varchar(255) NOT NULL,
	`file_name` varchar(255),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `raw_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workflow_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workflow_id` int NOT NULL,
	`action` varchar(255) NOT NULL,
	`previous_state` text,
	`new_state` text,
	`changed_by` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `workflow_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workflow_steps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workflow_id` int NOT NULL,
	`step_number` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`action` varchar(255) NOT NULL,
	`parameters` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `workflow_steps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workflows` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`status` enum('pendiente','aprobado','ejecutando','completado','fallido') NOT NULL DEFAULT 'pendiente',
	`graph_json` text NOT NULL,
	`source_log_id` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`approved_at` timestamp,
	`approved_by` int,
	CONSTRAINT `workflows_id` PRIMARY KEY(`id`)
);
