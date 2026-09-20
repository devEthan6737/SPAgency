# SP Agency Community Edition

Bot de Discord enfocado en la seguridad de servidores, construido sobre [Seyfert](https://seyfert.dev/) y PostgreSQL.

## Sistemas

- **Antiraid** — detección de ráfagas de canales/roles/baneos, con recuperación (`/unnuke`, `/backup`). Ver [`docs/antiraid.md`](docs/antiraid.md).
- **Antibots** — bloquea bots no verificados (o todos) al unirse. Ver [`docs/antibots.md`](docs/antibots.md).
- **Raidmode** — bloqueo manual de tolerancia cero para cuando ya se sabe que hay un problema. Ver [`docs/raidmode.md`](docs/raidmode.md).
- **Miembros maliciosos** — reacciona a hits contra la blacklist global de UBFB. Ver [`docs/malicious-members.md`](docs/malicious-members.md).
- **Selfbots/cuentas falsas** — heurística por puntuación al unirse. Ver [`docs/selfbot.md`](docs/selfbot.md).
- **Automod** — flood, ghostping, caps lock, exceso de emojis/palabras, más lo que ya bloquea el AutoMod nativo de Discord. Ver [`docs/moderation.md`](docs/moderation.md).
- **Bot-adder** — banea a quien añadió un bot que resultó ser un raider. Ver [`docs/bot-adder.md`](docs/bot-adder.md).
- **Verificación** — OAuth2 + captcha vía dashboard web. Ver [`docs/verification.md`](docs/verification.md).
- **Soporte** — tickets web ↔ Discord: cada ticket es un canal del servidor de soporte. Ver [`docs/support.md`](docs/support.md).
- **SOS al staff** — aviso manual o automático al staff de SPAgency. Ver [`docs/intelligent-sos.md`](docs/intelligent-sos.md).
- **Logs** — registro de seguridad de dos tipos (acciones pedidas por comando vs. eventos automáticos). Ver [`docs/logs.md`](docs/logs.md).

## Empezando

Requiere Node.js ≥18, pnpm y PostgreSQL. Copie [`.env.example`](.env.example) a `.env` y rellene `BOT_TOKEN`, `PREFIX`, `DATABASE_URL`.

```bash
pnpm install
pnpm run db:migrate
pnpm run dev
```

Para contribuir código, lea [`CONTRIBUTING.md`](CONTRIBUTING.md) — convenciones de estilo, estructura de comandos y flujo de la base de datos.

## Licencia

[BSD 3-Clause](LICENSE)
