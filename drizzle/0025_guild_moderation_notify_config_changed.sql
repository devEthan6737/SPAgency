CREATE TRIGGER guild_moderation_notify_config_changed AFTER UPDATE ON "guild_moderation" FOR EACH ROW EXECUTE FUNCTION notify_guild_config_changed();
