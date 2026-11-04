#!/usr/bin/env node
// Portão "visual × conversão": um site bonito que ninguém sabe onde clicar não passa.
//
// Uso: node portao.js <pagina.html> [--tipo negocio|visual] [--fotos pasta]
//
// O botão de ação principal leva o atributo data-cta (ex.: <a data-cta href="#reserva">).
// Confere, em 1440x900 e 390x844:
//   1. existe um [data-cta] visível;
//      negocio: ele aparece na primeira tela em até 1,5 s depois do carregamento (sem esperar intro);
//      visual : basta existir e ficar visível ao rolar até ele (intro longa pode).
//   2. 0 erro de console e 0 arquivo que falhou ao carregar;
//   3. sem rolagem lateral no celular;
//   4. todas as imagens carregam (rola a página inteira por causa do lazy);
//   5. com "reduzir movimento" ligado, nenhuma animação continua rodando e o CTA aparece igual;
//   6. peso total: negocio < 3 MB, visual < 8 MB.
// Sai 0 se tudo passa; 1 se algo falha (com o motivo). Fotos de cada tela em --fotos.
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const os = require('node:os');

function carregarPlaywright() {
  const lugares = [process.env.PLAYWRIGHT_DIR, __dirname,
    path.join(os.homedir(), 'projetos', 'agent-browser'),
    path.join(os.homedir(), 'projetos', 'site-movimento', 'skill', 'site-movimento', 'scripts')].filter(Boolean);
  for (const l of lugares) {
    const p = path.join(l, 'node_modules', 'playwright');
    if (fs.existsSync(p)) return require(p);
  }
  console.error('Playwright não encontrado. Rode uma vez: cd "' + __dirname + '" && npm install && npx playwright install chromium');
  process.exit(2);
}

const args = process.argv.slice(2);
const alvo = args.find(x => !x.startsWith('--'));
const opt = n => { const i = args.indexOf('--' + n); return i >= 0 ? args[i + 1] : null; };
const tipo = opt('tipo') || 'negocio';
const pastaFotos = opt('fotos');
if (!alvo || !fs.existsSync(alvo)) { console.error('uso: node portao.js <pagina.html> [--tipo negocio|visual] [--fotos pasta] [--raiz pasta]'); process.exit(2); }
const LIMITE = tipo === 'visual' ? 8e6 : 3e6;

const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.mp4': 'video/mp4',
  '.webm': 'video/webm', '.woff2': 'font/woff2', '.json': 'application/json', '.ico': 'image/x-icon' };

// serve a partir da raiz do repositório (a página pode usar ../../skill/...); sem .git, a pasta da página
let raiz = path.dirname(path.resolve(alvo));
for (let d = raiz; d !== path.dirname(d); d = path.dirname(d)) if (fs.existsSync(path.join(d, '.git'))) { raiz = d; break; }
if (opt('raiz')) raiz = path.resolve(opt('raiz'));
const caminhoPagina = '/' + path.relative(raiz, path.resolve(alvo)).split(path.sep).join('/');
const servidor = http.createServer((req, res) => {
  const rel = decodeURIComponent(req.url.split('?')[0]);
  const f = path.join(raiz, rel);
  if (!f.startsWith(raiz) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f).toLowerCase()] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});

const TELAS = [{ nome: 'desktop', width: 1440, height: 900 }, { nome: 'celular', width: 390, height: 844 }];

(async () => {
  await new Promise(r => servidor.listen(0, '127.0.0.1', r));
  const url = `http://127.0.0.1:${servidor.address().port}/`;
  const urlPagina = url.replace(/\/$/, '') + caminhoPagina;
  const pw = carregarPlaywright();
  const nav = await pw.chromium.launch();
  const falhas = [];
  const linhas = [];
  let pesoMax = 0;
  if (pastaFotos) fs.mkdirSync(pastaFotos, { recursive: true });

  for (const reduzir of [false, true]) {
    for (const t of TELAS) {
      const rot = `${t.nome}${reduzir ? '+reduzir' : ''}`;
      const ctx = await nav.newContext({ viewport: { width: t.width, height: t.height }, reducedMotion: reduzir ? 'reduce' : 'no-preference', isMobile: t.nome === 'celular', hasTouch: t.nome === 'celular' });
      const pg = await ctx.newPage();
      const erros = []; const quebrados = []; let peso = 0;
      pg.on('console', m => { if (m.type() === 'error') erros.push(m.text().slice(0, 140)); });
      pg.on('pageerror', e => erros.push(String(e).slice(0, 140)));
      pg.on('requestfailed', r => quebrados.push(r.url().replace(url, '')));
      pg.on('response', async r => {
        if (r.status() >= 400) quebrados.push(`${r.status()} ${r.url().replace(url, '')}`);
        try { if (r.url().startsWith(url)) peso += (await r.body()).length; } catch {}
      });
      await pg.goto(urlPagina, { waitUntil: 'load', timeout: 60000 });
      await pg.waitForTimeout(1500);

      // 1. CTA na primeira tela (negocio) / existente (visual)
      const cta = await pg.evaluate(() => {
        const vis = el => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el);
          let o = 1; for (let e = el; e; e = e.parentElement) o *= parseFloat(getComputedStyle(e).opacity);
          return { topo: Math.round(r.top), alt: Math.round(r.height), larg: Math.round(r.width), opac: +o.toFixed(2),
            dentro: r.top >= 0 && r.bottom <= innerHeight && r.width > 40 && r.height > 24 && s.visibility !== 'hidden' && o > 0.9,
            texto: (el.innerText || '').trim().slice(0, 40) }; };
        const els = [...document.querySelectorAll('[data-cta]')];
        return { n: els.length, lista: els.map(vis) };
      });
      const naDobra = cta.lista.some(c => c.dentro);
      if (!cta.n) falhas.push(`${rot}: nenhum [data-cta] na página`);
      else if (tipo === 'negocio' && !naDobra) falhas.push(`${rot}: CTA fora da primeira tela em 1,5 s (${JSON.stringify(cta.lista[0])})`);
      if (pastaFotos) await pg.screenshot({ path: path.join(pastaFotos, `${rot}-dobra.png`) });

      // 3. rolagem lateral
      const lateral = await pg.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      if (lateral > 1) falhas.push(`${rot}: rolagem lateral de ${lateral}px`);

      // 4. rola tudo (lazy) e confere imagens; no visual, o CTA tem de ficar visível em algum ponto
      const vistoAoRolar = await pg.evaluate(async () => {
        let visto = false;
        for (let y = 0; y <= document.documentElement.scrollHeight; y += Math.round(innerHeight * 0.6)) {
          scrollTo(0, y); await new Promise(r => setTimeout(r, 180));
          for (const el of document.querySelectorAll('[data-cta]')) { const r = el.getBoundingClientRect();
            if (r.top >= 0 && r.bottom <= innerHeight && parseFloat(getComputedStyle(el).opacity) > 0.9) visto = true; }
        }
        scrollTo(0, document.documentElement.scrollHeight); await new Promise(r => setTimeout(r, 600));
        return visto;
      });
      if (cta.n && !vistoAoRolar && !naDobra) falhas.push(`${rot}: o CTA nunca fica visível rolando a página`);
      await pg.evaluate(async () => { await Promise.all([...document.images].map(i => i.decode ? i.decode().catch(() => {}) : 0)); });
      const imgRuins = await pg.evaluate(() => [...document.images].filter(i => !(i.complete && i.naturalWidth > 0)).map(i => i.getAttribute('src')));
      if (imgRuins.length) falhas.push(`${rot}: ${imgRuins.length} imagem(ns) não carregou: ${imgRuins.slice(0, 3).join(', ')}`);
      if (pastaFotos && t.nome === 'desktop' && !reduzir) await pg.screenshot({ path: path.join(pastaFotos, `inteira.png`), fullPage: true });

      // 5. reduzir movimento: nada animando sem parar
      if (reduzir) {
        await pg.evaluate(() => scrollTo(0, 0)); await pg.waitForTimeout(800);
        const rodando = await pg.evaluate(() => document.getAnimations().filter(a => a.playState === 'running').map(a => {
          const t = a.effect && a.effect.getTiming ? a.effect.getTiming() : {}; return { iter: t.iterations, dur: t.duration, alvo: a.effect && a.effect.target ? (a.effect.target.className || a.effect.target.tagName) : '?' }; })
          .filter(a => a.iter === Infinity || (typeof a.dur === 'number' && a.dur > 400)));
        const videosTocando = await pg.evaluate(() => [...document.querySelectorAll('video')].filter(v => !v.paused).length);
        if (rodando.length) falhas.push(`${rot}: ${rodando.length} animação(ões) rodando com "reduzir movimento" (${JSON.stringify(rodando[0])})`);
        if (videosTocando) falhas.push(`${rot}: ${videosTocando} vídeo(s) tocando com "reduzir movimento"`);
      }

      if (erros.length) falhas.push(`${rot}: ${erros.length} erro(s) de console: ${erros[0]}`);
      if (quebrados.length) falhas.push(`${rot}: ${quebrados.length} arquivo(s) quebrado(s): ${quebrados.slice(0, 3).join(', ')}`);
      pesoMax = Math.max(pesoMax, peso);
      linhas.push(`${rot.padEnd(16)} CTA na 1ª tela: ${naDobra ? 'sim' : 'não'} · CTAs: ${cta.n} · peso ${(peso / 1e6).toFixed(2)} MB · erros ${erros.length}`);
      await ctx.close();
    }
  }
  if (pesoMax > LIMITE) falhas.push(`peso ${(pesoMax / 1e6).toFixed(2)} MB passa do limite de ${LIMITE / 1e6} MB para "${tipo}"`);
  await nav.close(); servidor.close();

  console.log(`portão visual × conversão — ${path.basename(path.dirname(path.resolve(alvo)))} (${tipo})`);
  for (const l of linhas) console.log('  ' + l);
  if (falhas.length) { console.log('NÃO PASSA:'); for (const f of falhas) console.log('  - ' + f); process.exit(1); }
  console.log('PASSA'); process.exit(0);
})().catch(e => { console.error(e); servidor.close(); process.exit(2); });
