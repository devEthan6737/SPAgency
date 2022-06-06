module.exports = {
    nombre: "invite",
    category: "Otros",
    premium: false,
    alias: [],
    description: "Invítame a tu servidor.",
    usage: ['<prefix>invite'],
    run: async (client, message, args, _guild) => {
        let LANG = require(`../../LANG/${_guild.configuration.language}.json`);

        message.reply({ content: '' + LANG.commands.others.invite.message1 + '\n\nhttps://top.gg/bot/779660400081764393', ephemeral: true });
    }
}