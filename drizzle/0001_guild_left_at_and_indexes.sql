ALTER TABLE "guilds" ADD COLUMN "left_at" timestamp;--> statement-breakpoint
CREATE INDEX "guilds_left_at_idx" ON "guilds" USING btree ("left_at");--> statement-breakpoint
CREATE INDEX "warns_guild_user_idx" ON "warns" USING btree ("guild_id","user_id");--> statement-breakpoint
CREATE INDEX "bot_action_logs_guild_created_idx" ON "bot_action_logs" USING btree ("guild_id","created_at");--> statement-breakpoint
CREATE INDEX "server_event_logs_guild_created_idx" ON "server_event_logs" USING btree ("guild_id","created_at");
