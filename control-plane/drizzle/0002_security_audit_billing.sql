-- Security & Audit Tables
CREATE TABLE `security_audit_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int,
	`action_type` varchar(100) NOT NULL,
	`description` text,
	`ip_address` varchar(45),
	`user_agent` varchar(512),
	`severity` enum('low','medium','high','critical') NOT NULL DEFAULT 'low',
	`entity_type` varchar(100),
	`entity_id` int,
	`resource_path` varchar(512),
	`metadata` text,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `security_audit_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint

CREATE TABLE `failed_login_attempts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64),
	`email` varchar(320),
	`ip_address` varchar(45),
	`user_agent` varchar(512),
	`reason` varchar(255),
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `failed_login_attempts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint

CREATE TABLE `security_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`event_type` varchar(100) NOT NULL,
	`severity` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`description` text NOT NULL,
	`source` varchar(100),
	`affected_user_id` int,
	`metadata` text,
	`resolved` boolean NOT NULL DEFAULT false,
	`resolved_at` timestamp,
	`resolved_by` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `security_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint

-- Billing & Payment Tables
CREATE TABLE `subscription_plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`price` decimal(10,2) NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'USD',
	`billing_interval` enum('monthly','yearly') NOT NULL DEFAULT 'monthly',
	`features` text,
	`stripe_price_id` varchar(255),
	`mercado_pago_price_id` varchar(255),
	`active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `subscription_plans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint

CREATE TABLE `user_subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`plan_id` int NOT NULL,
	`status` enum('trialing','active','past_due','canceled','incomplete','incomplete_expired','paused') NOT NULL DEFAULT 'trialing',
	`stripe_customer_id` varchar(255),
	`stripe_subscription_id` varchar(255),
	`mercado_pago_subscription_id` varchar(255),
	`current_period_start` timestamp,
	`current_period_end` timestamp,
	`cancel_at_period_end` boolean NOT NULL DEFAULT false,
	`canceled_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_subscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint

CREATE TABLE `payment_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`subscription_id` int,
	`provider` enum('stripe','mercado_pago') NOT NULL,
	`transaction_type` enum('payment','refund','chargeback','credit') NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'USD',
	`provider_id` varchar(255) NOT NULL,
	`status` enum('pending','succeeded','failed','refunded','partially_refunded') NOT NULL DEFAULT 'pending',
	`metadata` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `payment_transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint

CREATE TABLE `webhook_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`provider` enum('stripe','mercado_pago') NOT NULL,
	`event_type` varchar(100) NOT NULL,
	`provider_event_id` varchar(255) NOT NULL UNIQUE,
	`payload` text,
	`processed` boolean NOT NULL DEFAULT false,
	`processing_result` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`processed_at` timestamp,
	CONSTRAINT `webhook_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
