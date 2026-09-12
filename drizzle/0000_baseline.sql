CREATE TABLE "guilds" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_id" text NOT NULL,
	"prefix" text DEFAULT 'sp!' NOT NULL,
	"language" text DEFAULT 'es' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guild_protection" (
	"guild_id" text PRIMARY KEY NOT NULL,
	"antiraid_enable" boolean DEFAULT true NOT NULL,
	"antibots_enable" boolean DEFAULT false NOT NULL,
	"antibots_type" text DEFAULT 'all' NOT NULL,
	"selfbot_action" text DEFAULT 'none' NOT NULL,
	"selfbot_min_account_age" text DEFAULT '30d' NOT NULL,
	"malicious_member_action" text DEFAULT 'mark' NOT NULL,
	"verification_enable" boolean DEFAULT false NOT NULL,
	"verification_role" text,
	"intelligent_sos_enable" boolean DEFAULT false NOT NULL,
	"raidmode_enable" boolean DEFAULT false NOT NULL,
	"raidmode_time_to_disable" text DEFAULT '1d' NOT NULL,
	"raidmode_activated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "guild_moderation" (
	"guild_id" text PRIMARY KEY NOT NULL,
	"force_reasons" text[] DEFAULT '{}' NOT NULL,
	"antiflood" boolean DEFAULT true NOT NULL,
	"anti_webhooks_flood" boolean DEFAULT false NOT NULL,
	"ghostping_enable" boolean DEFAULT false NOT NULL,
	"caps_lock_enable" boolean DEFAULT false NOT NULL,
	"caps_lock_threshold" integer DEFAULT 70 NOT NULL,
	"many_emojis_enable" boolean DEFAULT false NOT NULL,
	"many_emojis_threshold" integer DEFAULT 8 NOT NULL,
	"many_words_enable" boolean DEFAULT false NOT NULL,
	"many_words_threshold" integer DEFAULT 150 NOT NULL,
	"automod_mute_at" integer DEFAULT 3 NOT NULL,
	"automod_mute_minutes" integer DEFAULT 10 NOT NULL,
	"automod_final_action" text DEFAULT 'none' NOT NULL,
	"automod_final_action_at" integer DEFAULT 6 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guild_configuration" (
	"guild_id" text PRIMARY KEY NOT NULL,
	"whitelist" text[] DEFAULT '{}' NOT NULL,
	"logs_channel" text
);
--> statement-breakpoint
CREATE TABLE "warns" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "warns_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"guild_id" text NOT NULL,
	"user_id" text NOT NULL,
	"reason" text NOT NULL,
	"moderator_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "backups" (
	"guild_id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"name" text,
	"icon" text,
	"channels_category" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"channels_text" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"channels_no_category" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"roles" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"bans" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"emojis" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"stickers" jsonb DEFAULT '[]'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "server_event_logs" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "server_event_logs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"guild_id" text NOT NULL,
	"type" text NOT NULL,
	"target_id" text,
	"data" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bot_action_logs" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "bot_action_logs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"guild_id" text NOT NULL,
	"type" text NOT NULL,
	"target_id" text,
	"executor_id" text,
	"reason" text,
	"data" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tempbans" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "tempbans_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"guild_id" text NOT NULL,
	"user_id" text NOT NULL,
	"reason" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bot_adders" (
	"guild_id" text NOT NULL,
	"bot_id" text NOT NULL,
	"executor_id" text NOT NULL,
	"added_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "bot_adders_guild_id_bot_id_pk" PRIMARY KEY("guild_id","bot_id")
);
--> statement-breakpoint
ALTER TABLE "guild_protection" ADD CONSTRAINT "guild_protection_guild_id_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."guilds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guild_moderation" ADD CONSTRAINT "guild_moderation_guild_id_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."guilds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guild_configuration" ADD CONSTRAINT "guild_configuration_guild_id_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."guilds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warns" ADD CONSTRAINT "warns_guild_id_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."guilds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "backups" ADD CONSTRAINT "backups_guild_id_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."guilds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "server_event_logs" ADD CONSTRAINT "server_event_logs_guild_id_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."guilds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bot_action_logs" ADD CONSTRAINT "bot_action_logs_guild_id_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."guilds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tempbans" ADD CONSTRAINT "tempbans_guild_id_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."guilds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bot_adders" ADD CONSTRAINT "bot_adders_guild_id_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."guilds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "guild_protection_antiraid_enable_idx" ON "guild_protection" USING btree ("antiraid_enable");--> statement-breakpoint
CREATE INDEX "tempbans_expires_at_idx" ON "tempbans" USING btree ("expires_at");--> statement-breakpoint
-- Hand-written, not something `drizzle-kit generate` can derive from the schema files (no
-- declarative way to express a trigger in Drizzle's schema builder) — see the doc comments on
-- `guilds`, `guild_protection`, `guild_configuration` and `guild_moderation` in
-- src/database/schema/*.ts. `GuildConfigCache` and `RaidmodeExpiry` both `LISTEN` on
-- 'guild_config_changed' to invalidate/reschedule without polling — see docs/antiraid.md section 2.
CREATE OR REPLACE FUNCTION notify_guild_config_changed() RETURNS trigger AS $$
BEGIN
    PERFORM pg_notify('guild_config_changed', NEW.guild_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;--> statement-breakpoint
CREATE OR REPLACE FUNCTION notify_guild_config_changed_by_id() RETURNS trigger AS $$
BEGIN
    PERFORM pg_notify('guild_config_changed', NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;--> statement-breakpoint
CREATE TRIGGER guild_protection_notify_config_changed AFTER UPDATE ON "guild_protection" FOR EACH ROW EXECUTE FUNCTION notify_guild_config_changed();--> statement-breakpoint
CREATE TRIGGER guild_configuration_notify_config_changed AFTER UPDATE ON "guild_configuration" FOR EACH ROW EXECUTE FUNCTION notify_guild_config_changed();--> statement-breakpoint
CREATE TRIGGER guild_moderation_notify_config_changed AFTER UPDATE ON "guild_moderation" FOR EACH ROW EXECUTE FUNCTION notify_guild_config_changed();--> statement-breakpoint
CREATE TRIGGER guilds_notify_config_changed AFTER UPDATE ON "guilds" FOR EACH ROW EXECUTE FUNCTION notify_guild_config_changed_by_id();