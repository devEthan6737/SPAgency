const { newResponse } = require("../functions");

module.exports = async (client, response) => {

    /*
    La api UBFB dejará de enviar eventos con las respuestas a imágenes NSFW debido a la v7.
    Podéis desmantelar el AntiNSFW: os he vaciado el objeto para que no emita errores aunque
    no deberían de llegar respuestas aquí.
    */

    if(response && response.predict1 && response.authorId) {
        response.predictions = [
            {},
            {},
            {},
            {},
            {}
        ];

        newResponse(response);
    }
};