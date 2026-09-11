CREATE TABLE "bot_adders" (
	"guild_id" text NOT NULL,
	"bot_id" text NOT NULL,
	"executor_id" text NOT NULL,
	"added_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "bot_adders_guild_id_bot_id_pk" PRIMARY KEY("guild_id","bot_id")
);
--> statement-breakpoint
ALTER TABLE "bot_adders" ADD CONSTRAINT "bot_adders_guild_id_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."guilds"("id") ON DELETE cascade ON UPDATE no action;