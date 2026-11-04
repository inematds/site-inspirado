#!/usr/bin/env bash
# Traduz guia/index.html para en|es pelo tradutor central e corrige os caminhos que a tradução costuma errar.
# uso: traduz-guia.sh en|es
set -uo pipefail
l=$1; R=~/projetos/site-inspirado; L=$R/longrun/2026-11-01-v1; cd "$R"
python3 - "$l" <<'PY'
import sys; l=sys.argv[1]; L='longrun/2026-11-01-v1'
old=open(f'{L}/pedido-{l}.txt').read(); i=old.index('<!DOCTYPE html>')
open(f'{L}/pedido-{l}.txt','w').write(old[:i]+open('guia/index.html').read())
PY
timeout 1200 ~/projetos/wifi/scripts/inema-traduz -o guia/$l/index.html.novo < $L/pedido-$l.txt > $L/traduz3-$l.log 2>&1 || { echo "falhou $l"; exit 1; }
f=guia/$l/index.html.novo
grep -q '</html>' $f || { echo "cortado $l"; exit 1; }
sed -i "s#\.\./assets/banner\.jpg#../assets/banner-$l.jpg#; s#\.\./assets/banner-grade\.jpg#../assets/banner-grade-$l.jpg#; s#href=\"\.\./pilotos/#href=\"../../pilotos/#g" $f
python3 - "$f" "$l" <<'PY2'
import sys,re; f,l=sys.argv[1],sys.argv[2]; s=open(f).read()
# valores do data-revela: o movimento.js só aceita estes
s=re.sub(r'(<span class="c">… )[^<]*(</span>)', r'\1sobe | surge | lado | zoom | cortina\2', s)
# saída do portão: o portao.js imprime em PT
for a,b in [('DOES NOT PASS','NÃO PASSA'),('NO PASA','NÃO PASSA'),('>PASS<','>PASSA<'),('>PASA<','>PASSA<'),('# PASS<','# PASSA<'),('# PASA<','# PASSA<')]:
    s=s.replace(a,b)
# blocos de código com saída da ferramenta ou valores aceitos pelo código: copiados do PT, sem tradução
pt=open('guia/index.html').read()
P=re.findall(r'<pre>.*?</pre>', pt, re.S); T=re.findall(r'<pre>.*?</pre>', s, re.S)
if len(P)==len(T):
    for a,b in zip(P,T):
        if any(m in a for m in ('portão visual','NÃO PASSA','data-revela','CTA na 1ª')): s=s.replace(b,a,1)
else: print('AVISO: número de <pre> diferente', len(P), len(T))
open(f,'w').write(s)
PY2
head -c 15 $f | grep -q DOCTYPE || sed -i '1i <!DOCTYPE html>' $f
mv $f guia/$l/index.html && echo "ok $l"
