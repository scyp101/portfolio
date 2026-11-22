/* SITE EFFECTS (v20; from mockup fx-v10.js): text decode, crosshair cursor, magnetic pills, scan line, copy-email button.
   Load last. Everything is skipped for reduced motion; cursor and magnet only for fine pointers. */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/+-#';

  /* text decode: letters cycle through glyphs, then lock left to right */
  window.decode = function decode(node, finalText, ms = 650) {
    const text = finalText ?? node.textContent; if (reduce) { node.textContent = text; return; }
    const t0 = performance.now();
    const step = (now) => {
      const k = Math.min(1, (now - t0) / ms), lock = Math.floor(k * text.length);
      node.textContent = [...text].map((c, i) => (i < lock || c === ' ') ? c : GLYPHS[(Math.random() * GLYPHS.length) | 0]).join('');
      if (k < 1) requestAnimationFrame(step); else node.textContent = text;
    };
    requestAnimationFrame(step);
  };
  /* decode on hover: nav links, footer links, dot labels */
  document.querySelectorAll('.nav8 .links a, .px, .ft7-base a').forEach((a) => {
    const t = a.textContent; a.addEventListener('mouseenter', () => decode(a, t, 420));
  });
  /* decode on reveal: small labels that mark sections */
  const decoders = document.querySelectorAll('.cut .xs, .dimline .lab, .tuck7, .h7-word .tucks .xs, .xs.dim.stamp, .ab-hero .top .xs');
  if (!reduce && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return; io.unobserve(e.target);
      e.target.querySelectorAll('br').length ? e.target.childNodes.forEach((n) => { if (n.nodeType === 3 && n.textContent.trim()) { const s = document.createElement('span'); s.textContent = n.textContent; n.replaceWith(s); decode(s, s.textContent, 800); } }) : decode(e.target, e.target.textContent, 800);
    }), { rootMargin: '0px 0px -10% 0px' });
    decoders.forEach((n) => io.observe(n));
  }

  /* crosshair cursor */
  if (fine && !reduce) {
    const xh = document.createElement('div'); xh.className = 'xh'; xh.innerHTML = '<i></i>'; xh.setAttribute('aria-hidden', 'true'); document.body.append(xh);
    let x = -100, y = -100, cx = x, cy = y;
    addEventListener('pointermove', (e) => { x = e.clientX; y = e.clientY; xh.classList.add('on'); xh.classList.toggle('hot', !!e.target.closest('a, button, select, input, textarea, canvas, .plist a')); });
    document.addEventListener('pointerleave', () => xh.classList.remove('on'));
    const loop = () => { cx += (x - cx) * .25; cy += (y - cy) * .25; xh.style.transform = `translate(${cx}px, ${cy}px)`; requestAnimationFrame(loop); }; loop();
  }

  /* magnetic pills */
  if (fine && !reduce) {
    const mag = (p) => {
      p.classList.add('mag');
      p.addEventListener('pointermove', (e) => { const r = p.getBoundingClientRect(); p.style.setProperty('--mx', ((e.clientX - r.left - r.width / 2) * .18).toFixed(1) + 'px'); p.style.setProperty('--my', ((e.clientY - r.top - r.height / 2) * .28).toFixed(1) + 'px'); });
      p.addEventListener('pointerleave', () => { p.style.setProperty('--mx', '0px'); p.style.setProperty('--my', '0px'); });
    };
    document.querySelectorAll('.pill').forEach(mag);
    new MutationObserver((ms) => ms.forEach((m) => m.addedNodes.forEach((n) => { if (n.nodeType === 1) { if (n.matches?.('.pill')) mag(n); n.querySelectorAll?.('.pill').forEach(mag); } }))).observe(document.body, { childList: true, subtree: true });
  }

  /* scan line on the home preview image whenever it changes */
  const panel = document.getElementById('panel');
  if (panel && !reduce) new MutationObserver(() => { const img = panel.querySelector('.img'); if (img) img.classList.add('scan'); }).observe(panel, { childList: true });

  /* copy-email button: <div data-copy-email="address"></div> */
  document.querySelectorAll('[data-copy-email]').forEach((host) => {
    const email = host.dataset.copyEmail;
    host.className = 'copy-row';
    host.innerHTML = `<button type="button" class="copy" aria-label="Copy ${email}" aria-describedby="copy-status">
      <span class="br"></span><span class="br"></span><span class="br"></span><span class="br"></span>
      <span class="ico" aria-hidden="true">
        <svg class="env" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="5.5" width="18" height="13"/><path d="M3.5 6.5 12 13l8.5-6.5"/></svg>
        <svg class="tick" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4.5 12.5 10 18l9.5-11"/></svg></span>
      <span class="lab"><span class="t">Copy email</span></span></button>
      <p class="copy-status" id="copy-status" aria-live="polite"></p>`;
    const btn = host.querySelector('.copy'), lab = host.querySelector('.t'), st = host.querySelector('.copy-status');
    btn.addEventListener('click', async () => {
      let ok = false;
      try { await navigator.clipboard.writeText(email); ok = true; } catch { ok = false; }
      btn.classList.add('done'); decode(lab, ok ? 'Copied' : 'Opening mail', 380);
      decode(st, ok ? email + ' copied to clipboard' : 'Opening your mail app', 700);
      if (!ok) location.href = 'mailto:' + email;
      clearTimeout(btn._t); btn._t = setTimeout(() => { btn.classList.remove('done'); decode(lab, 'Copy email', 380); }, 2600);
    });
  });
})();
