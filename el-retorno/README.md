# El Retorno

Juego roguelike en pixel art: ayuda a Nico a volver a casa una noche en la que la ciudad se ha vuelto loca.
Cada noche se genera un mapa distinto de calles con minijuegos, tienda, fuentes y eventos, y al final te espera El Coco en tu portal.

HTML5 + JavaScript sin dependencias ni paso de compilación. Funciona con teclado y en el móvil (cruceta táctil).

## Minijuegos

| Prueba | Mecánica |
| --- | --- |
| Zombis en la plaza | Aguanta y corre a la salida (esquiva y lanza la chancla) |
| El vampiro del callejón | Quédate bajo la luz de los faroles; salta murciélagos |
| Un volcán en la avenida | Esquiva las bombas de lava mirando las sombras |
| El encierro fantasma | Cruza la avenida entre toros, taxis y el búho fantasma |
| La meiga de la encrucijada | Memoriza y repite el conjuro de runas |
| Fantasmas en las ventanas | Deslumbra fantasmas, nunca a las abuelas |
| La tuna zombi | Juego de ritmo con flechas |
| La Santa Compaña | Laberinto con niebla y una procesión que sigue tus pasos |
| Huida por los tejados | Carrera automática perseguido por el lobishome |
| El Coco (jefe final) | Esquiva sombras y lánzale chanclas |

## Puntuación y ranking

Los puntos suben con cada prueba, moneda, bicho derrotado y al llegar a casa (vida, euros y puntualidad).
Al acabar la noche escribes tu nombre y se guarda:

- **Este dispositivo**: siempre, en `localStorage`.
- **Mundial**: si el proyecto de Vercel tiene una base de datos Redis (Upstash) conectada.
  La función `api/scores.js` usa las variables `KV_REST_API_URL` / `KV_REST_API_TOKEN`
  (o `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`). Sin ellas, el juego funciona igual con el ranking local.

## Publicar en Vercel (elretorno.vercel.app)

1. En Vercel: **Add New… → Project** e importa este repositorio.
2. **Project Name**: `elretorno` (así la URL será `elretorno.vercel.app` si el nombre está libre).
3. **Root Directory**: `el-retorno`. Framework: *Other*. Sin comando de build.
4. Deploy.
5. (Opcional, ranking mundial) En el proyecto: **Storage → Create / Connect Database → Upstash for Redis**, conéctala al proyecto y vuelve a desplegar.

## Probar en local

```sh
cd el-retorno
python3 -m http.server 8000
# abre http://localhost:8000
```

Atajos de prueba: `?game=zombis&d=0.5` abre un minijuego directamente (`d` = dificultad 0–1), `?scene=map|shop|rest|event|end|over|name|rank`.

## Controles

- Flechas / WASD: mover
- Espacio / Z / Enter: A
- X / Shift: B
- P / Esc: pausa · M: sonido
