const { readdirSync } = require('fs');

module.exports = (client) => {
    for(const file of readdirSync('./eventos/')) {
        if(file.endsWith('.js')) {
            const fileName = file.substring(0, file.length - 3);
            const fileContents = require(`../eventos/${file}`);
            client.on(fileName, fileContents.bind(null, client));
            delete require.cache[require.resolve(`../eventos/${file}`)];
        }
    }
}