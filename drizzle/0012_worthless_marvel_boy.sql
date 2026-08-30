ALTER TABLE "guild_protection" DROP COLUMN "mark_malicious_enable";--> statement-breakpoint
ALTER TABLE "guild_protection" DROP COLUMN "kick_malicious_enable";--> statement-breakpoint
ALTER TABLE "guild_protection" DROP COLUMN "cannot_enter_twice_enable";--> statement-breakpoint
ALTER TABLE "guild_protection" DROP COLUMN "cannot_enter_twice_users";--> statement-breakpoint
ALTER TABLE "guild_protection" ADD COLUMN "malicious_member_action" text DEFAULT 'mark' NOT NULL;
