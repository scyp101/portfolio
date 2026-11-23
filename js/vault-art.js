/* AI page artwork (D155): builds the 3 charts from SITE data (no text here). Styles live under .art in css/site.css.
   VaultArt.main() = main workflow, VaultArt.inside() = inside the vault, VaultArt.agents() = a multi-agent run. */
(() => {
  const S = window.SITE; if (!S || !S.VAULT) return;
  const VT = S.VAULT, P = S.PROJECTS.find((p) => p.slug === 'ai-and-automation'); if (!P || !P.workflow) return;
  const W = P.workflow, ST = Object.fromEntries(W.steps.map((s) => [s.name, s]));
  const C = (f, t) => W.connections.find((c) => c.from.includes(f) && c.to === t) || {};
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const cut = (s) => s.replace(/\.$/, '');
  const hub = W.steps.find((s) => s.hub);
  const read = C(hub.name, 'AI agents').label, write = C('AI agents', hub.name).label, loop = C('Outputs', hub.name).label;
  const size = Object.fromEntries(VT.size.map(([num, pre, lab]) => [lab, [num, pre]]));
  const HEAD = '<svg viewBox="0 0 12 14" aria-hidden="true" focusable="false"><path d="M1 1.5 L11 7 L1 12.5 Z" fill="#FF3B2A"/></svg>';
  const n = (k, cls) => `<div class="n ${cls}"><i>${String(W.steps.indexOf(ST[k]) + 1).padStart(2, '0')}</i><b>${esc(k)}</b><span>${esc(ST[k].detail)}</span></div>`;
  const ar = (cls, lab) => `<div class="ar ${cls}">${lab ? `<span class="lb">${esc(lab)}</span>` : ''}<div class="tr"><i></i><i class="d2"></i>${HEAD}</div></div>`;
  const L = VT.layers, book = VT.book.parts;
  const label = (main) => W.steps.map((s) => s.name + ': ' + s.detail).join(' ') + ' ' + W.connections.map((c) => c.from.join(' and ') + ' to ' + c.to + (c.label ? ' (' + c.label + ')' : '')).join('. ') + '.';

  function main() {
    return `<figure class="art" role="img" aria-label="${esc(label())}"><div class="fr round" aria-hidden="true">
      <p class="hud"><span><b>&#9679;</b> Workflow</span><span>Read &middot; Write &middot; File back</span></p>
      <div class="g">
        ${n('Inputs', 's1')}${n('Literature pipeline', 's2')}
        <div class="cin"><svg viewBox="0 0 76 100" preserveAspectRatio="none" focusable="false"><path class="vline" d="M0 25 H26 Q34 25 34 33 V67 Q34 75 26 75 H0 M34 50 H66"/></svg><span class="chead">${HEAD}</span></div>
        <div class="core"><div class="vault">
          <b>${esc(hub.name)}</b>
          <dl class="vmeta"><div><dt><small>${esc(size['Markdown notes'][1])}</small>${esc(size['Markdown notes'][0])}</dt><dd>notes</dd></div><div><dt>${esc(size['top-level folders, numbered in the order work flows through them'][0])}</dt><dd>top-level folders</dd></div></dl>
          <div class="vbook">${book.map(([t, d]) => `<div><b>${esc(t)}</b><span>${esc(cut(d.replace(/^The [a-z ]+ (is|are) /, '')))}</span></div>`).join('')}</div>
          <div class="vlay"><div><b>Memory</b><span>${esc(cut(L.memory[1]))}</span></div><div><b>Working</b><span>${esc(cut(L.work[1].replace(/^every/, 'Every')))}</span></div></div>
        </div></div>
        <div class="rw">${ar('', read)}${ar('rev', write)}</div>
        <div class="lp">${ar('rev dash', loop)}</div>
        ${n('AI agents', 'ag')}
        ${ar('mdown m1', '')}${ar('mdown m2', '')}${ar('ao2', '')}
        ${n('Outputs', 'ou')}
      </div></div></figure>`;
  }

  function inside() {
    const st = VT.stages;
    return `<figure class="art"><div class="fr round">
      <p class="hud"><span><b>&#9679;</b> Inside the vault</span><span>Capture &middot; Work &middot; Ship &middot; Distill</span></p>
      <div class="iv">
        <div><h3>How information moves</h3><div class="rail">${VT.pipeline.steps.map(([t, d], i) => `<div class="st" data-n="${i + 1}"><b>${esc(t)}</b><span>${esc(d)}</span>${t === 'Work' ? `<div class="stages" role="img" aria-label="${st.map(([k, v]) => v + ' ' + k).join(', ')}">${st.map(([k, v]) => `<i class="${k === 'active' ? 'on' : ''}" style="flex:${v}">${v >= 4 ? `<em>${v}</em>` : ''}</i>`).join('')}</div><p class="stage-key">${st.map(([k, v]) => `<span><b>${v}</b> ${esc(k)}</span>`).join('')}</p>` : ''}</div>`).join('')}</div></div>
        <div class="bl">
          <div><h3>The vault is a book</h3><div class="book">${book.map(([t, d, x]) => `<div><b>${esc(t)}</b><span>${esc(d)}</span>${t === 'Chapters' ? `<span class="htr">"How to read this file"</span>` : `<small>${esc(x.replace(/^(An|a) /, ''))}</small>`}</div>`).join('')}</div>
            <p class="path" aria-label="${esc(VT.book.never + ' ' + VT.book.path.join(' '))}"><span class="x">Scan folders</span><span>Rules</span><i>&rarr;</i><span>Index</span><i>&rarr;</i><span>One heading</span><i>&middot;</i><span>Glossary first for a fact</span></p></div>
          <div><h3>Two layers</h3><div class="lay">
            <div class="l"><b>Memory</b><span>${esc(L.memory[1])}<span class="chips">${L.sections.replace(/\.$/, '').split(/, (?:and )?/).map((x) => `<span>${esc(x)}</span>`).join('')}</span></span></div>
            <p class="talk">${esc(L.lookup)}</p>
            <div class="l"><b>Working</b><span>${esc(L.work[1].replace(/^every/, 'Every'))}</span></div></div></div>
        </div>
      </div></div></figure>`;
  }

  function agents() {
    const A = VT.agents;
    return `<figure class="art"><div class="fr round">
      <p class="hud"><span><b>&#9679;</b> Multi-agent</span><span>${esc((A.logs.match(/\(([^)]+)\)/) || ['', ''])[1])}</span></p>
      <div class="ma">
        <div class="n coord"><i>Coordinator</i><b>${esc(A.coordinator)}</b><span>${esc(A.writer)}</span></div>
        <div class="fan" aria-hidden="true"></div>
        <div class="workers" aria-hidden="true">${[1, 2, 3, 4].map(() => `<div class="w">Specialist worker<small><span class="loop">&#8635;</span></small></div>`).join('')}</div>
        <div class="notes"><p>${esc(A.workers)}</p><p>${esc(A.review)}</p><p>${esc(A.logs)}</p><p>Purpose: ${esc(A.purpose)}</p></div>
      </div></div></figure>`;
  }
  window.VaultArt = { main, inside, agents };
})();
