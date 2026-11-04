#!/usr/bin/env python3
"""Referências → estilo.json (paleta medida + papéis sugeridos + prompt de estilo).

Uso: estilo.py <pasta-refs> <saida.json> [--prompt "aquarela suave, papel texturizado..."] [--cores 8]

A paleta é MEDIDA nas imagens (quantização de cor), não inventada. Os papéis (fundo, tinta,
acento) são sugestões com o contraste calculado: quem decide é você, olhando as referências.
O prompt de estilo é escrito por você (o modelo vê as imagens) e vai em TODA imagem gerada.
"""
import argparse, colorsys, glob, json, os, sys
from PIL import Image

ap = argparse.ArgumentParser()
ap.add_argument('refs'); ap.add_argument('saida')
ap.add_argument('--prompt', default='')
ap.add_argument('--cores', type=int, default=12)
a = ap.parse_args()

arqs = sorted(f for f in glob.glob(os.path.join(a.refs, '*'))
              if f.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')))
if not arqs:
    sys.exit(f'nenhuma imagem em {a.refs}')

# junta as referências numa tira pequena e quantiza tudo junto (mesmo peso por imagem)
tiras = [Image.open(f).convert('RGB').resize((160, 160)) for f in arqs]
tela = Image.new('RGB', (160 * len(tiras), 160))
for i, t in enumerate(tiras):
    tela.paste(t, (160 * i, 0))
q = tela.quantize(colors=a.cores, method=Image.Quantize.MEDIANCUT)
pal = q.getpalette()[:a.cores * 3]
contagem = sorted(q.getcolors(), reverse=True)
total = sum(n for n, _ in contagem)


def hexa(rgb): return '#%02x%02x%02x' % tuple(rgb)


def lum(rgb):
    def c(v):
        v /= 255
        return v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4
    r, g, b = rgb
    return 0.2126 * c(r) + 0.7152 * c(g) + 0.0722 * c(b)


def contraste(x, y):
    l1, l2 = sorted((lum(x), lum(y)), reverse=True)
    return round((l1 + 0.05) / (l2 + 0.05), 2)


cores = []
for n, idx in contagem:
    rgb = pal[idx * 3:idx * 3 + 3]
    h, l, s = colorsys.rgb_to_hls(*(v / 255 for v in rgb))
    cores.append({'hex': hexa(rgb), 'rgb': rgb, 'peso': round(n / total, 3),
                  'luz': round(l, 2), 'saturacao': round(s, 2)})

# fundo = a cor mais presente entre as bem claras ou bem escuras (papel ou noite)
extremos = [c for c in cores if c['luz'] >= 0.85 or c['luz'] <= 0.15]
fundo = max(extremos, key=lambda c: c['peso']) if extremos else cores[0]
tinta = max(cores, key=lambda c: contraste(c['rgb'], fundo['rgb']))
# acento = a cor mais viva (croma = maior canal - menor canal), fora fundo e tinta
acento = max((c for c in cores if c is not fundo and c is not tinta),
             key=lambda c: max(c['rgb']) - min(c['rgb']), default=tinta)

saida = {
    'referencias': [os.path.basename(f) for f in arqs],
    'paleta': [{k: v for k, v in c.items() if k != 'rgb'} for c in cores],
    'papeis_sugeridos': {
        'fundo': fundo['hex'], 'tinta': tinta['hex'], 'acento': acento['hex'],
        'contraste_tinta_fundo': contraste(tinta['rgb'], fundo['rgb']),
        'contraste_acento_fundo': contraste(acento['rgb'], fundo['rgb']),
        'aviso': 'texto corrido precisa de contraste >= 4.5; se o acento não chega lá, ele vira só preenchimento (botão com letra da tinta).',
    },
    'prompt_estilo': a.prompt,
}
os.makedirs(os.path.dirname(os.path.abspath(a.saida)) or '.', exist_ok=True)
json.dump(saida, open(a.saida, 'w'), ensure_ascii=False, indent=2)
print(f"{a.saida}: {len(cores)} cores · fundo {fundo['hex']} · tinta {tinta['hex']} "
      f"({saida['papeis_sugeridos']['contraste_tinta_fundo']}:1) · acento {acento['hex']}")
if not a.prompt:
    print('falta o prompt de estilo: rode de novo com --prompt "..." depois de olhar as referências')
