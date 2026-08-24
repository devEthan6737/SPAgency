import { Command, createStringOption, createUserOption, Declare, LocalesT, Options, type CommandContext } from 'seyfert';
import { BlacklistReason, UBFBApiError } from 'ubfb';
import { getUbfb } from '../../systems/ubfb/client.js';

const reasonChoices = Object.values(BlacklistReason).map((reason) => ({ name: reason, value: reason }));

const options = {
    user: createUserOption({
        description: 'User you want to report.',
        required: true,
        locales: {
            name: 'commands.others.report.option.user.name',
            description: 'commands.others.report.option.user.description'
        }
    }),
    reason: createStringOption({
        description: 'Reason for the report.',
        required: true,
        choices: reasonChoices,
        locales: {
            name: 'commands.others.report.option.reason.name',
            description: 'commands.others.report.option.reason.description'
        }
    }),
    proof: createStringOption({
        description: 'Link to an image proving the reason.',
        required: true,
        locales: {
            name: 'commands.others.report.option.proof.name',
            description: 'commands.others.report.option.proof.description'
        }
    }),
    proof2: createStringOption({
        description: 'Another proof link, if you have one.',
        required: false,
        locales: {
            name: 'commands.others.report.option.proof2.name',
            description: 'commands.others.report.option.proof2.description'
        }
    }),
    proof3: createStringOption({
        description: 'Another proof link, if you have one.',
        required: false,
        locales: {
            name: 'commands.others.report.option.proof3.name',
            description: 'commands.others.report.option.proof3.description'
        }
    })
};

@Declare({
    name: 'report',
    description: 'Reports a user to the UBFB blacklist.',
    aliases: ['reporte', 'reportar'],
    props: { category: 'others' }
})

@LocalesT('commands.others.report.name', 'commands.others.report.description')

@Options(options)

export default class ReportCommand extends Command {
    async run(ctx: CommandContext<typeof options>) {
        const t = ctx.t.commands.others.report;
        const { user, reason, proof, proof2, proof3 } = ctx.options;
        const proofs = [proof, proof2, proof3].filter((value): value is string => !!value);

        try {
            await getUbfb().fileReport({
                userId: user.id,
                reason: reason as BlacklistReason,
                authorId: ctx.author.id,
                authorUsername: ctx.author.username,
                intermediaryId: ctx.author.id,
                intermediaryUsername: ctx.author.username,
                proofs
            });

            await ctx.write({ content: t.success.get() });
        } catch (error) {
            if (error instanceof UBFBApiError && error.status === 409) {
                await ctx.write({ content: t.alreadyPending.get() });
                return;
            }
            if (error instanceof UBFBApiError && error.status === 400) {
                await ctx.write({ content: t.invalidProof.get() });
                return;
            }
            throw error;
        }
    }
}
