# /info

Tarjeta paginada en Components V2 con los enlaces del bot, su stack, números en vivo y créditos.

**Ficheros:** [`src/commands/others/info.ts`](../src/commands/others/info.ts), [`src/systems/info/`](../src/systems/info/)

## Páginas

1. **General**: intro con el avatar del bot, los enlaces prioritarios como botones, los secundarios como texto pequeño y los créditos. La insignia BETA solo sale en la rama `canary`.
2. **Técnica**: stack (TypeScript, Node.js, Seyfert, PostgreSQL), números (servidores, usuarios, comandos, tiempo activo) y recursos (CPU, RAM).

Los enlaces están en la primera página a propósito: es la que se ve al ejecutar el comando. El botón central, deshabilitado, indica la página (`1/2 · General`). Los números se recogen una vez al ejecutar el comando, así que la página 2 no se actualiza mientras el mensaje sigue abierto.

## Enlaces (`InfoLinks`)

| Enlace | Prioridad | Origen |
|---|---|---|
| Invitar el bot | Botón | Generado con el id de la aplicación (`client.applicationId`): cada rama enlaza a **su** bot. Permisos: Administrador. |
| Servidor de soporte | Botón | `SUPPORT_INVITE_URL` |
| Donar | Botón | `<WEB_URL>/donate` |
| GitHub | Texto | Fijo en el código: `InfoLinks.GitHubUrl` |
| Web | Texto | `WEB_URL` |

- **La web es `WEB_URL`**, la misma variable con la que el bot llama a la web: hay una sola dirección que mantener. Si `WEB_URL` es una dirección interna (como `127.0.0.1` en el ejemplo), los enlaces de `/info` a la web y a donar también lo serán.
- **Los cinco enlaces salen siempre**, así el diseño no cambia según el entorno. Un botón de tipo enlace no puede existir sin URL, así que uno sin configurar (o cuya URL no sea `http(s)`) se dibuja como un botón gris **deshabilitado**, y en la línea de texto pequeño aparece solo su nombre, sin enlace. Nunca se pasa una URL inválida a Discord: haría que rechace el mensaje entero.
- **En producción, al arrancar, se avisa por log** de las variables que faltan (`[info] SUPPORT_INVITE_URL, WEB_URL not set or invalid...`). En `canary` y `developing` no se avisa, porque ahí es normal no tenerlas.

Los emojis de los botones son `Attachment` (invitar, la imagen `sp_fbm_link`), `Partner` (soporte) y `Visa` (donar); ver [emojis.md](emojis.md).
