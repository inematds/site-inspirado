#!/usr/bin/env bash
# Gera as imagens de um piloto UMA POR VEZ, cada uma dentro do pesado.sh, com vigia de memória.
# uso: gera-seguro.sh <piloto>   (evento | padaria)
# Regras da retomada 2 (04/11/2026): antes de cada imagem, available >= 30 GB e nenhum render rodando;
# durante, se available < 20 GB, mata e para. Imagem de 0 bytes ou que não abre é refeita.
set -uo pipefail
R=~/projetos/site-inspirado; P=$R/pilotos/$1
PESADO=~/projetos/wifi/retomada-2026-11-04/pesado.sh
livre() { free -g | awk '/Mem:/{print $7}'; }
# render de verdade = o PROGRAMA (ffmpeg, ou node/python/bash rodando um motor de vídeo); não o texto de um prompt
renders() { ps -eo pid=,args= | grep -E '^ *[0-9]+ (\S*/)?(ffmpeg [-]|(node|python3?|bash) \S*(hyperframes|run_lane|build_block|rtex\.py)|npx hyperframes)' | grep -v -e shell-snapshots -e gera-seguro; }
ok_img() { [ -s "$1" ] && python3 -c "from PIL import Image;i=Image.open('$1');i.load()" 2>/dev/null; }

for nome in $(python3 -c "import json;print(' '.join(i['nome'] for i in json.load(open('$P/plano.json'))))"); do
  alvo=$P/img/$nome.jpg
  if ok_img "$alvo"; then echo "já existe: $nome"; continue; fi
  rm -f "$alvo"
  while [ -n "$(renders)" ] || [ "$(livre)" -lt 30 ]; do
    echo "$(date +%T) esperando: livre $(livre) GB / render: $(renders | head -1 | cut -c1-80)"; sleep 30
  done
  echo "$(date +%T) gerando $nome (livre $(livre) GB)"
  bash "$PESADO" python3 $R/skill/site-inspirado/scripts/imagens.py "$P/plano.json" "$P/estilo.json" "$P/img" --refs "$P/refs" --so "$nome" &
  pid=$!
  while kill -0 $pid 2>/dev/null; do
    if [ "$(livre)" -lt 20 ]; then
      echo "PAROU: memória livre $(livre) GB < 20 durante $nome"; pkill -P $pid; kill $pid; rm -f "$alvo"; exit 3
    fi
    sleep 2
  done
  wait $pid
  if ok_img "$alvo"; then echo "ok: $nome $(stat -c%s "$alvo") bytes"; else echo "FALHOU: $nome"; rm -f "$alvo"; exit 4; fi
done
echo "piloto $1 completo"
