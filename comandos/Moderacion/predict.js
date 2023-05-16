const Discord = require('discord.js-light');
const ms = require('ms');
const { getResponseAndDelete } = require('../../functions');

function alt(number) {
    if(number > 0.7)return 'YES';
    else if(number > 0.6)return 'SO PROBABLY';
    else if(number > 0.4)return 'PROBABLY';
    else if(number > 0.3)return 'MAYBE';
    else return 'NOT'; 
}

module.exports = {
	nombre: 'predict',
	category: 'Moderación',
    premium: false,
	alias: [],
	description: 'Predice si una imagen o gif es NSFW o no.',
	usage: ['<prefix>predict'],
	run: async (client, message, args, _guild) => {
        let LANG = require(`../../LANG/${_guild.configuration.language}.json`);

        if(message.attachments.size == 0)return message.reply({ content: LANG.commands.mod.predict.message1});
        let ping = Date.now();
        message.attachments.forEach(async x => {
            if(x.proxyURL.endsWith('png') || x.proxyURL.endsWith('gif') || x.proxyURL.endsWith('jpeg') || x.proxyURL.endsWith('jpg') || x.proxyURL.endsWith('bmp')) {

                client.ubfb.post({
                    token: await (client.ubfb.client().then(cl => cl.token())),
                    event: true,
                    eventToEmit: 'nsfwFilterP',
                    name: 'nsfwFilterReq',
                    url: x.proxyURL,
                    authorId: `${message.author.id}`
                });

                setTimeout(async () => {
                    let response = await getResponseAndDelete(message.author.id);
                    message.reply({ embeds: [
                        new Discord.MessageEmbed().setDescription(`${LANG.commands.mod.predict.message2} **${ms(Date.now() - ping)}**\n\n${response.predictions.map(predict => `\`func ${predict[0]}\` __says__ **${alt(predict[1])}**`).join('\n')}`).setColor('RED')
                    ] });
                }, 4000);
            }else{
                message.reply({ content: LANG.commands.mod.predict.message3});
            }
        });
	},
};