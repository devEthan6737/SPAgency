module.exports = {
    nombre: "invite",
    category: "Otros",
    premium: false,
    alias: ['inv'],
    description: "Invítame a tu servidor.",
    usage: ['<prefix>invite'],
    run: async (client, message, args, _guild) => {
        let LANG = require(`../../LANG/${_guild.configuration.language}.json`);

        message.reply({ content: '' + LANG.commands.others.invite.message1 + '\n\nhttps://disverse.space/bot/1038614901394002020', ephemeral: true });
    }
}
