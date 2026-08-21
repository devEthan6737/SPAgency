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
	"antitokens_enable" boolean DEFAULT false NOT NULL,
	"antijoins_enable" boolean DEFAULT false NOT NULL,
	"mark_malicious_enable" boolean DEFAULT true NOT NULL,
	"mark_malicious_type" text DEFAULT 'changeNickname' NOT NULL,
	"warn_entry" boolean DEFAULT true NOT NULL,
	"kick_malicious_enable" boolean DEFAULT false NOT NULL,
	"own_system_enable" boolean DEFAULT false NOT NULL,
	"verification_enable" boolean DEFAULT false NOT NULL,
	"verification_type" text,
	"verification_channel" text,
	"verification_role" text,
	"cannot_enter_twice_enable" boolean DEFAULT false NOT NULL,
	"cannot_enter_twice_users" text[] DEFAULT '{}' NOT NULL,
	"purge_webhooks_attacks_enable" boolean DEFAULT false NOT NULL,
	"purge_webhooks_attacks_remember_owner" text DEFAULT 'Nadie' NOT NULL,
	"intelligent_sos_enable" boolean DEFAULT false NOT NULL,
	"intelligent_sos_cooldown" boolean DEFAULT false NOT NULL,
	"intelligent_antiflood" boolean DEFAULT false NOT NULL,
	"antiflood" boolean DEFAULT true NOT NULL,
	"bloq_entrities_by_name_enable" boolean DEFAULT false NOT NULL,
	"bloq_entrities_by_name_names" text[] DEFAULT '{"raider","doxer","hacker","infecter"}' NOT NULL,
	"bloq_new_created_users_time" text DEFAULT '1h' NOT NULL,
	"raidmode_enable" boolean DEFAULT false NOT NULL,
	"raidmode_time_to_disable" text DEFAULT '1d' NOT NULL,
	"raidmode_password" text DEFAULT 'Nothing' NOT NULL,
	"raidmode_actived_date" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guild_moderation" (
	"guild_id" text PRIMARY KEY NOT NULL,
	"force_reasons" text[] DEFAULT '{}' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guild_configuration" (
	"guild_id" text PRIMARY KEY NOT NULL,
	"whitelist" text[] DEFAULT '{}' NOT NULL,
	"logs" text[] DEFAULT '{}' NOT NULL,
	"ignore_channels" text[] DEFAULT '{}' NOT NULL,
	"password_enable" boolean DEFAULT false NOT NULL,
	"password" text DEFAULT '' NOT NULL,
	"password_users_with_access" text[] DEFAULT '{}' NOT NULL,
	"show_details_in_cmds_command" text DEFAULT 'lessDetails' NOT NULL,
	"ping_message" text DEFAULT 'allDetails' NOT NULL
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
	"enable" boolean DEFAULT true NOT NULL,
	"password" text,
	"name" text,
	"icon" text,
	"channels_category" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"channels_text" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"channels_no_category" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"roles" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"bans" jsonb DEFAULT '[]'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "malicious_users" (
	"user_id" text PRIMARY KEY NOT NULL,
	"is_malicious" boolean DEFAULT true NOT NULL,
	"reason" text,
	"proof" text,
	"punishment" timestamp,
	"appeal_status" text,
	"record" text
);
--> statement-breakpoint
ALTER TABLE "guild_protection" ADD CONSTRAINT "guild_protection_guild_id_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."guilds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guild_moderation" ADD CONSTRAINT "guild_moderation_guild_id_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."guilds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guild_configuration" ADD CONSTRAINT "guild_configuration_guild_id_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."guilds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warns" ADD CONSTRAINT "warns_guild_id_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."guilds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "backups" ADD CONSTRAINT "backups_guild_id_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."guilds"("id") ON DELETE cascade ON UPDATE no action;