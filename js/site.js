/* SITE RUNTIME (v20). Renders every page from js/site-data.js. No project text lives here.
   <body data-page="home|about|contact|project" data-base="" (or "../" in /projects/) data-slug="...">. */
(() => {
  const S = window.SITE, B = document.body.dataset.base || '', PAGE = document.body.dataset.page;
  const U = { home: B + 'index.html', about: B + 'about.html', contact: B + 'contact.html', proj: (s) => B + 'projects/' + s + '.html' };
  const LI = 'https://www.linkedin.com/in/kamil-siddiqui-me/';
  const EMAIL = 'kamil_siddiqui2002@hotmail.com';
  const HOOK = 'Designed to be built. Revised until it works.';
  const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const el = (t, c, x) => { const n = document.createElement(t); if (c) n.className = c; if (x != null) n.textContent = x; return n; };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  /* inline markup from the data files: **bold** and [text](LINK:slug) */
  const rich = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\[([^\]]+)\]\(LINK:([a-z0-9-]+)\)/g, (m, t, slug) => `<a class="inl" href="${U.proj(slug)}">${t}</a>`);
  const P = (tag, cls, s) => { const n = el(tag, cls); n.innerHTML = rich(s); return n; };
  const BYSLUG = Object.fromEntries(S.PROJECTS.map((p) => [p.slug, p]));
  /* Client words, verbatim: textContent only, a line break starts a new paragraph, empty lines are skipped. */
  function reviewText(text) {
    const box = el('div', 'rv-text');
    text.split('\n').forEach((line) => { if (line.length && line.trim().length) { const q = document.createElement('p'); q.textContent = line; box.append(q); } });
    return box;
  }

  /* ---------- buttons ---------- */
  const ICON = (d) => '<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="square" stroke-linejoin="miter" focusable="false"><path d="' + d + '"/></svg>';
  const ARROW = { int: ICON('M2.5 8h10.5M9 4l4 4-4 4'), back: ICON('M13.5 8H3M7 4L3 8l4 4'), ext: ICON('M4.5 11.5l7-7M6 4.5h5.5V10') };
  function pill(label, href, kind = 'int', extra = '') {
    const a = el('a', 'pill pressable ' + (kind === 'ext' ? '' : 'int ') + (kind === 'back' ? 'back ' : '') + extra); a.href = href; if (kind === 'ext') a.rel = 'noopener';
    const svg = ARROW[kind === 'ext' ? 'ext' : kind === 'back' ? 'back' : 'int'];
    a.innerHTML = '<span class="pill-arrow" aria-hidden="true"><i>' + svg + '</i><i>' + svg + '</i></span><span class="pill-label"></span>';
    if (kind !== 'back') a.append(a.querySelector('.pill-arrow'));
    a.querySelector('.pill-label').textContent = label;
    return a;
  }
  const pillSpan = (label, extra) => { const a = pill(label, '#', 'int', extra); const s = el('span', a.className); s.innerHTML = a.innerHTML; s.setAttribute('aria-hidden', 'true'); return s; };

  /* ---------- header and footer ---------- */
  function header() {
    const h = $('#hd'); if (!h) return;
    h.className = 'nav8' + (PAGE === 'contact' ? ' on-red-page' : '');
    h.innerHTML = `<a class="brand pressable" href="${U.home}#top">Kamil Siddiqui</a>
      <nav class="links" aria-label="Pages"><a class="u" href="${U.home}#top">Home</a><a class="u" href="${U.home}#work">Projects</a><a class="u" href="${U.about}">About</a><a class="u" href="${U.contact}">Contact</a></nav>
      <p class="clock xs dim">Karachi <span class="khi-clock">--:--:--</span> &nbsp;24.86° N, 67.00° E</p><span class="hp"></span>`;
    const cur = { home: 0, about: 2, contact: 3 }[PAGE];
    if (cur != null) h.querySelectorAll('.links a')[cur].setAttribute('aria-current', 'page');
    h.querySelector('.hp').append(pill('LinkedIn', LI, 'ext'));
  }
  function footer() {
    const f = $('#ft'); if (!f) return;
    f.className = 'ft7';
    f.innerHTML = `<div class="box"><div class="ft7-grid">
        <div><div class="who7"><span class="nm">Kamil Siddiqui</span><span class="xs">Mechanical design engineer</span><span class="xs">Karachi, Pakistan</span></div><div class="cta"></div></div>
        <div><span class="xs dim">Pages</span><ul><li><a class="px xs" href="${U.home}#top">Home</a></li><li><a class="px xs" href="${U.home}#work">Projects</a></li><li><a class="px xs" href="${U.about}">About</a></li><li><a class="px xs" href="${U.contact}">Contact</a></li></ul></div>
        <div><span class="xs dim">Elsewhere</span><ul><li><a class="px xs" href="${LI}" rel="noopener">LinkedIn</a></li></ul></div>
        <div><span class="xs dim">Based in</span><ul><li class="xs">Karachi, Pakistan</li><li class="xs dim">24.86° N, 67.00° E</li><li class="xs">Local time <span class="khi-clock"></span></li></ul></div>
      </div>
      <div class="ft7-end"><p class="stamp xs dim">Selected projects<br>2023 to 2026</p><span class="big split" aria-hidden="true">©26</span></div></div>
      <div class="ft7-base box"><span class="xs dim">© 2026 Kamil Siddiqui</span><a class="u xs" href="#top">Back to top</a></div>`;
    f.querySelector('.cta').append(pill('Get in touch', U.contact, 'int', 'red'), pill('LinkedIn', LI, 'ext'));
  }
  const KHI = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Karachi', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  function clocks() { const t = () => document.querySelectorAll('.khi-clock').forEach((n) => { n.textContent = KHI.format(new Date()); }); t(); setInterval(t, 1000); }

  /* ---------- reveal ---------- */
  function splitLetters() {
    document.querySelectorAll('.split').forEach((n) => {
      if (n.dataset.done) return; n.dataset.done = '1';
      const text = n.textContent; n.textContent = '';
      [...text].forEach((c, i) => { const s = el('span', 'ch', c === ' ' ? ' ' : c); s.style.setProperty('--i', i); n.append(s); });
    });
  }
  function reveal() {
    const items = document.querySelectorAll('.split, .rise, .dimline, .cut');
    if (REDUCE || !('IntersectionObserver' in window)) { items.forEach((n) => n.classList.add('in')); return; }
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
    items.forEach((n) => io.observe(n));
  }
  const cut = (label) => { const c = el('div', 'cut'); c.innerHTML = '<span class="xs dim"></span><span class="hatch" aria-hidden="true"></span>'; c.firstChild.textContent = label; return c; };
  const dot = (label) => { const d = el('span', 'dot open'); d.innerHTML = '<span class="mk" aria-hidden="true">.</span><span class="lb"><span></span></span>'; d.querySelector('.lb span').textContent = label; return d; };

  /* ---------- images: real file when ready, captioned placeholder otherwise (no request) ---------- */
  const hidden = (im) => !im.ready && im.hideUntilReady;
  function imgSlot(p, im, cls = 'img crop') {
    const box = el('div', cls);
    if (im && im.ready) {
      if (im.video) { const v = el('video'); v.src = B + 'images/' + p.slug + '/' + im.file; v.muted = true; v.loop = true; v.playsInline = true; v.autoplay = !REDUCE; v.setAttribute('aria-label', im.caption); box.append(v); }
      else { const i = el('img'); i.src = B + 'images/' + p.slug + '/' + im.file; i.alt = im.caption; i.loading = 'lazy'; i.decoding = 'async'; box.append(i); }
    } else box.append(el('div', 'ph6 xs dim', 'Image to come'));
    return box;
  }
  function textCover(p) {
    const c = el('div', 'tcover');
    c.innerHTML = p.nda
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10"/><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4M9 12h7M9 15.5h7M9 19h4"/></svg>';
    c.append(el('b', '', p.nda ? 'NDA' : 'Contract'), el('p', '', p.nda ? 'Client work under NDA. Details kept to what can be shared.' : 'Contract work. Details kept brief.'));
    return c;
  }

  /* =================== HOME =================== */
  function home() {
    $('#hook').textContent = HOOK;
    $('#hero-cta').append(pill('See the projects', '#work', 'int', 'red'), pill('Get in touch', U.contact));
    const G = S.GLOBE;
    /* countries list */
    G.countries.forEach((c, i) => { const li = el('li', 'geo-item'); li.append(el('span', '', c.label), el('sup', '', c.count)); $('#geo').append(li); setTimeout(() => li.classList.add('on'), REDUCE ? 0 : 1300 + i * 150 + 900); });
    $('#about-cta').append(pill('More about me', U.about));
    /* project index */
    const groups = ['case', 'design', 'analysis', 'systems'];
    groups.forEach((g) => {
      const list = S.PROJECTS.filter((p) => p.group === g); if (!list.length) return;
      const box = el('div', 'w6-group rise ' + g); box.append(dot(S.GROUPS[g] + ', ' + list.length));
      const nav = el('nav', 'plist'); nav.setAttribute('aria-label', S.GROUPS[g]);
      list.forEach((p) => {
        const a = el('a'); a.href = U.proj(p.slug);
        const t = el('span', 'tt'); t.append(el('span', '', p.title)); if (g === 'case') t.append(el('span', 'hl', p.headline));
        a.append(t, el('span', 'xs', p.year));
        const on = () => { if (a.classList.contains('on')) return; document.querySelectorAll('.plist a').forEach((x) => x.classList.toggle('on', x === a)); panel(p); };
        a.addEventListener('mouseenter', on); a.addEventListener('focus', on);
        nav.append(a);
      });
      box.append(nav); $('#lists').append(box);
    });
    function panel(p) {
      const X = $('#panel'); X.innerHTML = '';
      X.append(el('p', 'xs dim', p.tag + ' / ' + p.year));
      if (p.textOnly) { const w = el('div', 'img crop cover7'); w.style.marginTop = 'var(--s4)'; w.style.aspectRatio = '4 / 3'; w.append(textCover(p)); X.append(w); }
      else X.append(imgSlot(p, (p.images || [])[0]));
      X.append(el('p', 'res', p.headline));
      X.append(P('p', '', p.problem || p.brief || ''), pill('View project', U.proj(p.slug), 'int', 'red'));
    }
    document.querySelector('.plist a').dispatchEvent(new Event('mouseenter'));
    /* client feedback (verbatim reviews) */
    (S.FEEDBACK || []).forEach((r, i) => {
      const p = BYSLUG[r.slug]; const f = el('figure', 'rv'); f.dataset.rid = r.id;
      const bq = el('blockquote', 'rv-clamp'); bq.id = 'rv-' + r.id; bq.append(reviewText(r.text));
      const more = el('button', 'rv-more', 'Read more'); more.type = 'button'; more.setAttribute('aria-expanded', 'false'); more.setAttribute('aria-controls', bq.id); more.hidden = true;
      more.addEventListener('click', () => { const open = f.classList.toggle('open'); more.setAttribute('aria-expanded', open); more.textContent = open ? 'Show less' : 'Read more'; });
      const cap = el('figcaption'); cap.append(r.by + (p ? ' \u00b7 ' : '')); if (p) { const a = el('a', 'u', p.title); a.href = U.proj(p.slug); cap.append(a); }
      f.append(bq, more, cap); $('#fb-grid').append(f);
    });
    /* show "Read more" only where the text is actually cut */
    const fit = () => document.querySelectorAll('#fb-grid .rv').forEach((f) => { if (f.classList.contains('open')) return; const b = f.querySelector('.rv-clamp'); f.querySelector('.rv-more').hidden = b.scrollHeight <= b.clientHeight + 2; });
    fit(); addEventListener('resize', fit); document.fonts && document.fonts.ready.then(fit);
    (() => { const tr = $('#fb-grid'); let down = false, x0 = 0, s0 = 0;
      tr.addEventListener('pointerdown', (e) => { if (e.pointerType === 'touch' || e.target.closest('a, button')) return; down = true; x0 = e.clientX; s0 = tr.scrollLeft; tr.classList.add('dragging'); tr.setPointerCapture(e.pointerId); });
      tr.addEventListener('pointermove', (e) => { if (down) tr.scrollLeft = s0 - (e.clientX - x0); });
      const up = () => { down = false; tr.classList.remove('dragging'); }; tr.addEventListener('pointerup', up); tr.addEventListener('pointercancel', up);
      tr.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') tr.scrollBy({ left: 360, behavior: 'smooth' }); if (e.key === 'ArrowLeft') tr.scrollBy({ left: -360, behavior: 'smooth' }); }); })();
    $('#ready-cta').append(pill('Get in touch', U.contact, 'int', 'red'), pill('LinkedIn', LI, 'ext'));
    /* globe: start after first paint, when the browser is idle */
    const start = () => window.initGlobe && window.initGlobe($('#globe'), { style: 'glow', tip: $('#tip'), scale: .4, tilt: -24, lonOffset: 30, worldUrl: 'js/vendor/countries-110m.json' });
    window.GLOBE = G;
    /* project count: "190" is in the HTML. When the line scrolls into view it counts up by the clock and always
       ends on the real number; with reduced motion, or if anything fails, it simply stays at 190 (D133). */
    (() => {
      const n = $('#count'); if (!n) return; const end = parseInt(n.textContent, 10) || G.total;
      if (REDUCE || !('IntersectionObserver' in window)) { n.textContent = end; return; }
      const io = new IntersectionObserver((es) => {
        if (!es[0].isIntersecting) return; io.disconnect();
        const t0 = performance.now(), dur = 1400;
        const step = (now) => { const k = Math.min(1, (now - t0) / dur); n.textContent = Math.round(end * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); else n.textContent = end; };
        requestAnimationFrame(step);
        setTimeout(() => { n.textContent = end; }, dur + 400); /* safety: always lands on the real number */
      }, { threshold: .4 });
      io.observe(n);
    })();
    const go = () => ('requestIdleCallback' in window ? requestIdleCallback(start, { timeout: 900 }) : setTimeout(start, 200));
    if (document.readyState === 'complete') go(); else addEventListener('load', go, { once: true });
  }

  /* =================== PROJECT =================== */
  function project() {
    const idx = S.PROJECTS.findIndex((x) => x.slug === document.body.dataset.slug), p = S.PROJECTS[idx], main = $('#page');
    const hero = el('section', 'ph7 rise');
    hero.append(pill('All projects', U.home + '#work', 'back'));
    const cr = el('div', 'h6-crumb'); cr.style.marginTop = '0'; cr.append(dot(S.GROUPS[p.group]), el('span', 'xs dim', p.tag)); hero.append(cr);
    hero.append(el('h1', '', p.title), el('p', 'res', p.headline)); main.append(hero);
    const cover = el('div', 'cover7 crop rise');
    if (p.textOnly) cover.append(textCover(p)); else { const c = imgSlot(p, p.images[0], 'img'); c.style.height = '100%'; cover.append(c); }
    main.append(cover);
    const gl = el('dl', 'gl7 rise');
    [['Year', p.year], ['Type', p.tag], ['Tools', p.tools.join(', ')], ['Client', p.client]].forEach(([k, v]) => { const d = el('div'); d.append(el('dt', 'xs dim', k), el('dd', '', v)); gl.append(d); });
    main.append(gl);
    const sec = (title, cls = '') => { const s = el('section', 'sec7 rise ' + cls); s.append(el('h2', '', title)); main.append(s); return s; };

    if (p.kind === 'case') {
      const meta = el('dl', 'cs-meta rise');
      [['Role', p.role], ['Team', p.team], ['When', p.when]].filter((r) => r[1]).forEach(([k, v]) => { const d = el('div'); d.append(el('dt', 'xs dim', k), el('dd', '', v)); meta.append(d); });
      main.append(meta);
      sec('Problem').append(P('p', '', p.problem));
      if (p.options) {
        const s = sec('Options considered'); const w = el('div', 'opt-wrap'); const t = el('table', 'opt');
        const tr = el('tr'); p.options.head.forEach((h) => tr.append(el('th', '', h))); const th = el('thead'); th.append(tr); t.append(th);
        const tb = el('tbody'); const wi = p.options.head.findIndex((h) => /^(Chosen|Kept\?)$/.test(h));
        p.options.rows.forEach((r) => { const row = el('tr'); r.forEach((c, i) => row.append(el('td', i === wi ? 'win' : '', c))); tb.append(row); });
        t.append(tb); w.append(t); s.append(w);
      }
      const s = sec('Process'); const ol = el('ol');
      p.process.forEach((st) => {
        const li = el('li'); const box = el('div'); box.append(P('p', '', st.text));
        if (st.paired) {
          const a = el('a', 'paired'); a.href = U.proj(st.paired.link);
          const im = (p.images || []).find((x) => x.file === st.paired.file) || { file: st.paired.file, caption: st.paired.caption, ready: false };
          const fig = el('figure'); fig.append(imgSlot(p, { ...im, caption: st.paired.caption }), el('figcaption', 'xs dim', st.paired.caption)); a.append(fig); box.append(a);
        }
        li.append(box); ol.append(li);
      });
      s.append(ol);
      sec('Result').append(P('p', '', p.result));
      const rf = sec('Reflection', 'reflect'); rf.append(P('p', '', p.reflection));
    } else {
      sec('Brief').append(P('p', '', p.brief));
      if (p.constraints) sec('Constraints').append(P('p', '', p.constraints));
      const steps = p.process.length ? p.process : p.did; const s = sec(p.process.length ? 'Process' : 'What I did'); const ul = el('ul'); steps.forEach((x) => ul.append(P('li', '', x))); s.append(ul);
      sec('Result').append(P('p', '', p.result));
    }
    /* figures (never for NDA or text-only) */
    if (!p.textOnly && !p.nda) {
      const figs = el('div', 'figs');
      (p.images || []).slice(1).filter((im) => !hidden(im) && !(p.slug === 'solar-pv-cooling' && im.file === '02.jpg')).forEach((im) => {
        const f = el('figure', 'rise'); f.append(imgSlot(p, im), el('figcaption', 'xs dim', im.caption)); figs.append(f);
      });
      if (figs.children.length) { const h = sec('Figures'); h.append(figs); }
    }
    if (p.backlink) main.append(P('p', 'backlink rise', p.backlink));
    /* client reviews: every review for this project, newest first (D128) */
    if (p.reviews && p.reviews.length) {
      const s = sec('Client reviews', 'reviews' + (p.reviews.length === 1 ? ' one' : ''));
      const list = el('div', 'rv-list');
      p.reviews.forEach((r) => { const f = el('figure', 'rv'); f.dataset.rid = r.id; const bq = el('blockquote'); bq.append(reviewText(r.text)); f.append(bq, el('figcaption', 'xs dim', r.by)); list.append(f); });
      s.append(list);
    }
    /* previous and next */
    const pn = el('nav', 'pn7'); pn.setAttribute('aria-label', 'More projects');
    const prev = S.PROJECTS[(idx - 1 + S.PROJECTS.length) % S.PROJECTS.length], next = S.PROJECTS[(idx + 1) % S.PROJECTS.length];
    const a1 = el('a', 'prev'); a1.href = U.proj(prev.slug); a1.append(el('span', 'xs dim', 'Previous project'), el('span', 't', prev.title), pillSpan('Previous', 'back'));
    const a2 = el('a', 'next'); a2.href = U.proj(next.slug); a2.append(el('span', 'xs dim', 'Next project'), el('span', 't', next.title), pillSpan('Next project', 'red'));
    pn.append(a1, a2); main.append(cut('More'), pn);
  }

  /* =================== ABOUT =================== */
  function about() {
    const A = S.ABOUT;
    /* chapters: Kamil's 3 paragraphs, word for word; first sentence large, key phrases marked, at-a-glance side items (D142) */
    const marked = (text, marks) => { const out = el('p', 'chap-text'); let rest = text;
      while (rest.length) { let at = -1, hit = '';
        (marks || []).forEach((m) => { const k = rest.indexOf(m); if (k >= 0 && (at < 0 || k < at)) { at = k; hit = m; } });
        if (at < 0) { out.append(rest); break; }
        out.append(rest.slice(0, at)); out.append(el('mark', '', hit)); rest = rest.slice(at + hit.length); }
      return out; };
    A.intro.forEach((text, i) => {
      const c = A.chapters[i] || { label: '', marks: [] };
      const k = text.indexOf('. '), first = k > 0 ? text.slice(0, k + 1) : text, rest = k > 0 ? text.slice(k + 2) : '';
      const row = el('article', 'chap rise');
      const lab = el('p', 'chap-label'); lab.append(el('span', 'dotm'), c.label); row.append(lab);
      const body = el('div', 'chap-body'); body.append(el('p', 'chap-lead', first)); if (rest) body.append(marked(rest, c.marks)); row.append(body);
      const side = el('aside', 'chap-side'); side.setAttribute('aria-label', c.label + ' at a glance');
      if (c.figures) { const g = el('dl', 'chap-figs'); c.figures.forEach(([n, l]) => { const d = el('div'); d.append(el('dt', '', n), el('dd', '', l)); g.append(d); }); side.append(g); }
      if (c.quotes) c.quotes.forEach((q) => { const f = el('p', 'chap-quote'); f.append('\u201C' + q + '\u201D'); side.append(f); });
      if (c.quotes) side.append(el('p', 'chap-note', 'From client reviews'));
      if (c.tags) { const u = el('ul', 'chap-tags'); c.tags.forEach((x) => u.append(el('li', '', x))); side.append(u); }
      row.append(side); $('#intro').append(row);
    });
    /* tools (D141): data from SITE.TOOLS, frequency shown as a 3-step gauge with a key */
    const T = S.TOOLS, LV = Object.fromEntries(T.scale.map((s, i) => [s.name, T.scale.length - i]));
    const gauge = (f) => { const g = el('span', 'gauge'); g.setAttribute('aria-hidden', 'true'); for (let i = 1; i <= T.scale.length; i++) g.append(el('i', i <= (LV[f] || 0) ? 'on' : '')); return g; };
    const key = $('#tools-key'); T.scale.forEach((s) => { const li = el('li'); li.append(gauge(s.name), el('b', '', s.name), el('span', '', s.means)); key.append(li); });
    T.groups.forEach((g) => {
      const card = el('section', 'tgroup rise'); card.append(el('h3', '', g.name));
      const ul = el('ul'); g.tools.forEach((x) => { const li = el('li'); const nm = el('div', 'tname'); nm.append(el('span', '', x.name)); if (x.note) nm.append(el('small', '', x.note));
        const fr = el('div', 'tfreq'); fr.append(gauge(x.freq), el('span', '', x.freq)); li.append(nm, fr); ul.append(li); });
      card.append(ul); $('#tools-grid').append(card);
    });
    const also = $('#tools-also'); const ah = el('p', 'also-h'); ah.append(el('b', '', 'Also used'), el('span', '', T.alsoMeans)); also.append(ah); const au = el('ul'); T.also.forEach((x) => au.append(el('li', '', x))); also.append(au);
    A.facts.forEach(([k, v]) => { const d = el('div'); d.append(el('dt', 'xs dim', k), el('dd', '', v)); $('#facts').append(d); });
    $('#about-cta').append(pill('See the projects', U.home + '#work', 'int', 'red'), pill('LinkedIn', LI, 'ext'));
    S.TIMELINE.forEach((t) => { const it = el('article', 'tl-item'); it.append(el('p', 'yr', t.year), el('h3', '', t.title), el('p', '', t.detail), el('span', 'kind', t.kind)); $('#track').append(it); });
    const brk = (s) => { const k = s.indexOf(', '); return k < 0 ? s : s.slice(0, k + 1) + '\n' + s.slice(k + 2); };
    const tbl = (host, rows, cols) => rows.forEach((r) => { const d = el('div'); cols.forEach((c, i) => d.append(el('span', c, c === 'r' && host === '#exp' ? brk(r[i] || '') : (r[i] || '')))); $(host).append(d); });
    tbl('#exp', A.experience.rows, ['y', 'r', 'd']);
    tbl('#rec', A.recognition.rows, ['y', 'r']);
    $('#band-cta').append(pill('See the projects', U.home + '#work', 'int', 'red'), pill('Get in touch', U.contact));
    const tl = $('#track'); let down = false, x0 = 0, s0 = 0;
    tl.addEventListener('pointerdown', (e) => { if (e.pointerType === 'touch') return; down = true; x0 = e.clientX; s0 = tl.scrollLeft; tl.classList.add('dragging'); tl.setPointerCapture(e.pointerId); });
    tl.addEventListener('pointermove', (e) => { if (down) tl.scrollLeft = s0 - (e.clientX - x0); });
    const up = () => { down = false; tl.classList.remove('dragging'); }; tl.addEventListener('pointerup', up); tl.addEventListener('pointercancel', up);
    tl.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') tl.scrollBy({ left: 300, behavior: 'smooth' }); if (e.key === 'ArrowLeft') tl.scrollBy({ left: -300, behavior: 'smooth' }); });
  }

  /* =================== CONTACT =================== */
  function contact() {
    const c12 = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Karachi', hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true });
    const c24 = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Karachi', hour: '2-digit', minute: '2-digit', hour12: false });
    const cd = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Karachi', weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    const tk = () => { const d = new Date(); $('#clock12').textContent = c12.format(d) + ' PKT'; $('#clock24').textContent = c24.format(d) + ' · UTC+5 · ' + cd.format(d); }; tk(); setInterval(tk, 1000);
    const sb = pill('Send message', '#', 'int', 'dark'); const btn = document.createElement('button'); btn.type = 'submit'; btn.className = sb.className; btn.innerHTML = sb.innerHTML; $('#submit-slot').append(btn);
    const form = $('#form'), show = (id) => ['st-sending', 'st-ok', 'st-err'].forEach((s) => $('#' + s).classList.toggle('show', s === id));
    form.addEventListener('submit', async (e) => {
      e.preventDefault(); let ok = true;
      form.querySelectorAll('.fld').forEach((f) => { const i = f.querySelector('input, select, textarea'); const bad = !i.value.trim() || (i.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(i.value)); f.classList.toggle('bad', bad); if (bad && ok) { i.focus(); ok = false; } });
      if (!ok) return; show('st-sending');
      try { const r = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } }); if (r.ok) { form.reset(); show('st-ok'); } else throw new Error(r.status); } catch { show('st-err'); }
    });
  }

  header(); footer(); clocks();
  ({ home, project, about, contact }[PAGE] || (() => {}))();
  splitLetters(); reveal();
})();
