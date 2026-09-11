ALTER TABLE "guild_moderation" ADD COLUMN "ghostping_enable" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "guild_moderation" ADD COLUMN "caps_lock_enable" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "guild_moderation" ADD COLUMN "caps_lock_threshold" integer DEFAULT 70 NOT NULL;--> statement-breakpoint
ALTER TABLE "guild_moderation" ADD COLUMN "many_emojis_enable" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "guild_moderation" ADD COLUMN "many_emojis_threshold" integer DEFAULT 8 NOT NULL;--> statement-breakpoint
ALTER TABLE "guild_moderation" ADD COLUMN "many_words_enable" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "guild_moderation" ADD COLUMN "many_words_threshold" integer DEFAULT 150 NOT NULL;--> statement-breakpoint
ALTER TABLE "guild_moderation" ADD COLUMN "automod_mute_at" integer DEFAULT 3 NOT NULL;--> statement-breakpoint
ALTER TABLE "guild_moderation" ADD COLUMN "automod_mute_minutes" integer DEFAULT 10 NOT NULL;--> statement-breakpoint
ALTER TABLE "guild_moderation" ADD COLUMN "automod_final_action" text DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE "guild_moderation" ADD COLUMN "automod_final_action_at" integer DEFAULT 6 NOT NULL;