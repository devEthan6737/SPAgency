const Discord = require('discord.js-light');
const { dataRequired } = require('../../functions');

module.exports = {
	nombre: 'message',
	category: 'Moderación',
	premium: false,
	alias: [],
	description: 'Haz que el bot envíe un mensaje totalmente personalizado.',
	usage: ['<prefix>message {content: hola} {title: Un título en un embed} {author: Un autor en un embed} {color: Un color en un embed} {image: Una imagen en un embed} {description: Una descripción en un embed} {footer: Un footer en un embed} {thumbnail: Un thumbnail en un embed} {addField: hola, soy un bot hermoso} {reply: true}'],
	run: async (client, message, args, _guild) => {
        client = {};
		if(!message.member.permissions.has('MANAGE_MESSAGES'))return message.channel.send('Necesitas permisos de __Gestionar Mensajes__.');
        if(!args[0])return message.reply(await dataRequired('No has escrito el contenido del mensaje.\n\n' + _guild.configuration.prefix + 'message {content: hola} {title: Un título en un embed} {author: Un autor en un embed} {color: Un color en un embed} {image: Una imagen en un embed} {description: Una descripción en un embed} {footer: Un footer en un embed} {thumbnail: Un thumbnail en un embed} {addField: hola, soy un bot hermoso} {reply: false}'));
		try{
			let _message = args.join(' ').split('{').join('').split('}');

            let content = '.', title, author, color, image, description, footer, thumbnail, fields = [], reply;
            for(x of _message) {
                if(x.includes('content:')) {
                    content = x.split(':')[1];
                }else if(x.includes('title:')) {
                    title = x.split(':')[1];
                }else if(x.includes('author:')) {
                    author = x.split(':')[1];
                }else if(x.includes('color:')) {
                    color = x.split(':')[1];
                }else if(x.includes('image:')) {
                    image = x.split(':')[1];
                }else if(x.includes('description:')) {
                    description = x.split(':')[1];
                }else if(x.includes('footer:')) {
                    footer = x.split(':')[1];
                }else if(x.includes('thumbnail:')) {
                    thumbnail = x.split(':')[1];
                }else if(x.includes('addField:')) {
                    fields.push(x.split(':')[1]);
                }else if(x.includes('reply:')) {
                    if(x.split(':')[1] == 'true') reply = true; else reply = false;
                }
            }

            let embed;
            if(title || author || image || description || footer || thumbnail) {
                embed = new Discord.MessageEmbed();
                embed.setColor(`${color ?? 0x0056ff}`)
                if(title) embed.setTitle(`${title}`)
                if(author) embed.setAuthor(`${author}`)
                if(image) embed.setImage(`${image}`)
                if(description) embed.setDescription(`${description}`)
                if(footer) embed.setFooter(`${footer}`)
                if(thumbnail) embed.setThumbnail(`${thumbnail}`)
                
                for(x of fields) {
                    embed.addField(`${x.split(',')[0]}`, `${x.split(', ')[1]}`);
                }
            }
            
            if(content != '.' && (content.includes('@everyone') || content.includes('@here'))) content = content.split('@everyone').join('').split('@here').join('');

            if(reply == true) {
                if(embed) {
                    message.reply({ content: `${ content }`, embeds: [ embed ] });
                }else message.reply({ content: `${ content }` });
            }else{
                if(embed) {
                    message.channel.send({ content: `${ content }`, embeds: [ embed ] });
                }else message.channel.send({ content: `${ content }` });
            }
		}catch(e) {
			message.channel.send('```' + e + '```');
		}
	},
};