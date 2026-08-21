ALTER TABLE "guild_configuration" DROP COLUMN "logs";--> statement-breakpoint
ALTER TABLE "guild_configuration" ADD COLUMN "logs_enable" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "guild_configuration" ADD COLUMN "logs_channel" text;
