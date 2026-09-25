# Paginación

Dos componentes reutilizables para listas largas en un embed con botones. Portados del sistema `messages_utils` de spaceflighter y reescritos para SPAgency.

**Ficheros:** [`src/systems/shared/pagination/`](../src/systems/shared/pagination/)

| Pieza | Qué es |
|---|---|
| `PageCursor` | Solo aritmética de páginas (página actual, hay siguiente/anterior, qué trozo de la lista toca). No sabe nada de Discord: es lo que comparten los dos componentes. |
| `Paginator<T>` | Pasa páginas con anterior/siguiente, con un botón central opcional y páginas hijas anidadas ("ver detalle" con botón *volver*). Dibuja **embeds** o **Components V2**. |
| `PaginationSelector<T>` | Lista con una **fila seleccionada**: flechas arriba/abajo mueven la selección (y pasan de página al cruzar el borde), izquierda/derecha cambian de página, hasta 4 botones propios actúan sobre el elemento seleccionado y un `?` explica cómo se usa. |
| `PaginationButtonId` | Enum con los custom ids de los botones propios, con prefijo `pagination:` para no chocar con los del que lo use. |

## Uso

```ts
const paginator = new Paginator(ctx, {
    data: warns,
    itemsPerPage: 5,
    formatter: (items, view) => items.map((warn) => `#${warn.id} ${warn.reason}`).join('\n'),
    embed: (view) => new Embed().setTitle(`Avisos ${view.page}/${view.totalPages}`)
});
await paginator.start();
```

`ctx` es un `CommandContext`. El paginador se envía como su respuesta y **solo el autor del comando** puede pulsar los botones. `formatter` recibe los elementos de la página y devuelve la descripción (máx. 4096 caracteres); el embed que devuelve `embed` se completa con esa descripción.

Con lista vacía muestra el texto `systems.pagination.empty` de los locales y las flechas deshabilitadas.

### Components V2

En vez de `formatter` + `embed`, se pasa `content`: una función que devuelve el `Container` de cada página. El paginador añade debajo la fila de navegación y envía el mensaje con la flag `IsComponentsV2` (así que no puede llevar embeds ni `content` de texto).

```ts
await new Paginator(ctx, {
    data: [Page.General, Page.Technical],
    itemsPerPage: 1, // cada elemento de data es una página
    content: ([page]) => (page === Page.General ? general() : technical()),
    middle: (view) => new Button().setCustomId('page').setLabel(`${view.page}/${view.totalPages}`).setStyle(ButtonStyle.Secondary).setDisabled(true)
}).start();
```

Un `middle` deshabilitado no se reactiva al redibujar: sirve de etiqueta de página. Es lo que hace [`/info`](../src/commands/others/info.ts). Los botones de tipo enlace que pongas dentro del contenedor no generan interacciones, así que no pasan por el colector.

### Botón central y páginas hijas

`middle` es un `Button` (o una función que lo construye para la página actual). Sus pulsaciones se atienden con `paginator.run(customId, callback)`. Desde ahí se puede abrir un hijo en el mismo mensaje:

```ts
paginator.run('detail', async (interaction) => {
    const child = await paginator.openChild(interaction, { data: lines, itemsPerPage: 1, formatter, embed });
});
```

El hijo lleva un botón *volver* que restaura al padre. Anterior/siguiente siempre actúan sobre el que está en pantalla.

### Selector

```ts
const selector = new PaginationSelector(ctx, {
    data: backups,
    itemsPerPage: 5,
    formatter: (items, view) => items.map((b, i) => (view.firstIndex + i === view.selectedIndex ? '▶ ' : '   ') + b.name).join('\n'),
    embed: () => new Embed().setTitle('Backups'),
    information: 'Usa ▲ y ▼ para elegir y los botones para actuar.',
    actions: [deleteButton, null, null, null]
});
await selector.start();
selector.addAction('delete', async (interaction, backup) => { /* ... */ selector.refreshData(remaining); });
```

Las 4 posiciones de `actions` son, en orden de lectura: a la derecha de "arriba", en el centro de la fila de páginas, a la izquierda de "abajo" y a la derecha de "abajo". Una posición `null` muestra un botón gris deshabilitado. Los botones propios están deshabilitados mientras no haya nada seleccionado.

`addAction` ejecuta el callback y **después redibuja** el selector solo. Si el callback ya respondió a la interacción (abrió un modal, por ejemplo), el redibujado edita el mensaje en vez de intentar responder otra vez. Un callback que cambia los datos solo tiene que llamar a `refreshData`.

## Diferencias con el original

- **Sin `any`**: genéricos sobre el tipo de dato (`Paginator<T>`, `PaginationSelector<T>`) y tipos de Seyfert reales.
- **Los botones se deshabilitan al expirar** (3 minutos por defecto, `timeoutMs`); antes quedaban pulsables y fallaban.
- **Filtra por `ctx.author`**, no por `ctx.member`, que es `undefined` en DM.
- **Los textos vienen de los locales** (`systems.pagination.empty` y `systems.pagination.back`), no de cadenas fijas en español.
- **Sin `MessageInstance`**: el original envolvía el cuerpo del mensaje en una clase con callbacks y un `resolve(...params)` que pasaba los argumentos empaquetados en un array; no aportaba nada al render.
- **Una pulsación que no puede avanzar** (llegó justo cuando el botón se deshabilitaba) se acusa con `deferUpdate` en lugar de dejar la interacción sin responder ("Esta interacción ha fallado").
- **Anidado sin estado compartido oculto**: en el original el hijo tomaba el colector del padre y el padre reenviaba a mano cada pulsación al hijo; ahora los niveles comparten una sesión (`PaginationSession`) y el que está en pantalla es siempre la hoja de la cadena.
- El `Paginator` original también podía arrancar desde una interacción de botón (escribiendo un mensaje nuevo en el canal); esta versión solo arranca desde un comando. Añadirlo es sencillo si hace falta.

## Límites

Embed: descripción 4096 caracteres, etiqueta de botón 80. Nada de esto se valida: es responsabilidad del `formatter`.
