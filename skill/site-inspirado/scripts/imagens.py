#!/usr/bin/env python3
"""Gera as imagens do site no MESMO estilo das referências — pelo Codex (image_gen, assinatura).

Uso: imagens.py <plano.json> <estilo.json> <pasta-saida> [--refs pasta] [--so nome1,nome2] [--motor codex|local]

plano.json = [{"nome": "hero", "prompt": "o castelo ao entardecer", "largura": 1536, "altura": 864}, ...]
Cada imagem recebe: prompt do item + prompt_estilo do estilo.json + "no text, no letters".
Referências de estilo: até 2 imagens de --refs + a primeira imagem gerada (âncora), para que
a série inteira saia com a mesma mão. As referências vão anexadas ao pedido (codex exec -i).
Motor padrão: codex (não pesa na máquina). --motor local = servidor flux2-klein em $IMG_API
(padrão http://localhost:8000), só como reserva: ele travou a máquina 3× (01/11 e 04/11/2026).
Saída: <nome>.jpg (qualidade 82, para a web) + folha.jpg (todas lado a lado, para você olhar).
"""
import argparse, base64, glob, io, json, os, shutil, subprocess, sys, time, urllib.request
from pathlib import Path
from PIL import Image

ap = argparse.ArgumentParser()
ap.add_argument('plano'); ap.add_argument('estilo'); ap.add_argument('saida')
ap.add_argument('--refs'); ap.add_argument('--so', default='')
ap.add_argument('--seed', type=int, default=7)
ap.add_argument('--motor', choices=['codex', 'local'], default=os.environ.get('IMG_MOTOR', 'codex'))
ap.add_argument('--sem-ancora', action='store_true', help='não usa a 1ª imagem gerada como referência')
a = ap.parse_args()

API = os.environ.get('IMG_API', 'http://localhost:8000')
MODELO = os.environ.get('IMG_MODELO', 'flux2-klein')
plano = json.load(open(a.plano))
estilo = json.load(open(a.estilo))
pe = estilo.get('prompt_estilo', '').strip()
if not pe:
    sys.exit('estilo.json sem prompt_estilo: escreva o estilo antes de gerar (estilo.py --prompt)')
os.makedirs(a.saida, exist_ok=True)

refs = []
if a.refs:
    refs = sorted(f for f in glob.glob(os.path.join(a.refs, '*'))
                  if f.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')))[:2]
so = set(filter(None, a.so.split(',')))


def b64(caminho):
    im = Image.open(caminho).convert('RGB')
    im.thumbnail((1024, 1024))
    buf = io.BytesIO(); im.save(buf, 'JPEG', quality=90)
    return base64.b64encode(buf.getvalue()).decode()


def achar(o):
    if isinstance(o, str) and len(o) > 1000:
        return o.split(',', 1)[-1]
    if isinstance(o, dict):
        for v in o.values():
            r = achar(v)
            if r: return r
    if isinstance(o, list):
        for v in o:
            r = achar(v)
            if r: return r


MIN_GB = float(os.environ.get('MEM_MIN_GB', '30'))


def memoria_livre_gb():
    for linha in open('/proc/meminfo'):
        if linha.startswith('MemAvailable:'):
            return int(linha.split()[1]) / 1048576
    return 999.0


def esperar_memoria():
    # trava: a máquina já caiu (01/11/2026) com o servidor de imagem + renders juntos
    espera = 0
    while memoria_livre_gb() < MIN_GB:
        if espera == 0:
            print(f'memória livre {memoria_livre_gb():.0f} GB < {MIN_GB:.0f} GB: esperando...', flush=True)
        time.sleep(20); espera += 20
        if espera >= 1800:
            sys.exit('memória não liberou em 30 min; parei sem gerar')


def formato(w, h):
    r = w / h
    if r > 1.15: return 'PAISAGEM (horizontal, 3:2)'
    if r < 0.87: return 'RETRATO (vertical, 2:3)'
    return 'QUADRADO (1:1)'


def ajustar(im, w, h):
    # corta pelo centro para a proporção pedida e redimensiona para o tamanho exato do plano
    iw, ih = im.size
    if iw / ih > w / h:
        nw = round(ih * w / h); im = im.crop(((iw - nw) // 2, 0, (iw - nw) // 2 + nw, ih))
    else:
        nh = round(iw * h / w); im = im.crop((0, (ih - nh) // 2, iw, (ih - nh) // 2 + nh))
    return im.resize((w, h), Image.LANCZOS)


def gerar_codex(item, refs_usadas):
    w, h = item.get('largura', 1536), item.get('altura', 864)
    pasta = Path(a.saida) / '.codex' / item['nome']
    if pasta.exists(): shutil.rmtree(pasta)
    pasta.mkdir(parents=True)
    alvo = pasta / f"{item['nome']}.png"
    pedido = f"""Gere UMA imagem com a ferramenta de geração de imagem (image_gen) e salve nesta pasta como {alvo.name}, formato {formato(w, h)}, o maior tamanho disponível nessa proporção.

As imagens anexadas são REFERÊNCIAS DE ESTILO: copie a paleta, a luz, a textura e o tipo de traço/fotografia delas, para a imagem nova parecer da mesma série. Não copie o conteúdo nem a composição delas.
Cena: {item['prompt']}.
Estilo: {pe}.
Sem nenhum texto, letra, palavra, logotipo ou marca d'água na imagem. Pessoas de costas ou de longe, sem rosto em close.
Não mexa em nenhum outro arquivo. Ao final, diga o nome do arquivo salvo."""
    (pasta / 'pedido.txt').write_text(pedido)
    env = dict(os.environ)
    env['PATH'] = f"{Path.home()}/.npm-global/bin:" + env.get('PATH', '')  # CLI novo antes do antigo em /usr/bin
    cmd = ['codex', 'exec', '--skip-git-repo-check', '--dangerously-bypass-approvals-and-sandbox']
    for r in refs_usadas:
        cmd += ['-i', str(Path(r).resolve())]
    cmd += ['--', '-']
    with open(pasta / 'codex.log', 'w') as lg:
        subprocess.run(cmd, input=pedido, text=True, cwd=pasta, stdout=lg, stderr=subprocess.STDOUT,
                       timeout=1500, env=env)
    gerada = alvo if alvo.exists() else None
    if not gerada:
        cands = sorted((p for p in pasta.glob('*') if p.suffix.lower() in ('.png', '.jpg', '.jpeg', '.webp')),
                       key=lambda p: p.stat().st_mtime)
        gerada = cands[-1] if cands else None
    if not gerada or gerada.stat().st_size == 0:
        raise RuntimeError(f"Codex não gerou {item['nome']} (veja {pasta / 'codex.log'})")
    return ajustar(Image.open(gerada).convert('RGB'), w, h)


def gerar(item, refs_usadas):
    if a.motor == 'codex':
        for tentativa in (1, 2):
            try:
                return gerar_codex(item, refs_usadas)
            except (RuntimeError, subprocess.TimeoutExpired) as e:
                print(f"{item['nome']}: tentativa {tentativa} falhou: {e}", flush=True)
        raise RuntimeError(f"Codex falhou 2× em {item['nome']}")
    esperar_memoria()
    prompt = f"{item['prompt']}. Style: {pe}. No text, no letters, no words, no watermark."
    corpo = {'model': MODELO, 'prompt': prompt, 'seed': a.seed,
             'width': item.get('largura', 1536), 'height': item.get('altura', 864)}
    if refs_usadas:
        corpo['images'] = [b64(r) for r in refs_usadas]
    req = urllib.request.Request(f'{API}/generate', data=json.dumps(corpo).encode(),
                                 headers={'Content-Type': 'application/json'})
    resp = json.load(urllib.request.urlopen(req, timeout=900))
    dado = achar(resp)
    if not dado:
        raise RuntimeError(f'resposta sem imagem: {json.dumps(resp)[:200]}')
    return Image.open(io.BytesIO(base64.b64decode(dado))).convert('RGB')


ancora = None
feitas = []
for item in plano:
    destino = os.path.join(a.saida, item['nome'] + '.jpg')
    if so and item['nome'] not in so:
        if os.path.exists(destino): feitas.append(destino)
        if ancora is None and os.path.exists(destino) and not a.sem_ancora: ancora = destino
        continue
    usadas = refs + ([ancora] if ancora else [])
    t0 = time.time()
    im = gerar(item, usadas)
    tmp = destino + '.tmp'
    im.save(tmp, 'JPEG', quality=82, optimize=True, progressive=True)
    Image.open(tmp).verify()  # nunca deixar .jpg de 0 bytes ou cortado no lugar do bom
    os.replace(tmp, destino)
    feitas.append(destino)
    if ancora is None and not a.sem_ancora:
        ancora = destino
    print(f'{destino} {im.size[0]}x{im.size[1]} {os.path.getsize(destino)//1024} KB '
          f'({time.time()-t0:.0f}s, refs={len(usadas)}, {a.motor})', flush=True)

# folha de contato: você OLHA antes de usar (texto desenhado, mãos, estilo fora da série)
if feitas:
    miniaturas = [Image.open(f).convert('RGB') for f in feitas]
    for m in miniaturas: m.thumbnail((480, 300))
    cols = 3; lin = (len(miniaturas) + cols - 1) // cols
    folha = Image.new('RGB', (cols * 490, lin * 310), 'white')
    for i, m in enumerate(miniaturas):
        folha.paste(m, ((i % cols) * 490 + 5, (i // cols) * 310 + 5))
    folha.save(os.path.join(a.saida, 'folha.jpg'), quality=80)
    print(f"folha: {os.path.join(a.saida, 'folha.jpg')} ({len(feitas)} imagens)")
