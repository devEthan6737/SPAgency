import type { PgInsertValue, PgTable } from 'drizzle-orm/pg-core';
import { Embed, type EmbedColors, type SeyfertLocale } from 'seyfert';
import { db } from '../../database/connection.js';

/**
 * Base for every log entry.
 *
 * A concrete log only declares *what it is* — its embed color/description
 * and its target table/row — as overridden methods. Rendering the embed
 * and persisting the row are resolved once, here, from those.
 *
 * Description text is localized at render time via {@link toEmbed}, not baked
 * into the instance — logs are stored as raw data and only rendered when sent
 * to a guild's log channel, using that guild's configured language.
 */
export abstract class Log<Type extends string, Table extends PgTable> {
    /** Discriminant stored in the `type` column, e.g. `ServerEventType.MemberJoin`. */
    abstract readonly type: Type;
    /** Embed color used by {@link toEmbed}. */
    protected abstract getColor(): EmbedColors;
    /** Embed description used by {@link toEmbed}, built from `t`'s translated strings. */
    protected abstract getDescription(t: SeyfertLocale): string;
    /** Drizzle table this log persists to, used by {@link save}. */
    protected abstract getTable(): Table;
    /** Row inserted into the table returned by {@link getTable}, used by {@link save}. */
    protected abstract toRow(): PgInsertValue<Table>;

    readonly createdAt: Date = new Date();

    /**
     * @param guildId - Server this log belongs to.
     * @param targetId - Id of the channel/role/member the log is about, if any.
     */
    constructor(
        readonly guildId: string,
        readonly targetId?: string
    ) {}

    /**
     * Renders this log as the embed sent to the guild's configured log channel.
     * @param t - Locale accessor for the guild's configured language, e.g. `client.t(guildLanguage)`.
     */
    toEmbed(t: SeyfertLocale): Embed {
        return new Embed().setColor(this.getColor()).setDescription(this.getDescription(t)).setTimestamp(this.createdAt);
    }

    /** Persists this log to its table. */
    save() {
        return db.insert(this.getTable()).values(this.toRow());
    }
}
