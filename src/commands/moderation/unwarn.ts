import { Command, createBooleanOption, createIntegerOption, createUserOption, Declare, LocalesT, Options, type CommandContext } from 'seyfert';
import { WarnRepository } from '../../database/repositories/warn.repository.js';

const options = {
    member: createUserOption({
        description: 'Member to remove a warning from.',
        required: true,
        locales: {
            name: 'commands.moderation.unwarn.option.member.name',
            description: 'commands.moderation.unwarn.option.member.description'
        }
    }),
    id: createIntegerOption({
        description: 'ID of the specific warning to remove (see /warns).',
        required: false,
        locales: {
            name: 'commands.moderation.unwarn.option.id.name',
            description: 'commands.moderation.unwarn.option.id.description'
        }
    }),
    all: createBooleanOption({
        description: "Remove all of this member's warnings instead of one.",
        required: false,
        locales: {
            name: 'commands.moderation.unwarn.option.all.name',
            description: 'commands.moderation.unwarn.option.all.description'
        }
    })
};

@Declare({
    name: 'unwarn',
    description: "Removes one (or all) of a member's warnings.",
    defaultMemberPermissions: ['ManageMessages'],
    props: { category: 'moderation' }
})

@LocalesT('commands.moderation.unwarn.name', 'commands.moderation.unwarn.description')

@Options(options)

export default class UnwarnCommand extends Command {
    async run(ctx: CommandContext<typeof options>) {
        if (!ctx.inGuild()) return;
        const t = ctx.t.commands.moderation.unwarn;
        const targetId = ctx.options.member.id;

        if (ctx.options.all) {
            const removed = await WarnRepository.deleteAll(ctx.guildId, targetId);
            return await ctx.write({ content: t.doneAll(targetId, removed.length).get() });
        }

        if (ctx.options.id === undefined) return await ctx.write({ content: t.needsIdOrAll.get() });

        const removed = await WarnRepository.deleteById(ctx.guildId, targetId, ctx.options.id);
        if (!removed.length) return await ctx.write({ content: t.notFound.get() });

        await ctx.write({ content: t.done(targetId, ctx.options.id).get() });
    }
}
