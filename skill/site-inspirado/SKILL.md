---
name: site-inspirado
description: >-
  Site que não tem cara de "feito por IA": imagens de referência (Pinterest, fotos do cliente, um convite
  já impresso) viram um estilo medido (paleta + prompt de estilo), a IA PERGUNTA e PESQUISA antes de
  gerar, todas as imagens saem no mesmo estilo (Codex image_gen pela assinatura, com as referências anexadas), a página
  ganha transições em código e passa por um portão "visual × conversão" antes de publicar.
  Gatilhos: "/site-inspirado", "site a partir dessas referências", "site no estilo desta imagem",
  "site do meu casamento/evento", "landing que não pareça IA", "site bonito com imagens próprias".
  NÃO é para: filme na rolagem (site-movimento), filme da marca (filmarca), guia de projeto INEMA
  (projetos-landing-guia).
---

# site-inspirado

O que separa um site comum de um site memorável não é o código, é o **processo**:
referência visual → perguntas → pesquisa → imagens no mesmo estilo → página com movimento →
**conferir se a pessoa ainda acha o botão**.

`S=<pasta desta skill>` · `T=<pasta do site>` (uma por site; use a que a pessoa indicar, ex.: `~/meu-site`; sem indicação, `~/projetos/output/site-inspirado/<slug>`). Trabalhe sempre dentro de `T`.

> O site final NÃO usa o visual INEMA (preto e amarelo). O estilo vem das referências da pessoa.
> O visual INEMA vale só para o guia do kit.

## Os 6 passos (em ordem; cada um tem portão)

| # | Passo | Você produz | Portão |
|---|---|---|---|
| 1 | Referências | `T/refs/` (2 a 5 imagens) | a pessoa confirmou que é esse o clima |
| 2 | Perguntas + pesquisa | `T/BRIEF.md` | todas as perguntas do bloco certo respondidas; nada inventado |
| 3 | Estilo | `T/estilo.json` | paleta medida + `prompt_estilo` escrito olhando as refs; contraste do texto ≥ 4,5 |
| 4 | Imagens | `T/img/*.jpg` + `T/img/folha.jpg` | você OLHOU a folha: mesmo estilo, sem letra desenhada, sem mão torta |
| 5 | Página | `T/index.html` | um `data-cta` no botão principal; transições pelo `movimento.js` |
| 6 | Portão + publicação | relatório do portão, fotos | `portao.js` sai 0; depois publica (GitHub Pages / Vercel do cliente) |

### 1. Referências
Peça 2 a 5 imagens: o que a pessoa já tem (convite, logo, foto da loja) + inspiração (Pinterest:
"site padaria", "wedding website watercolor"). Se ela não tiver, gere 2 pelo Codex (image_gen) e
mostre antes de seguir. Guarde em `T/refs/`.

### 2. Perguntas e pesquisa (antes de gerar QUALQUER coisa)
Diga isto à IA (ou faça você): *"Antes de gerar nada, me pergunte tudo o que precisa e pesquise o que
um site deste tipo costuma ter."* Use o bloco de `referencias/perguntas.md` do tipo do site
(evento, negócio local, serviço/consultoria, portfólio). Pesquise o que é FATO (como chegar,
clima da época, passeios próximos) e marque no BRIEF o que veio da pessoa e o que veio da pesquisa.
Decida o **tipo** do site no BRIEF: `negocio` (o objetivo é uma ação: encomendar, agendar, ligar) ou
`visual` (evento, portfólio, convite: pode ter mais movimento).

### 3. Estilo medido
```bash
python3 $S/scripts/estilo.py T/refs T/estilo.json --prompt "<estilo em inglês, olhando as refs>"
```
O script mede a paleta e sugere fundo/tinta/acento com o contraste calculado. Você decide as cores
finais (escureça a tinta se o contraste ficar < 4,5). O `prompt_estilo` descreve TÉCNICA + LUZ + PALETA
(ex.: "loose watercolor on cotton paper, burgundy, sage and cream, thin gold ink accents").

### 4. Imagens no mesmo estilo
Escreva `T/plano.json` (uma linha por imagem: `nome`, `prompt` do ASSUNTO, `largura`, `altura`) e gere:
```bash
python3 $S/scripts/imagens.py T/plano.json T/estilo.json T/img --refs T/refs
```
Cada imagem recebe as refs + a primeira imagem gerada (âncora) como referência: a série sai com a
mesma mão. Uma por vez; o script espera se a memória livre cair de 30 GB. Abra `T/img/folha.jpg`
e refaça com `--so nome` o que destoar. Pessoas: de costas ou pequenas na paisagem (rosto inventado
de "noivos reais" engana).
Motor de vídeo (clipe animado a partir de uma imagem: Kling, Magnific, etc.) é **opcional** e só com
autorização da pessoa para aquele serviço. Sem ele, o movimento é feito em código (passo 5).

### 5. Página com movimento
Uma página por site, desenhada para o assunto (nunca copie outro piloto). Use:
- `cp $S/runtime/movimento.js T/` e `<script src="movimento.js">` (sempre dentro de `T`, antes do portão): `data-revela`
  (sobe/surge/lado/zoom/cortina), `data-parallax`, `data-intro` (véu ≤ 1,2 s), `data-conta`,
  `data-contagem`. Tudo para quando o sistema pede "reduzir movimento".
- O botão principal leva `data-cta`. Em `negocio`, ele fica na primeira tela, sem animação de entrada,
  e no celular ganha uma barra fixa.
- Imagens com `width`/`height`, `loading="lazy"` abaixo da dobra e `alt` que descreve a cena.

Medida de quanto movimento usar: `referencias/visual-x-conversao.md`.

### 6. Portão e publicação
```bash
node $S/scripts/portao.js T/index.html --tipo negocio|visual --fotos T/fotos
```
Confere, em 1440×900 e 390×844, com e sem "reduzir movimento": CTA (na 1ª tela em 1,5 s se `negocio`),
0 erro de console, 0 arquivo quebrado, sem rolagem lateral, imagens carregadas, nenhuma animação
rodando com "reduzir movimento", peso (negocio < 3 MB, visual < 8 MB). Só publique com `PASSA`.
Primeira vez: `cd $S/scripts && npm install && npx playwright install chromium`.
