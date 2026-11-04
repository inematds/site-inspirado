# site-inspirado

**Un sitio que no parece “hecho por IA”.** Entregas de 2 a 5 imágenes de referencia (de Pinterest, la invitación que ya imprimiste o una foto de la tienda). La IA pregunta e investiga antes de generar. Todas las imágenes siguen el mismo estilo de las referencias, la página incorpora transiciones en código y una prueba comprueba si el visitante todavía encuentra el botón antes de publicar.

[Guía completa](https://inematds.github.io/site-inspirado/guia/es/) · Português: [README.md](README.md) · English: [README.en.md](README.en.md)

Pilotos en línea:
- **Evento** (visual, boda ficticia en acuarela): https://inematds.github.io/site-inspirado/pilotos/evento/
- **Panadería** (negocio, botón de pedidos en la primera pantalla): https://inematds.github.io/site-inspirado/pilotos/padaria/

## Qué incluye

| Elemento | Archivo | Función |
|---|---|---|
| Skill | `skill/site-inspirado/SKILL.md` | los 6 pasos, con una prueba en cada uno |
| Preguntas | `skill/site-inspirado/referencias/perguntas.md` | qué preguntar antes de generar, según el tipo de sitio |
| Estilo medido | `skill/site-inspirado/scripts/estilo.py` | referencias → paleta medida, roles sugeridos con contraste, prompt de estilo |
| Imágenes | `skill/site-inspirado/scripts/imagens.py` | genera con el mismo estilo por Codex (image_gen, suscripción, referencias adjuntas), una por vez; hoja de contacto |
| Movimiento | `skill/site-inspirado/runtime/movimento.js` | revelar al desplazarse, parallax, velo de apertura, conteo; se detiene con “reducir movimiento” |
| Prueba | `skill/site-inspirado/scripts/portao.js` | visual × conversión: CTA, errores, peso, celular, reducir movimiento |
| Medida | `skill/site-inspirado/referencias/visual-x-conversao.md` | cuánto movimiento usar en un sitio de negocio y en uno visual |

## El proceso, de principio a fin (8 pasos)

🧠 = sesión con la persona (consume tokens) · ⚙️ = script (cero tokens) · 🤖 = `claude -p` breve

| # | Paso | Comando / qué sucede | Quién |
|---|---|---|---|
| 1 | Referencias | de 2 a 5 imágenes en `T/refs/` (Pinterest, invitación, foto de la tienda) | persona |
| 2 | Preguntas e investigación | la IA hace las preguntas de `perguntas.md`, investiga qué es un hecho y escribe `T/BRIEF.md` con el tipo (`negocio` o `visual`) | 🧠 |
| 3 | Estilo | `python3 scripts/estilo.py T/refs T/estilo.json --prompt "<estilo>"` | ⚙️ + 🧠 (el prompt) |
| 4 | Plan de imágenes | `T/plano.json`: una línea por imagen (tema, tamaño) | 🧠 |
| 5 | Generar | `python3 scripts/imagens.py T/plano.json T/estilo.json T/img --refs T/refs` y revisar `T/img/folha.jpg` | ⚙️ |
| 6 | Página | `T/index.html` diseñado para el tema, `data-cta` en el botón, `movimento.js` | 🧠 |
| 7 | Prueba | `node scripts/portao.js T/index.html --tipo negocio --fotos T/fotos` → `PASSA` | ⚙️ |
| 8 | Publicar | commit + push (GitHub Pages) o el despliegue del cliente | 🧠 |

Pruebas del kit: `bash tests/rodar.sh` (estilo, prueba en los dos pilotos y una página defectuosa que debe bloquearse).

## Instalar la skill

```bash
ln -s "$PWD/skill/site-inspirado" ~/.claude/skills/site-inspirado
cd skill/site-inspirado/scripts && npm install && npx playwright install chromium   # solo la prueba lo necesita
```

Imágenes: Codex CLI con la suscripción (`codex exec` con `image_gen`). Alternativa: `--motor local` usa un servidor
flux2-klein en `$IMG_API` (predeterminado `http://localhost:8000`) — pesado para la máquina. El video animado a partir de las imágenes (Kling, Magnific y similares) es opcional y requiere
autorización para ese servicio; sin él, todo el movimiento se hace con código.

## Diferencias con otros kits de INEMA

- **site-movimento**: la parte superior se convierte en una película continua que avanza al desplazarse.
- **filmarca**: transforma un sitio existente en una película de marca.
- **site-inspirado**: referencia → estilo medido → imágenes propias → página con el botón a la vista.

Licencia MIT.