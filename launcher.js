require('dotenv').config();

if(process.env.EJECT_LAUNCHER === 'true') {
    const axios = require('axios');
    const fs = require('fs');
    const package = require('./package.json');
    require('colors');

    console.log('[LAUNCHER] '.green + 'Comparando versión...'.yellow);
    axios.get('https://api.github.com/repos/devEthan6737/SPAgency/contents/package.json?ref=main', { headers: { 'Authorization': `Bearer ${process.env.GitHubToken}` } }).then(response => {
        if((JSON.parse(Buffer.from(response.data.content, 'base64').toString())).version === package.version) {
            console.clear();
            console.log('[LAUNCHER] '.green + 'El código está actualizado.'.yellow);
            require('./index');
        }else{
            console.log('[LAUNCHER] '.green + 'El código está desactualizado.'.red);
            console.log('[LAUNCHER] '.green + 'Obteniendo source code...'.yellow);
            axios.get('https://api.github.com/repos/devEthan6737/SPAgency/contents/', { headers: { 'Authorization': `Bearer ${process.env.GitHubToken}` } }).then(response => {

                let onceWarnReady;
                function baseLauncher(response) {
                    let promise = response.data.filter(entry => entry.name != 'launcher.js').map(File => axios.get(`https://api.github.com/repos/devEthan6737/SPAgency/contents/${File.path}?ref=main`, { headers: { 'Authorization': `Bearer ${process.env.GitHubToken}` } }).then(res => {
                        if(File.type === 'dir')return axios.get(`https://api.github.com/repos/devEthan6737/SPAgency/contents/${File.path}?ref=main`, { headers: { 'Authorization': `Bearer ${process.env.GitHubToken}` } }).then(dirRes => baseLauncher(dirRes));

                        if(fs.readFileSync(File.path, 'utf8') != Buffer.from(res.data.content, 'base64').toString()) {
                            console.log('[LAUNCHER] '.green + `Actualizando ${File.name} en "./${File.path}".`.blue);

                            if(fs.existsSync(File.path)) fs.unlinkSync(File.path);
                            fs.writeFileSync(File.path, Buffer.from(res.data.content, 'base64').toString());
                        }
                    }))

                    Promise.all(promise).then(() => {
                        !onceWarnReady? console.log('[LAUNCHER] Iniciando bot en 5 segundos (SE RECOMIENDA REINICIAR).'.green) : null;
                        !onceWarnReady? setTimeout(() => require('./index'), 5000) : null;
                        onceWarnReady = true;
                    });
                }

                baseLauncher(response);

            }).catch(error => {
                if(error.message.includes('403'))return console.error('[LAUNCHER] '.green + `Error 403: Ratelimit by GitHub.`.red);

                console.error('[LAUNCHER] '.green + 'Error:', error);
            });
        };
    }).catch(error => {
        if(error.message.includes('403'))return console.error('[LAUNCHER] '.green + `Error 403: Ratelimit by GitHub.`.red);
        if(error.message.includes('401'))return console.error('[LAUNCHER] '.green + `Error 401: Token de GitHub no válido.`.red);
        console.error('[LAUNCHER] '.green + ` Error al leer el package del source code: ${error}`.red);
    });
}else require('./index');