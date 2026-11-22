/* SITE GLOBE (v20; from mockup engine v5). Performance (D101): precomputed dots (js/globe-dots.js), slim d3-geo,
   paused when off screen, pixel ratio capped at 1.5. Fourth accent, cool cobalt, in the lower atmosphere and rim only (D99).
   More country labels with overlap avoidance (D100). Based on mockup v5 (round 11: adds style 'glow' after unitedcarriers.com, in Kamil's colours: shaded sphere,
   breathing red atmosphere, gradient rim, dot-matrix land, label chips on major client countries). Based on v4 (overhaul samples: every colour and the dial font come from CSS vars
   --g-accent --g-line --g-sphere --g-land --g-font, falling back to the v3 look). Based on v3 (round 4: adds focus(name) API for scroll-linked turning + arc highlight). Based on v2 (round 2: 26 countries, faster stagger, lat/lon fallback, count-scaled markers, weighted packets). Was v1. Needs d3, topojson-client, data-v1.js (GLOBE).
   styles: 'hatch'  served countries get section hatching (technical drawing)
           'dots'   land as a dot matrix, served countries in red dots
           'dial'   outlines only + a rotating degree bezel and lat/lon readout
   Sequence: limb draws in -> rotate to Karachi -> arcs launch one by one,
   each landing fills its country, pulses, and ticks the counter -> idle spin
   with packets travelling the arcs. Drag to rotate (with momentum). */

async function initGlobe(canvas, opts) {
  const o = Object.assign({ style: 'hatch', tip: null, onCount: null, onReadout: null, scale: 0.44, tilt: -28, lonOffset: 22, worldUrl: 'vendor/countries-110m.json' }, opts);
  const ctx = canvas.getContext('2d');
  const css = getComputedStyle(document.documentElement);
  const cv = (n, f) => (getComputedStyle(canvas).getPropertyValue(n).trim() || f);
  const RED = cv('--g-accent', css.getPropertyValue('--red-hot').trim() || '#FF3B2A');
  const PAPER = cv('--g-line', css.getPropertyValue('--paper').trim() || '#F2EEE5');
  const INK2 = cv('--g-sphere', css.getPropertyValue('--ink-2').trim() || '#211D1A');
  const LANDF = cv('--g-land', '#2A2521');
  const COOL = cv('--g-cool', '#4A72FF');
  const GFONT = cv('--g-font', 'Archivo, sans-serif');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const D = Math.PI / 180;

  const topo = await fetch(o.worldUrl).then((r) => r.json());
  const features = topojson.feature(topo, topo.objects.countries).features;
  const land = topojson.feature(topo, topo.objects.land);
  const borders = topojson.mesh(topo, topo.objects.countries, (a, b) => a !== b);
  const ORIGIN = [GLOBE.origin.lon, GLOBE.origin.lat];

  const served = GLOBE.countries.map((c, i) => {
    const f = features.find((x) => x.properties.name === c.name);
    const centroid = c.lat != null ? [c.lon, c.lat] : f ? d3.geoCentroid(f) : ORIGIN;
    return { ...c, f, centroid, interp: d3.geoInterpolate(ORIGIN, centroid), dist: d3.geoDistance(ORIGIN, centroid), start: 1300 + i * 150, arrived: false, at: 0, mr: 2 + Math.sqrt(c.count) * .55 };
  });
  const totalCount = served.reduce((s, c) => s + c.count, 0);

  const proj = d3.geoOrthographic().clipAngle(90).precision(0.3);
  const path = d3.geoPath(proj, ctx);
  const grat = d3.geoGraticule10();
  const sphere = { type: 'Sphere' };
  const HOME = [-ORIGIN[0] + o.lonOffset, o.tilt, 0];
  let rot = reduce ? HOME.slice() : [HOME[0] + 110, HOME[1] - 10, 0];
  let W = 0, H = 0, R = 0, DPR = 1;

  /* hatch pattern: 45 degree section lines */
  function makeHatch() {
    const s = 7 * DPR, c = document.createElement('canvas');
    c.width = c.height = s;
    const g = c.getContext('2d');
    g.strokeStyle = RED; g.lineWidth = 1 * DPR; g.globalAlpha = .9;
    g.beginPath(); g.moveTo(0, s); g.lineTo(s, 0); g.moveTo(-s / 2, s / 2); g.lineTo(s / 2, -s / 2); g.moveTo(s / 2, s * 1.5); g.lineTo(s * 1.5, s / 2); g.stroke();
    const p = ctx.createPattern(c, 'repeat');
    p.setTransform(new DOMMatrix().scale(1 / DPR));
    return p;
  }
  let hatch = null;

  /* dot matrix (dots style only) */
  let dots = null;
  if (o.style === 'dots' || o.style === 'glow') {
    dots = (window.GLOBE_DOTS || []).map((d) => ({ p: [d[0], d[1]], s: d[2] }));
  }

  function resize() {
    DPR = Math.min(devicePixelRatio || 1, 1.5);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = W * DPR; canvas.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    R = Math.min(W, H) * o.scale;
    proj.scale(R).translate([W / 2, H / 2]);
    hatch = makeHatch();
  }

  /* lon/lat + lift factor -> screen point with visibility */
  function p3(ll, h) {
    const r = d3.geoRotation(rot)(ll);
    const l = r[0] * D, f = r[1] * D;
    const x = Math.cos(f) * Math.sin(l), y = Math.sin(f), z = Math.cos(f) * Math.cos(l);
    return { x: W / 2 + R * h * x, y: H / 2 - R * h * y, vis: z > 0 || h * Math.hypot(x, y) > 1 };
  }
  function arcPoint(c, s) { return p3(c.interp(s), 1 + 0.11 * Math.sin(Math.PI * s) * Math.min(1, c.dist + 0.25)); }
  function strokeArc(c, s0, s1, alpha, width) {
    const n = Math.max(2, Math.ceil(56 * (s1 - s0)));
    let prev = arcPoint(c, s0);
    ctx.lineWidth = width;
    for (let i = 1; i <= n; i++) {
      const cur = arcPoint(c, s0 + (s1 - s0) * i / n);
      ctx.globalAlpha = alpha * (prev.vis && cur.vis ? 1 : 0.14);
      ctx.beginPath(); ctx.moveTo(prev.x, prev.y); ctx.lineTo(cur.x, cur.y); ctx.stroke();
      prev = cur;
    }
    ctx.globalAlpha = 1;
  }

  const ease = (t) => 1 - Math.pow(1 - Math.min(Math.max(t, 0), 1), 3);
  let hovered = null, hoverServed = null;
  let focusT = null, hl = null;
  const packets = [];
  let lastPacket = 0;

  function draw(t) {
    ctx.clearRect(0, 0, W, H);
    proj.rotate(rot);
    const limb = reduce ? 1 : ease(t / 900);

    const GLOW = o.style === 'glow', cx = W / 2, cy = H / 2;
    if (GLOW) {
      /* atmosphere: soft red halo, brighter towards the upper right, slowly breathing */
      const br = reduce ? 1 : .86 + .14 * Math.sin(t / 1100);
      let g = ctx.createRadialGradient(cx, cy, R * .92, cx, cy, R * 1.2);
      g.addColorStop(0, 'rgba(255,59,42,0)'); g.addColorStop(.12, `rgba(255,59,42,${.42 * br})`); g.addColorStop(.4, `rgba(216,38,29,${.14 * br})`); g.addColorStop(1, 'rgba(55,10,13,0)');
      ctx.globalAlpha = limb; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R * 1.2, 0, 7); ctx.fill();
      /* fourth accent: cool cobalt glow on the lower left (globe only) */
      let gc = ctx.createRadialGradient(cx - R * .45, cy + R * .45, 0, cx - R * .45, cy + R * .45, R * .7);
      gc.addColorStop(0, `rgba(74,114,255,${.34 * br})`); gc.addColorStop(1, 'rgba(74,114,255,0)');
      ctx.fillStyle = gc; ctx.beginPath(); ctx.arc(cx - R * .45, cy + R * .45, R * .7, 0, 7); ctx.fill();
      g = ctx.createRadialGradient(cx + R * .4, cy - R * .4, 0, cx + R * .4, cy - R * .4, R * .62);
      g.addColorStop(0, `rgba(255,120,90,${.30 * br})`); g.addColorStop(1, 'rgba(255,59,42,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx + R * .4, cy - R * .4, R * .62, 0, 7); ctx.fill();
      /* shaded sphere */
      g = ctx.createRadialGradient(cx - R * .3, cy - R * .35, R * .1, cx, cy, R);
      g.addColorStop(0, '#2B221E'); g.addColorStop(.7, '#16110F'); g.addColorStop(1, '#0C0908');
      ctx.fillStyle = g; ctx.beginPath(); path(sphere); ctx.fill(); ctx.globalAlpha = 1;
    } else {
      ctx.fillStyle = INK2; ctx.globalAlpha = limb;
      ctx.beginPath(); path(sphere); ctx.fill(); ctx.globalAlpha = 1;
    }

    /* graticule */
    ctx.strokeStyle = RED; ctx.lineWidth = .5; ctx.globalAlpha = .14 * limb;
    ctx.beginPath(); path(grat); ctx.stroke(); ctx.globalAlpha = 1;

    /* land */
    const landA = reduce ? 1 : ease((t - 400) / 900);
    if (o.style === 'dots' || o.style === 'glow') {
      const c = [-rot[0], -rot[1]];
      for (const d of dots) {
        if (d3.geoDistance(d.p, c) > 1.55) continue;
        const q = proj(d.p);
        const sc = d.s >= 0 ? served[d.s] : null;
        const on = sc && sc.arrived ? ease((t - sc.at) / 600) : 0;
        ctx.fillStyle = on > 0 ? RED : PAPER;
        ctx.globalAlpha = landA * (on > 0 ? .4 + .6 * on : .5);
        const r = on > 0 ? 2 : 1.4;
        ctx.fillRect(q[0] - r / 2, q[1] - r / 2, r, r);
      }
      ctx.globalAlpha = 1;
    } else {
      if (o.style === 'hatch') { ctx.fillStyle = LANDF; ctx.globalAlpha = landA; ctx.beginPath(); path(land); ctx.fill(); }
      ctx.strokeStyle = PAPER; ctx.lineWidth = .6; ctx.globalAlpha = landA * (o.style === 'dial' ? .55 : .4);
      ctx.beginPath(); path(land); ctx.stroke();
      ctx.lineWidth = .4; ctx.globalAlpha = landA * .16; ctx.beginPath(); path(borders); ctx.stroke();
      ctx.globalAlpha = 1;
      /* served countries */
      for (const c of served) {
        if (!c.arrived || !c.f) continue;
        const a = ease((t - c.at) / 600);
        ctx.globalAlpha = a * (c === hoverServed ? 1 : .85);
        ctx.fillStyle = o.style === 'hatch' ? hatch : RED; if (o.style !== 'hatch') ctx.globalAlpha *= .25;
        ctx.beginPath(); path(c.f); ctx.fill();
        ctx.globalAlpha = a * (c === hoverServed ? 1 : .85);
        ctx.strokeStyle = RED; ctx.lineWidth = c === hoverServed ? 1.6 : .9;
        ctx.stroke(); ctx.globalAlpha = 1;
      }
    }

    /* hovered country outline */
    if (hovered) { ctx.strokeStyle = PAPER; ctx.lineWidth = 1.2; ctx.globalAlpha = .9; ctx.beginPath(); path(hovered); ctx.stroke(); ctx.globalAlpha = 1; }

    /* limb, drawn in as a sweep */
    if (GLOW) { const lg = ctx.createLinearGradient(cx + R, cy - R, cx - R, cy + R); lg.addColorStop(0, '#FF7A5C'); lg.addColorStop(.45, RED); lg.addColorStop(.8, 'rgba(143,23,18,.5)'); lg.addColorStop(1, COOL); ctx.strokeStyle = lg; ctx.lineWidth = 1.6; }
    else { ctx.strokeStyle = RED; ctx.lineWidth = 1.2; }
    ctx.globalAlpha = .9;
    ctx.beginPath(); ctx.arc(W / 2, H / 2, R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * limb); ctx.stroke(); ctx.globalAlpha = 1;

    /* dial bezel */
    if (o.style === 'dial') drawDial(limb);

    /* arcs */
    ctx.strokeStyle = RED;
    let counted = 0;
    for (const c of served) {
      if (c.home) { if (t >= c.start && !c.arrived) { c.arrived = true; c.at = t; } }
      else {
        const k = reduce ? 1 : ease((t - c.start) / (700 + c.dist * 420));
        if (k <= 0) continue;
        strokeArc(c, 0, k, .7, 1);
        if (c.name === hl && k >= 1) { ctx.strokeStyle = PAPER; strokeArc(c, 0, 1, 1, 2.4); ctx.strokeStyle = RED; }
        if (k < 1) { const h = arcPoint(c, k); if (h.vis) { ctx.fillStyle = PAPER; ctx.beginPath(); ctx.arc(h.x, h.y, 2.4, 0, 7); ctx.fill(); } }
        else if (!c.arrived) { c.arrived = true; c.at = t; }
      }
      if (c.arrived) {
        counted += c.count;
        const e = (t - c.at) / 1100;
        const q = p3(c.centroid, 1);
        if (q.vis && e < 1 && !reduce) { ctx.strokeStyle = RED; ctx.globalAlpha = 1 - e; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(q.x, q.y, 4 + 22 * ease(e), 0, 7); ctx.stroke(); ctx.globalAlpha = 1; }
        if (q.vis) { ctx.fillStyle = RED; ctx.beginPath(); ctx.arc(q.x, q.y, c === hoverServed ? c.mr + 1.5 : c.mr, 0, 7); ctx.fill(); }
      }
    }
    /* label chips on major client countries (glow style) */
    if (GLOW) {
      ctx.font = '600 10px ' + GFONT; ctx.textBaseline = 'middle';
      const boxes = [];
      for (const c of [...served].sort((a, b) => b.count - a.count)) {
        if (!c.arrived || (c.count < 4 && !c.home)) continue;
        const q = p3(c.centroid, 1); if (!q.vis) continue;
        const bw = ctx.measureText(c.label.toUpperCase()).width + 14, bx = q.x + 9, by = q.y - 28;
        if (boxes.some((b) => bx < b[0] + b[2] + 4 && bx + bw + 4 > b[0] && by < b[1] + 20 && by + 20 > b[1])) continue;
        boxes.push([bx, by, bw]);
        const a = Math.min(1, (t - c.at) / 500) * limb; if (a <= 0) continue;
        const txt = c.label.toUpperCase(), w = ctx.measureText(txt).width + 14, x = q.x + 9, y = q.y - 20;
        ctx.globalAlpha = a * .92; ctx.fillStyle = '#0E0B0A'; ctx.fillRect(x, y - 8, w, 16);
        ctx.fillStyle = RED; ctx.fillRect(x, y - 8, 2, 16);
        ctx.globalAlpha = a; ctx.fillStyle = PAPER; ctx.fillText(txt, x + 8, y + .5);
        ctx.strokeStyle = RED; ctx.lineWidth = .8; ctx.globalAlpha = a * .7; ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(x, y + 8); ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    if (o.onCount) o.onCount(Math.round(GLOBE.total * counted / totalCount), counted === totalCount);

    /* idle packets travelling the arcs */
    if (!reduce && t > served[served.length - 1].start + 1500 && t - lastPacket > 650) {
      const pool = served.filter((c) => !c.home);
      let r = Math.random() * pool.reduce((s, c) => s + c.count, 0), pick = pool[0];
      for (const c of pool) { r -= c.count; if (r <= 0) { pick = c; break; } }
      packets.push({ c: pick, t0: t });
      lastPacket = t;
    }
    for (let i = packets.length - 1; i >= 0; i--) {
      const pk = packets[i], s = (t - pk.t0) / 1600;
      if (s >= 1) { packets.splice(i, 1); continue; }
      ctx.strokeStyle = PAPER; strokeArc(pk.c, Math.max(0, s - .12), s, .9, 1.6);
    }

    /* origin crosshair: Karachi */
    const k = p3(ORIGIN, 1);
    if (k.vis) {
      ctx.strokeStyle = PAPER; ctx.lineWidth = 1; ctx.globalAlpha = .95 * limb;
      ctx.beginPath(); ctx.arc(k.x, k.y, 6, 0, 7);
      ctx.moveTo(k.x - 12, k.y); ctx.lineTo(k.x - 3, k.y); ctx.moveTo(k.x + 3, k.y); ctx.lineTo(k.x + 12, k.y);
      ctx.moveTo(k.x, k.y - 12); ctx.lineTo(k.x, k.y - 3); ctx.moveTo(k.x, k.y + 3); ctx.lineTo(k.x, k.y + 12);
      ctx.stroke(); ctx.globalAlpha = 1;
    }
    if (o.onReadout) o.onReadout(-rot[0], -rot[1]);
  }

  function drawDial(a) {
    const cx = W / 2, cy = H / 2, r0 = R + 10;
    ctx.strokeStyle = PAPER; ctx.fillStyle = PAPER; ctx.globalAlpha = .55 * a;
    ctx.font = '500 9px ' + GFONT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (let d = 0; d < 360; d += 5) {
      const ang = (d + rot[0]) * D - Math.PI / 2;
      const len = d % 30 === 0 ? 10 : d % 10 === 0 ? 6 : 3;
      ctx.beginPath(); ctx.moveTo(cx + Math.cos(ang) * r0, cy + Math.sin(ang) * r0);
      ctx.lineTo(cx + Math.cos(ang) * (r0 + len), cy + Math.sin(ang) * (r0 + len)); ctx.lineWidth = d % 30 === 0 ? 1 : .6; ctx.stroke();
      if (d % 30 === 0 && R > 120) ctx.fillText(String(d), cx + Math.cos(ang) * (r0 + 22), cy + Math.sin(ang) * (r0 + 22));
    }
    /* fixed index mark at top */
    ctx.globalAlpha = a; ctx.fillStyle = RED;
    ctx.beginPath(); ctx.moveTo(cx, cy - r0 + 2); ctx.lineTo(cx - 5, cy - r0 - 8); ctx.lineTo(cx + 5, cy - r0 - 8); ctx.fill();
    ctx.globalAlpha = 1;
  }

  /* interaction */
  let dragging = false, lx = 0, ly = 0, vx = 0, vy = 0;
  canvas.addEventListener('pointerdown', (e) => { dragging = true; lx = e.clientX; ly = e.clientY; vx = vy = 0; canvas.setPointerCapture(e.pointerId); canvas.style.cursor = 'grabbing'; });
  canvas.addEventListener('pointermove', (e) => {
    const b = canvas.getBoundingClientRect(), mx = e.clientX - b.left, my = e.clientY - b.top;
    if (dragging) {
      const dx = e.clientX - lx, dy = e.clientY - ly; lx = e.clientX; ly = e.clientY;
      const k = 0.25 * (260 / R);
      rot[0] += dx * k; rot[1] = Math.max(-60, Math.min(60, rot[1] - dy * k)); vx = dx * k; vy = -dy * k;
      setTip(null);
    } else {
      const ll = Math.hypot(mx - W / 2, my - H / 2) < R ? proj.invert([mx, my]) : null;
      hovered = ll ? features.find((f) => d3.geoContains(f, ll)) || null : null;
      hoverServed = hovered ? served.find((c) => c.f === hovered && c.arrived) || null : null;
      setTip(hovered, e.clientX, e.clientY);
      if (reduce) draw(1e9);
    }
  });
  const end = () => { dragging = false; canvas.style.cursor = 'grab'; };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);
  canvas.addEventListener('pointerleave', () => { hovered = hoverServed = null; setTip(null); });

  function setTip(f, x, y) {
    const tip = o.tip; if (!tip) return;
    if (!f) { tip.hidden = true; return; }
    const sc = served.find((c) => c.f === f);
    tip.innerHTML = '<b></b><span></span>';
    tip.querySelector('b').textContent = sc ? sc.label : f.properties.name;
    tip.querySelector('span').textContent = sc ? (sc.home ? 'Home base, ' : '') + sc.count + (sc.count === 1 ? ' project' : ' projects') : '';
    tip.style.transform = `translate(${Math.round(x + 14)}px, ${Math.round(y - 12)}px)`;
    tip.hidden = false;
  }

  resize();
  addEventListener('resize', () => { resize(); if (reduce) draw(1e9); });

  const api = {
    /* name = a GLOBE country name to show its arc from Karachi, or null to centre on Karachi */
    focus(name) {
      const c = name && served.find((x) => x.name === name);
      const ll = c ? c.interp(.5) : ORIGIN;
      hl = c ? c.name : null;
      focusT = [-ll[0], Math.max(-50, Math.min(50, -ll[1]))];
      if (reduce) { rot = [focusT[0], focusT[1], 0]; draw(1e9); }
    },
    release() { focusT = null; hl = null; },
  };
  if (reduce) { served.forEach((c) => { c.arrived = true; c.at = -1e9; }); draw(1e9); return api; }

  const T0 = performance.now(); let last = T0;
  let visible = true;
  if ('IntersectionObserver' in window) new IntersectionObserver((es) => { const was = visible; visible = es[0].isIntersecting; if (visible && !was) { last = performance.now(); requestAnimationFrame(loop); } }).observe(canvas);
  let pausedAt = 0, shift = 0;
  function loop(now) {
    if (!visible) { pausedAt = now; return; }
    if (pausedAt) { shift += now - pausedAt; pausedAt = 0; }
    const t = now - T0 - shift, dt = Math.min(now - last, 50); last = now;
    if (!dragging) {
      if (t < 1700) { const e = ease(t / 1700); rot[0] = HOME[0] + 110 * (1 - e); rot[1] = HOME[1] - 10 * (1 - e); }
      else if (focusT && Math.abs(vx) < .05) {
        const d0 = ((focusT[0] - rot[0] + 540) % 360) - 180;
        rot[0] += d0 * .06; rot[1] += (focusT[1] - rot[1]) * .06;
      }
      else { rot[0] += vx + dt * 0.004; rot[1] = Math.max(-60, Math.min(60, rot[1] + vy)); vx *= .94; vy *= .94; }
    }
    draw(t);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  return api;
}
