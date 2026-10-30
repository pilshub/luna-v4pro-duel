# El Retorno

Juego arcade en pixel art y formato vertical (9:16): la calle sube sola y tienes que llevar al chico a casa esquivando todo lo que sale de repente en una ciudad española de noche. Pulsas JUGAR y empiezas.

Cada partida es distinta: se eligen al azar 6 tramos entre 9 peligros, en orden aleatorio, con calles y patrones de ataque generados al momento. Al final te espera El Coco en tu portal.

| Tramo | Qué sale |
| --- | --- |
| ¡Zombis! | Vecinos que salen del suelo y te persiguen |
| ¡El vampiro! | Murciélagos y picados del vampiro sobre tu sombra |
| ¡Un volcán! | Volcanes que brotan del asfalto y lanzan lava |
| ¡Encierro! | Toros, taxis y un autobús fantasma cruzando la calle |
| ¡Fantasmas! | Fantasmas y macetas que caen de los balcones |
| ¡La Santa Compaña! | Niebla y procesiones de ánimas |
| ¡La meiga! | Rayos con aviso desde su escoba |
| ¡La tuna zombi! | Tunos que disparan notas musicales |
| ¡El lobishome! | Un hombre lobo que embiste y gatos negros |
| El Coco (final) | Esquiva sus sombras y coge chanclas: se lanzan solas |

## Controles

- Móvil: joystick analógico (donde pongas el dedo) + botón **A** para esquivar.
- Teclado: flechas o WASD, **Espacio** para esquivar, **P** pausa, **M** sonido.

## Puntuación y ranking

Suman puntos los metros recorridos, las monedas, cada tramo superado (más si es sin golpes), cada chanclazo a El Coco y llegar a casa.
Al acabar escribes tu nombre, con emotes pixel si quieres (😎 🔥 👑 💀 👻…):

- **Este dispositivo**: siempre, en `localStorage`.
- **Mundial**: si el proyecto de Vercel tiene una base de datos Redis (Upstash) conectada.
  La función `api/scores.js` usa `KV_REST_API_URL` / `KV_REST_API_TOKEN`
  (o `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`). Sin ellas, el juego usa el ranking local.

## Publicar en Vercel (elretorno.vercel.app)

El juego está en la raíz del repo y no necesita build: Vercel lo publica tal cual en cada push a `main`.

1. En Vercel: **Add New… → Project** e importa este repositorio (Framework: *Other*, sin comando de build).
2. **Project Name**: `elretorno`, o añade `elretorno.vercel.app` en **Settings → Domains** si está libre.
3. (Opcional, ranking mundial) **Storage → Upstash for Redis**, conéctala al proyecto y vuelve a desplegar.

## Probar en local

```sh
python3 -m http.server 8000
# abre http://localhost:8000
```

Atajos de prueba: `?tema=zombis,volcan` empieza con esos tramos, `?tema=coco` va directo al jefe, `?scene=end|over|name|rank|howto`.
