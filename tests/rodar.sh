#!/usr/bin/env bash
# Testes do kit: estilo medido, portão nos dois pilotos e regressão (página ruim tem de ser barrada).
set -uo pipefail
cd "$(dirname "$0")/.."
S=skill/site-inspirado/scripts
falhou=0
passo() { echo "== $1"; }

passo "estilo.py mede a paleta"
python3 $S/estilo.py pilotos/padaria/refs /tmp/si-estilo.json --prompt "teste" >/dev/null
python3 -c "import json;e=json.load(open('/tmp/si-estilo.json'));assert len(e['paleta'])>=5 and e['prompt_estilo'];print('ok', len(e['paleta']), 'cores')" || falhou=1

passo "portão: padaria (negocio) passa"
node $S/portao.js pilotos/padaria/index.html --tipo negocio || falhou=1

passo "portão: evento (visual) passa"
node $S/portao.js pilotos/evento/index.html --tipo visual || falhou=1

passo "regressão: página com CTA fora da dobra e animação infinita é barrada"
if node $S/portao.js tests/ruim.html --tipo negocio >/tmp/si-ruim.txt 2>&1; then
  echo "ERRO: a página ruim passou"; falhou=1
else
  grep -q "fora da primeira tela" /tmp/si-ruim.txt && grep -q "reduzir movimento" /tmp/si-ruim.txt && echo "ok: barrada pelos dois motivos" || { cat /tmp/si-ruim.txt; falhou=1; }
fi

[ $falhou = 0 ] && echo OK || { echo FALHOU; exit 1; }
