import { boolean, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const maliciousUsers = pgTable('malicious_users', {
    // global list, not per-server (viene de UBFB, no tiene guildId en el schema original)
    userId: text('user_id').primaryKey(),
    // whether the user is currently marked malicious
    isMalicious: boolean('is_malicious').notNull().default(true),
    // why the user was marked malicious
    reason: text('reason'),
    // proof image url, shown to the user via sp!me
    proof: text('proof'),
    // when the punishment ends
    punishment: timestamp('punishment'),
    // apelar.js: 'En Espera' | 'Aceptado' | rechazada
    appealStatus: text('appeal_status'),
    // moderation history shown to the user
    record: text('record')
});
