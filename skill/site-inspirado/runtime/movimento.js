/* movimento.js — transições do site-inspirado, sem dependência (≈3 KB).
 *
 * Atributos:
 *   data-revela="sobe|surge|lado|zoom|cortina"  entra quando aparece na tela (atraso: data-atraso="150")
 *   data-parallax="0.15"                         anda mais devagar que a rolagem (imagem de fundo)
 *   data-intro                                    véu de abertura que some sozinho (máx. 1,2 s)
 *   data-conta="2027"                             número que conta até o valor quando aparece
 *   data-contagem="2027-07-17T16:00:00"           dias/horas até a data
 * Com "reduzir movimento" ligado no sistema, tudo aparece pronto e nada anda.
 * O CSS mínimo vem junto (injetado) para a página não precisar lembrar de nada.
 */
(function () {
  var reduzir = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var css = '' +
    '[data-revela]{transition:opacity .9s cubic-bezier(.2,.7,.2,1),transform .9s cubic-bezier(.2,.7,.2,1),clip-path 1.1s cubic-bezier(.7,0,.2,1)}' +
    '.mv-pronto [data-revela]:not(.mv-in){opacity:0}' +
    '.mv-pronto [data-revela="sobe"]:not(.mv-in){transform:translateY(42px)}' +
    '.mv-pronto [data-revela="lado"]:not(.mv-in){transform:translateX(-48px)}' +
    '.mv-pronto [data-revela="zoom"]:not(.mv-in){transform:scale(1.08)}' +
    '.mv-pronto [data-revela="cortina"]:not(.mv-in){opacity:1;clip-path:inset(0 0 100% 0)}' +
    '[data-revela="cortina"].mv-in{clip-path:inset(0 0 0 0)}' +
    '[data-intro]{position:fixed;inset:0;z-index:999;transition:opacity .6s ease,visibility .6s}' +
    '[data-intro].mv-fora{opacity:0;visibility:hidden;pointer-events:none}' +
    '@media (prefers-reduced-motion:reduce){[data-revela]{transition:none!important;opacity:1!important;transform:none!important;clip-path:none!important}[data-intro]{display:none!important}*{animation:none!important;scroll-behavior:auto!important}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  function pronto(fn) { document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', fn) : fn(); }

  pronto(function () {
    var intro = document.querySelector('[data-intro]');
    if (intro) {
      var fechar = function () { intro.classList.add('mv-fora'); };
      if (reduzir) fechar(); else setTimeout(fechar, Math.min(+intro.getAttribute('data-intro') || 900, 1200));
      intro.addEventListener('click', fechar);
    }
    var els = [].slice.call(document.querySelectorAll('[data-revela]'));
    if (reduzir || !('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('mv-in'); }); }
    else {
      document.documentElement.classList.add('mv-pronto');
      var io = new IntersectionObserver(function (ents) {
        ents.forEach(function (en) {
          if (!en.isIntersecting) return;
          var el = en.target; setTimeout(function () { el.classList.add('mv-in'); }, +el.getAttribute('data-atraso') || 0);
          io.unobserve(el);
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
      els.forEach(function (e) {
        var r = e.getBoundingClientRect();
        if (r.top < innerHeight && r.bottom > 0 && e.hasAttribute('data-ja')) e.classList.add('mv-in'); else io.observe(e);
      });
    }

    // parallax leve (só transform, um rAF por quadro)
    var par = [].slice.call(document.querySelectorAll('[data-parallax]'));
    if (par.length && !reduzir) {
      var pedido = false;
      var mexe = function () {
        pedido = false;
        par.forEach(function (el) {
          var r = el.parentElement.getBoundingClientRect();
          if (r.bottom < 0 || r.top > innerHeight) return;
          var v = parseFloat(el.getAttribute('data-parallax')) || 0.15;
          el.style.transform = 'translate3d(0,' + ((r.top + r.height / 2 - innerHeight / 2) * -v).toFixed(1) + 'px,0) scale(' + (1 + v) + ')';
        });
      };
      addEventListener('scroll', function () { if (!pedido) { pedido = true; requestAnimationFrame(mexe); } }, { passive: true });
      mexe();
    }

    // números que contam
    [].forEach.call(document.querySelectorAll('[data-conta]'), function (el) {
      var alvo = parseFloat(el.getAttribute('data-conta'));
      if (reduzir || !('IntersectionObserver' in window)) { el.textContent = alvo.toLocaleString('pt-BR'); return; }
      var o = new IntersectionObserver(function (ents) {
        if (!ents[0].isIntersecting) return; o.disconnect();
        var t0 = performance.now();
        (function passo(t) { var p = Math.min((t - t0) / 1200, 1); el.textContent = Math.round(alvo * (1 - Math.pow(1 - p, 3))).toLocaleString('pt-BR'); if (p < 1) requestAnimationFrame(passo); })(t0);
      }); o.observe(el);
    });

    // contagem regressiva
    [].forEach.call(document.querySelectorAll('[data-contagem]'), function (el) {
      var fim = new Date(el.getAttribute('data-contagem')).getTime();
      var d = el.querySelector('[data-dias]'), h = el.querySelector('[data-horas]');
      function atualiza() { var s = Math.max(0, fim - Date.now()) / 1000; if (d) d.textContent = Math.floor(s / 86400); if (h) h.textContent = Math.floor(s % 86400 / 3600); }
      atualiza(); setInterval(atualiza, 60000);
    });
  });
})();
