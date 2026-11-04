# CLAUDE.md — site-inspirado

- Repo `inematds/site-inspirado` (autor inematds). Guia em `guia/` (PT + `guia/en/` + `guia/es/`), Pages da raiz.
- Os pilotos NÃO usam o visual INEMA: o estilo vem das referências. INEMA só no guia.
- Não citar a fonte de onde a ideia veio (sem link, autor, comunidade ou aula).
- Imagem: pelo Codex (`imagens.py`, motor padrão `codex`). O servidor local (inemaimg, `--motor local`) travou a máquina 3× (01/11 e 04/11/2026): só como reserva, e com o Nei sabendo.
- Antes de commitar mudança no portão ou nos pilotos: `bash tests/rodar.sh` → OK.
- Mudou o fluxo? Atualizar "O processo, do início ao fim" no README no mesmo commit.

## Self-learning

Quando eu corrigir você, ou você perceber um erro seu: antes de seguir, escreva a lição numa linha no TOPO da seção Lessons abaixo.

## Lessons
- Filtro de "tem render rodando?" com `pgrep -f` casa com o texto do prompt da própria sessão; olhar o programa (`ps -eo args` com o executável no começo). (04/11/2026)
