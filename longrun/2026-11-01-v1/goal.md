# Objetivo — site-inspirado v1 (01/11/2026)

Kit + skill: referências visuais + briefing com perguntas → estilo único → imagens no mesmo estilo
(flux2-klein local com `--ref`, sem custo) → site com transições em código → portão "visual × conversão"
→ GitHub Pages. Dois pilotos: evento (visual) e padaria (negócio). Guia PT/EN/ES + portal.

Restrições: sem API paga (Kling/Magnific não autorizados → vídeo de IA só como motor opcional);
sem citar a fonte; pilotos NÃO usam o visual INEMA (estilo vem das referências); autor inematds.

## Pronto quando (comando → saída esperada)

1. `python3 skill/site-inspirado/scripts/estilo.py pilotos/padaria/refs pilotos/padaria/estilo.json` → JSON com ≥5 cores hex e `prompt_estilo` não vazio.
2. `node skill/site-inspirado/scripts/portao.js pilotos/padaria/index.html --tipo negocio` → sai 0; relatório mostra CTA visível em 1440×900 e 390×844, 0 erro de console, reduced-motion respeitado, peso < 3 MB.
3. Idem `pilotos/evento/index.html --tipo visual` → sai 0 (CTA pode ficar abaixo da dobra, peso < 8 MB).
4. Regressão do portão: `node .../portao.js tests/ruim.html --tipo negocio` → sai ≠ 0 (página sem CTA na dobra é barrada).
5. `bash tests/rodar.sh` → "OK" (1–4 juntos).
6. `curl -s -o /dev/null -w '%{http_code}'` em `https://inematds.github.io/site-inspirado/guia/`, `/guia/en/`, `/guia/es/`, `/pilotos/padaria/`, `/pilotos/evento/` → 200 cada.
7. `grep -rniE "skool|ia-masters|topview|aparicio" --exclude-dir=longrun .` → nada.
8. Revisor independente registrado no `revisor-nota.py` e card no portal (commit no portal).
