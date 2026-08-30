CREATE OR REPLACE FUNCTION notify_guild_config_changed_by_id() RETURNS trigger AS $$
BEGIN
    PERFORM pg_notify('guild_config_changed', NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;--> statement-breakpoint
CREATE TRIGGER guilds_notify_config_changed AFTER UPDATE ON "guilds" FOR EACH ROW EXECUTE FUNCTION notify_guild_config_changed_by_id();
