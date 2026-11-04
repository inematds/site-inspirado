# site-inspirado

**Site que não tem cara de "feito por IA".** Você entrega 2 a 5 imagens de referência (Pinterest, o
convite que já imprimiu, a foto da loja). A IA pergunta e pesquisa antes de gerar. Todas as imagens
saem no mesmo estilo das referências, a página ganha transições em código, e um portão confere se o
visitante ainda acha o botão antes de publicar.

[Guia completo](https://inematds.github.io/site-inspirado/guia/) · English: [README.en.md](README.en.md) · Español: [README.es.md](README.es.md)

Pilotos no ar:
- **Evento** (visual, casamento fictício em aquarela): https://inematds.github.io/site-inspirado/pilotos/evento/
- **Padaria** (negócio, botão de encomenda na 1ª tela): https://inematds.github.io/site-inspirado/pilotos/padaria/

## O que tem aqui

| Peça | Arquivo | Faz |
|---|---|---|
| Skill | `skill/site-inspirado/SKILL.md` | os 6 passos, com portão em cada um |
| Perguntas | `skill/site-inspirado/referencias/perguntas.md` | o que perguntar antes de gerar, por tipo de site |
| Estilo medido | `skill/site-inspirado/scripts/estilo.py` | referências → paleta medida, papéis sugeridos com contraste, prompt de estilo |
| Imagens | `skill/site-inspirado/scripts/imagens.py` | gera no mesmo estilo pelo Codex (image_gen, assinatura, referências anexadas), uma por vez; folha de contato |
| Movimento | `skill/site-inspirado/runtime/movimento.js` | revelar na rolagem, parallax, véu de abertura, contagem; para tudo com "reduzir movimento" |
| Portão | `skill/site-inspirado/scripts/portao.js` | visual × conversão: CTA, erros, peso, celular, reduzir movimento |
| Medida | `skill/site-inspirado/referencias/visual-x-conversao.md` | quanto movimento usar em site de negócio e em site visual |

## O processo, do início ao fim (8 passos)

🧠 = sessão com a pessoa (gasta tokens) · ⚙️ = script (zero token) · 🤖 = `claude -p` curto

| # | Passo | Comando / o que acontece | Quem |
|---|---|---|---|
| 1 | Referências | 2 a 5 imagens em `T/refs/` (Pinterest, convite, foto da loja) | pessoa |
| 2 | Perguntas e pesquisa | a IA faz as perguntas de `perguntas.md`, pesquisa o que é fato e escreve `T/BRIEF.md` com o tipo (`negocio` ou `visual`) | 🧠 |
| 3 | Estilo | `python3 scripts/estilo.py T/refs T/estilo.json --prompt "<estilo>"` | ⚙️ + 🧠 (o prompt) |
| 4 | Plano das imagens | `T/plano.json`: uma linha por imagem (assunto, tamanho) | 🧠 |
| 5 | Gerar | `python3 scripts/imagens.py T/plano.json T/estilo.json T/img --refs T/refs` e olhar `T/img/folha.jpg` | ⚙️ |
| 6 | Página | `T/index.html` desenhado para o assunto, `data-cta` no botão, `movimento.js` | 🧠 |
| 7 | Portão | `node scripts/portao.js T/index.html --tipo negocio --fotos T/fotos` → `PASSA` | ⚙️ |
| 8 | Publicar | commit + push (GitHub Pages) ou o deploy do cliente | 🧠 |

Testes do kit: `bash tests/rodar.sh` (estilo, portão nos dois pilotos e uma página ruim que tem de ser barrada).

## Instalar a skill

```bash
ln -s "$PWD/skill/site-inspirado" ~/.claude/skills/site-inspirado
cd skill/site-inspirado/scripts && npm install && npx playwright install chromium   # só o portão precisa
```

Imagens: Codex CLI logado na assinatura (`codex exec` com `image_gen`). Reserva: `--motor local` usa um servidor
flux2-klein em `$IMG_API` (padrão `http://localhost:8000`) — pesado, travou a máquina em 01/11 e 04/11/2026. Vídeo animado a partir das imagens (Kling, Magnific e similares) é opcional e só com
autorização para aquele serviço; sem ele, todo o movimento é código.

## Diferença para outros kits INEMA

- **site-movimento**: o topo vira um filme contínuo que anda com a rolagem.
- **filmarca**: transforma um site existente em filme da marca.
- **site-inspirado**: referência → estilo medido → imagens próprias → página com o botão à vista.

Licença MIT.
