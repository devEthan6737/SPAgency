CREATE OR REPLACE FUNCTION notify_guild_config_changed() RETURNS trigger AS $$
BEGIN
    PERFORM pg_notify('guild_config_changed', NEW.guild_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;--> statement-breakpoint
CREATE TRIGGER guild_protection_notify_config_changed AFTER UPDATE ON "guild_protection" FOR EACH ROW EXECUTE FUNCTION notify_guild_config_changed();--> statement-breakpoint
CREATE TRIGGER guild_configuration_notify_config_changed AFTER UPDATE ON "guild_configuration" FOR EACH ROW EXECUTE FUNCTION notify_guild_config_changed();
