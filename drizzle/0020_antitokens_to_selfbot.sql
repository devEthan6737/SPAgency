ALTER TABLE "guild_protection" DROP COLUMN "antitokens_enable";--> statement-breakpoint
ALTER TABLE "guild_protection" DROP COLUMN "bloq_new_created_users_time";--> statement-breakpoint
ALTER TABLE "guild_protection" ADD COLUMN "selfbot_action" text DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE "guild_protection" ADD COLUMN "selfbot_min_account_age" text DEFAULT '30d' NOT NULL;
