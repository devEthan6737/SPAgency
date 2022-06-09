# ¡Bienvenido/a!

¡Gracias por su interés en contribuir a este proyecto!

Antes que todo, le pido amablemente que lea con atención y detenimiento la [licencia](LICENSE) y el [código de conducta](code_of_conduct.md), ya que es escencial que conozca las pautas y condiciones antes de contribuir.

## Principiantes

Si usted es principiante, pero desea contribuir con **código**, ha de tomar en cuenta que debe contar con los siguientes conocimientos principales:

* Git y GitHub ([crash course](https://youtu.be/HiXLkL42tMU))
* JavaScript (con [node.js](https://nodejs.org/))
* [Discord.js](https://discord.js.org/)


## Empezando

Lea el [README](README.md) para obtener una vista rápida del proyecto.

### Configuración

Se deben definir las siguientes variables de entorno:
```yaml
- CANARY_BOT_DB
- BOT_DB
- CANARY_BOT_TOKEN
- BOT_TOKEN
- UBFB_TOKEN
- UBFB_PASSWORD
- DANBOT_TOKEN
```

#### Windows

Abra una instancia de PowerSell en el proyecto y [defina las variables de entorno](https://docs.microsoft.com/es-es/powershell/module/microsoft.powershell.core/about/about_environment_variables).

#### Linux or MacOS

Abra la terminal y [defina las variables de entorno](https://www.digitalocean.com/community/tutorials/how-to-read-and-set-environmental-and-shell-variables-on-linux-es).

#### Otros

Cree un nuevo archivo llamado `.env` e intercambie los valores de la [plantilla](.env.example) por los reales.