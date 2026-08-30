ALTER TABLE "guild_protection" DROP COLUMN "raidmode_actived_date";--> statement-breakpoint
ALTER TABLE "guild_protection" ADD COLUMN "raidmode_activated_at" timestamp;
