ALTER TABLE "guild_moderation" ADD COLUMN "antiflood" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "guild_moderation" ADD COLUMN "anti_webhooks_flood" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "guild_moderation" ADD COLUMN "anti_webhooks_flood_remember_owner" text DEFAULT 'Nadie' NOT NULL;--> statement-breakpoint
ALTER TABLE "guild_protection" DROP COLUMN "purge_webhooks_attacks_enable";--> statement-breakpoint
ALTER TABLE "guild_protection" DROP COLUMN "purge_webhooks_attacks_remember_owner";--> statement-breakpoint
ALTER TABLE "guild_protection" DROP COLUMN "intelligent_antiflood";--> statement-breakpoint
ALTER TABLE "guild_protection" DROP COLUMN "antiflood";