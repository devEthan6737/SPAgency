const { Collection } = require('discord.js-light');
const { readdirSync } = require('fs');

module.exports = (client) => {
    client.comandos = new Collection()
    for(const subcarpeta of readdirSync('./comandos/')) { 
        for(const file of readdirSync('./comandos/' + subcarpeta)) { 
            if(file.endsWith(".js")) {
                let fileName = file.substring(0, file.length - 3); 
                let fileContents = require(`../comandos/${subcarpeta}/${file}`); 
                client.comandos.set(fileName, fileContents);
            }
        }
    }
}