/* Deck core for the talk. Classic script, no dependencies.

   Inherits the Sandia/CNS deck contract (1920x1080 stage in an iframe, the
   player pushes its clock through __t(seconds), __seek(i) shows state i), with
   one change of architecture: every scene is DRAWN AS A PURE FUNCTION OF TIME.
   A scene lays its geometry out once in build(); draw(ctx, t) then sets every
   position, opacity and class from t alone. Nothing runs on its own timer.
   Consequences, all deliberate:
     - Pause freezes everything, because nothing moves unless t moves.
     - Seeking, stepping back and speed changes land on exactly the picture that
       uninterrupted playback would show at that moment.
     - Reduced motion shows each passage's settled end state.
   Scenes register with NCMA.scene({...}) in act files loaded before this one. */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var TL = (window.TIMELINE || { states: [] }).states;
  var PACE = (window.TIMELINE && window.TIMELINE.pace) || { wpm: 180, settle: 3 };
  var q = new URLSearchParams(location.search);
  var reduce = q.get('anim') === '0' || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  var stage = document.getElementById('stage'), fit = document.getElementById('fit'), field = document.getElementById('field');
  var kick = document.querySelector('.hd__kick'), title = document.querySelector('.hd__title');
  var kindEl = document.querySelector('.kind'), KIND = { toy: 'Illustrative rule', sim: 'Simulation', human: 'Human-group study', measured: 'Measured agent system', engineering: 'Engineering report', hypothesis: 'Untested hypothesis', schematic: 'Schematic' }, kindNow = '';
  var ftNote = document.querySelector('.ft__note'), ftSrc = document.querySelector('.ft__src'), live = document.getElementById('live');
  // scenes are matched to timeline states by id, so script load order does not matter
  var REG = {}; ((window.NCMA && NCMA.scenes) || []).forEach(function (d) { REG[d.id] = d; });
  var SC = TL.map(function (s) { return REG[s.id] || { id: s.id, missing: true, build: function (svg, U) { U.text(svg, 884, 400, 'Scene "' + s.id + '" is missing', 'cap', { 'text-anchor': 'middle' }); }, draw: function () {} }; });

  // ---- helpers handed to every scene ------------------------------------------------
  var U = {};
  U.el = function (tag, attrs, parent) { var e = document.createElementNS(NS, tag); if (attrs) for (var k in attrs) if (attrs[k] != null) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; };
  U.g = function (parent, cls, attrs) { var a = attrs || {}; if (cls) a['class'] = cls; return U.el('g', a, parent); };
  U.text = function (parent, x, y, str, cls, attrs) { var t = U.el('text', Object.assign({ x: x, y: y, 'class': cls || 'lab' }, attrs || {}), parent); t.textContent = str; return t; };
  U.lines = function (parent, x, y, arr, cls, lh, attrs) {
    var t = U.el('text', Object.assign({ x: x, y: y, 'class': cls || 'cap' }, attrs || {}), parent);
    arr.forEach(function (s, i) { var ts = U.el('tspan', { x: x, dy: i ? (lh || 34) : 0 }, t); ts.textContent = s; }); return t;
  };
  U.setText = function (t, s) { if (t.textContent !== s) t.textContent = s; };
  // easing and time windows
  U.clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  U.ease = function (p) { return p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; };
  U.lin = function (t, t0, d) { return d <= 0 ? (t >= t0 ? 1 : 0) : U.clamp((t - t0) / d, 0, 1); };
  U.ramp = function (t, t0, d) { return U.ease(U.lin(t, t0, d)); };
  U.after = function (t, t0) { return t >= t0; };
  U.op = function (e, o) { if (!e) return; var s = o >= 0.999 ? '' : String(+o.toFixed(3)); if (e.style.opacity !== s) e.style.opacity = s; };
  U.fade = function (e, t, t0, d, from, to) { var p = U.ramp(t, t0, d == null ? 0.6 : d); U.op(e, (from == null ? 0 : from) + ((to == null ? 1 : to) - (from == null ? 0 : from)) * p); return p; };
  U.cls = function (e, name, on) { if (e && e.classList.contains(name) !== !!on) e.classList.toggle(name, !!on); };
  U.place = function (e, x, y, s) { var v = 'translate(' + x.toFixed(1) + ',' + y.toFixed(1) + ')' + (s != null && s !== 1 ? ' scale(' + s.toFixed(3) + ')' : ''); if (e.getAttribute('transform') !== v) e.setAttribute('transform', v); };
  U.along = function (pts, p) {
    if (pts.length === 1) return pts[0];
    var seg = [], tot = 0; for (var i = 1; i < pts.length; i++) { var d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(d); tot += d; }
    var want = p * tot; for (var j = 0; j < seg.length; j++) { if (want <= seg[j] || j === seg.length - 1) { var f = seg[j] ? U.clamp(want / seg[j], 0, 1) : 1; return [pts[j][0] + (pts[j + 1][0] - pts[j][0]) * f, pts[j][1] + (pts[j + 1][1] - pts[j][1]) * f]; } want -= seg[j]; }
    return pts[pts.length - 1];
  };
  // a token travelling a path between t0 and t0+d. Hidden before; at the end it stays (hold) or vanishes.
  U.fly = function (tok, pts, t, t0, d, hold) {
    if (t < t0) { U.op(tok, 0); return 0; }
    var p = U.ramp(t, t0, d), xy = U.along(pts, p);
    U.place(tok, xy[0], xy[1]);
    var o = Math.min(1, (t - t0) / 0.15);
    if (p >= 1 && !hold) o = Math.max(0, 1 - (t - t0 - d) / 0.25);
    U.op(tok, o); return p;
  };
  U.seg = function (a, b, r1, r2) { var dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1; return [[a[0] + dx / d * r1, a[1] + dy / d * r1], [b[0] - dx / d * r2, b[1] - dy / d * r2]]; };
  // nodes, links, tokens
  U.agent = function (parent, o) {
    var r = o.r || 34, g = U.g(parent, 'ag' + (o.cls ? ' ' + o.cls : ''));
    U.place(g, o.x, o.y);
    var shape;
    if (o.role === 'tool') shape = U.el('rect', { x: -r, y: -r * 0.78, width: 2 * r, height: 1.56 * r, rx: 8, 'class': 'nd nd--tool' }, g);
    else if (o.role === 'human') { var p = []; for (var i = 0; i < 6; i++) { var a = Math.PI / 6 + i * Math.PI / 3; p.push((r * Math.cos(a)).toFixed(1) + ',' + (r * Math.sin(a)).toFixed(1)); } shape = U.el('path', { d: 'M' + p.join(' L') + ' Z', 'class': 'nd nd--human' }, g); }
    else if (o.role === 'doc') shape = U.el('path', { d: 'M' + (-r * 0.8) + ',' + (-r) + ' H' + (r * 0.45) + ' L' + (r * 0.8) + ',' + (-r * 0.65) + ' V' + r + ' H' + (-r * 0.8) + ' Z', 'class': 'nd nd--doc' }, g);
    else { shape = U.el('circle', { r: r, 'class': 'nd' }, g); if (o.role === 'hub') U.el('circle', { r: r + 9, 'class': 'nd nd--ring' }, g); }
    var mark = U.text(g, 0, 1, o.mark || '', 'nd__mark');
    var lab = o.label ? U.text(g, o.lx != null ? o.lx : 0, o.ly != null ? o.ly : r + 36, o.label, o.labCls || 'lab', { 'text-anchor': o.anchor || 'middle' }) : null;
    return { g: g, shape: shape, mark: mark, label: lab, x: o.x, y: o.y, r: r };
  };
  U.link = function (parent, a, b, o) {
    o = o || {};
    var s = U.seg([a.x, a.y], [b.x, b.y], (a.r || 0) + 6, (b.r || 0) + 6), d;
    if (o.bend) { var mx = (s[0][0] + s[1][0]) / 2, my = (s[0][1] + s[1][1]) / 2, dx = s[1][0] - s[0][0], dy = s[1][1] - s[0][1]; d = 'M' + s[0][0] + ',' + s[0][1] + ' Q' + (mx - dy * o.bend) + ',' + (my + dx * o.bend) + ' ' + s[1][0] + ',' + s[1][1]; }
    else d = 'M' + s[0][0].toFixed(1) + ',' + s[0][1].toFixed(1) + ' L' + s[1][0].toFixed(1) + ',' + s[1][1].toFixed(1);
    var p = U.el('path', { d: d, 'class': 'ln' + (o.cls ? ' ' + o.cls : '') }, parent);
    if (o.arrow) p.setAttribute('marker-end', 'url(#arrow)');
    p._pts = s; return p;
  };
  // token kinds: evidence (hollow ring), conclusion (solid disc), both, instruction (square),
  // altered (ring+bar), lost (x), introduced (diamond), hedged (dashed ring), injected (alert square)
  U.token = function (parent, kind, o) {
    o = o || {}; var r = o.r || 15, g = U.g(parent, 'tk tk--' + kind);
    if (kind === 'evidence') U.el('circle', { r: r, 'class': 'tk-ring' + (o.cls ? ' ' + o.cls : '') }, g);
    else if (kind === 'hedged') U.el('circle', { r: r, 'class': 'tk-ring tk-hedge' }, g);
    else if (kind === 'conclusion') U.el('circle', { r: r, 'class': 'tk-disc' }, g);
    else if (kind === 'both') { U.el('circle', { r: r + 2, 'class': 'tk-ring' }, g); U.el('circle', { r: r * 0.45, 'class': 'tk-core' }, g); }
    else if (kind === 'instruction') U.el('rect', { x: -r * 0.85, y: -r * 0.85, width: r * 1.7, height: r * 1.7, rx: 3, 'class': 'tk-sq' }, g);
    else if (kind === 'injected') { U.el('rect', { x: -r * 0.9, y: -r * 0.9, width: r * 1.8, height: r * 1.8, rx: 3, 'class': 'tk-bad' }, g); U.el('path', { d: 'M' + (-r * 0.45) + ',' + (-r * 0.45) + ' L' + (r * 0.45) + ',' + (r * 0.45) + ' M' + (r * 0.45) + ',' + (-r * 0.45) + ' L' + (-r * 0.45) + ',' + (r * 0.45), 'class': 'tk-bad' }, g); }
    else if (kind === 'altered') { U.el('circle', { r: r, 'class': 'tk-ring' }, g); U.el('line', { x1: -r * 0.55, y1: 0, x2: r * 0.55, y2: 0, 'class': 'tk-bar' }, g); }
    else if (kind === 'lost') U.el('path', { d: 'M' + (-r * 0.7) + ',' + (-r * 0.7) + ' L' + (r * 0.7) + ',' + (r * 0.7) + ' M' + (r * 0.7) + ',' + (-r * 0.7) + ' L' + (-r * 0.7) + ',' + (r * 0.7), 'class': 'tk-x' }, g);
    else if (kind === 'introduced') U.el('path', { d: 'M0,' + (-r * 1.1) + ' L' + (r * 1.1) + ',0 L0,' + (r * 1.1) + ' L' + (-r * 1.1) + ',0 Z', 'class': 'tk-dia' }, g);
    else U.el('circle', { r: r * 0.6, 'class': 'tk-core' }, g);
    if (o.label != null) U.text(g, 0, 1, String(o.label), 'tk-lab' + (kind === 'conclusion' ? ' tk-lab--dark' : ''));
    U.op(g, 0); return g;
  };
  U.em = function (e, level) { if (!e) return; var v = level == null || level === 2 ? null : String(level); if (e.getAttribute('data-em') !== v) { if (v == null) e.removeAttribute('data-em'); else e.setAttribute('data-em', v); } };
  U.CX = 884; U.CY = 400; // centre of the field (field is 1768 x 800)

  // ---- timing: passage cues and reading positions, bound to the current state ---------
  function cueFn(i) {
    var s = TL[i] || { paragraphs: [], duration: 60 };
    var cue = function (k, dt) { var p = s.paragraphs[Math.min(k, s.paragraphs.length - 1)]; return (p ? p.at : 0) + (dt || 0); };
    var say = function (k, phrase, dt) {
      var p = s.paragraphs[k]; if (!p) return 0; var j = p.text.indexOf(phrase);
      if (j < 0) { if (window.console) console.error('[deck] phrase not found in ' + s.id + ' passage ' + k + ': ' + phrase); return p.at + (dt || 0); }
      var words = p.text.slice(0, j).split(/\s+/).filter(Boolean).length;
      return p.at + PACE.settle + words / (PACE.wpm / 60) + (dt || 0);
    };
    return { cue: cue, say: say, dur: s.duration, n: s.paragraphs.length };
  }

  // ---- state machine ---------------------------------------------------------------
  var idx = 0, t = 0, drawn = -1, navCount = 0, driven = 0;
  var byId = {}; SC.forEach(function (s, i) { byId[s.id] = i; });
  var problems = SC.filter(function (s) { return s.missing; }).map(function (s) { return 'missing scene ' + s.id; });
  Object.keys(REG).forEach(function (id) { if (byId[id] == null) problems.push('scene ' + id + ' has no timeline state'); });
  if (problems.length && window.console) console.error('[deck] scene/timeline mismatch:\n  ' + problems.join('\n  '));

  function svgFor(sc) {
    var svg = U.el('svg', { viewBox: '0 0 1768 800', 'class': 'fld', role: 'img' });
    var defs = U.el('defs', null, svg), mk = U.el('marker', { id: 'arrow', viewBox: '0 0 10 10', refX: 8.5, refY: 5, markerWidth: 14, markerHeight: 14, markerUnits: 'userSpaceOnUse', orient: 'auto-start-reverse' }, defs);
    U.el('path', { d: 'M0,1 L9,5 L0,9 z', 'class': 'arrowhead' }, mk);
    return svg;
  }
  function show(i) {
    idx = Math.max(0, Math.min(SC.length - 1, i));
    SC.forEach(function (s, j) { if (s.pg) s.pg.hidden = j !== idx; });
    var sc = SC[idx];
    if (!sc.pg) {
      sc.pg = document.createElement('div'); sc.pg.className = 'pg'; field.appendChild(sc.pg);
      var svg = svgFor(sc); sc.pg.appendChild(svg);
      var T = cueFn(idx); U.cue = T.cue; U.say = T.say; U.dur = T.dur;
      sc.ctx = sc.build(svg, U) || {}; sc.ctx.svg = svg; sc.timing = T;
    }
    sc.pg.hidden = false;
    var s = TL[idx] || {};
    kick.textContent = s.act || sc.act || '';
    title.textContent = s.heading || sc.title || '';
    title.classList.toggle('hd__title--long', title.textContent.length > 70);
    document.querySelector('.hd').style.visibility = sc.noHeader ? 'hidden' : '';
    // the status badge now states that a scene follows stated rules; the footer keeps only the specifics (seed, runs)
    ftNote.textContent = (sc.note || '').replace(/^Illustrative model · outcomes follow from stated rules( · )?/, '');
    ftSrc.textContent = sc.source || '';
    var svgEl = sc.pg.querySelector('svg'); if (svgEl) svgEl.setAttribute('aria-label', (s.heading || '') + '. ' + (sc.desc || ''));
    if (live) live.textContent = s.heading || '';
    t = 0; drawn = -1; draw();
  }
  // under reduced motion, show the settled state at the end of the current passage
  function settled(sec) {
    var s = TL[idx]; if (!s) return sec;
    var k = 0; s.paragraphs.forEach(function (p, j) { if (p.at <= sec) k = j; });
    var end = s.paragraphs[k + 1] ? s.paragraphs[k + 1].at - 0.05 : s.duration;
    return end;
  }
  function draw() {
    var sc = SC[idx]; if (!sc) return;
    var tt = reduce ? settled(t) : t;
    if (tt === drawn) return;
    drawn = tt;
    var T = sc.timing; U.cue = T.cue; U.say = T.say; U.dur = T.dur;
    var st = TL[idx], kd = '';
    if (st && !sc.noHeader) st.paragraphs.forEach(function (p) { if (p.at <= tt + 0.01 && p.kind) kd = p.kind; });
    if (st && !kd && !sc.noHeader) { var f = st.paragraphs.filter(function (p) { return p.kind; })[0]; if (f && f === st.paragraphs[0]) kd = f.kind; }
    if (kd !== kindNow) { kindNow = kd; kindEl.textContent = KIND[kd] || ''; kindEl.className = 'kind' + (kd ? ' kind--' + kd : ''); }
    try { sc.draw(sc.ctx, tt, U); } catch (e) { if (window.console) console.error('[deck] ' + sc.id + ': ' + (e && e.stack || e)); }
  }

  // standalone clock: runs only when no player drives the deck
  var last = 0;
  function tick(now) {
    var dt = last ? Math.min((now - last) / 1000, 0.25) : 0; last = now;
    if (Date.now() - driven > 800 && !paused) { t = Math.min(t + dt, (TL[idx] || { duration: 60 }).duration); }
    draw();
    requestAnimationFrame(tick);
  }
  var paused = q.get('hold') === '1';

  document.addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === 'ArrowRight') { show(idx + 1); navCount++; }
    else if (e.key === 'ArrowLeft') { show(idx - 1); navCount++; }
  });
  function resize() { stage.style.setProperty('--k', Math.min(fit.clientWidth / 1920, fit.clientHeight / 1080)); }
  addEventListener('resize', resize);

  // ---- QA hooks ----------------------------------------------------------------------
  window.__qaText = function () {
    var sc = SC[idx]; if (!sc.pg) return [];
    var ts = Array.prototype.slice.call(sc.pg.querySelectorAll('text')).filter(function (e) {
      if (!e.textContent.trim()) return false; var o = 1, n = e; while (n && n !== stage) { var c = getComputedStyle(n); if (c.display === 'none') return false; o *= +c.opacity; n = n.parentElement; } return o > 0.3;
    });
    var bx = ts.map(function (e) { return [e, e.getBoundingClientRect()]; }), hits = [];
    for (var i = 0; i < bx.length; i++) for (var j = i + 1; j < bx.length; j++) { var a = bx[i][1], b = bx[j][1]; var ox = Math.min(a.right, b.right) - Math.max(a.left, b.left), oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top); if (ox > 3 && oy > 3) hits.push([bx[i][0].textContent.slice(0, 30), bx[j][0].textContent.slice(0, 30)]); }
    return hits;
  };
  window.__qaBounds = function () {
    var sc = SC[idx]; if (!sc.pg) return [];
    var k = parseFloat(getComputedStyle(stage).getPropertyValue('--k')) || 1, sb = stage.getBoundingClientRect(), out = [];
    sc.pg.querySelectorAll('text').forEach(function (e) {
      var o = 1, n = e; while (n && n !== stage) { var c = getComputedStyle(n); if (c.display === 'none') { o = 0; break; } o *= +c.opacity; n = n.parentElement; } if (o < 0.3 || !e.textContent.trim()) return;
      var r = e.getBoundingClientRect(), l = (r.left - sb.left) / k, rr = (r.right - sb.left) / k, tp = (r.top - sb.top) / k, bt = (r.bottom - sb.top) / k;
      if (l < 40 || rr > 1880 || tp < 30 || bt > 1050) out.push(e.textContent.slice(0, 30));
    });
    return out;
  };
  window.__signature = function () { // visible marks, for frozen-pause and seek-equivalence tests
    var sc = SC[idx]; if (!sc.pg) return '';
    return Array.prototype.slice.call(sc.pg.querySelectorAll('text,circle,rect,path,line,g.tk')).map(function (e) {
      var o = 1, n = e; while (n && n !== stage) { var c = getComputedStyle(n); if (c.display === 'none') { o = 0; break; } o *= +c.opacity; n = n.parentElement; }
      if (o < 0.05) return null; return e.tagName + ':' + (e.tagName === 'text' ? e.textContent : '') + ':' + o.toFixed(2) + ':' + (e.getAttribute('transform') || '') + ':' + (e.getAttribute('class') || '');
    }).filter(Boolean).join('|');
  };

  // ---- boot and player contract --------------------------------------------------------
  var booted = false;
  function boot() {
    if (booted) return; booted = true; resize();
    var start = byId[q.get('id')] != null ? byId[q.get('id')] : (parseInt(q.get('s') || '0', 10) || 0);
    show(start); if (q.get('t')) { t = +q.get('t'); driven = Date.now() + 1e9; }
    requestAnimationFrame(tick);
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(boot);
  setTimeout(boot, 350);
  window.__deckReady = true;
  window.__problems = problems;
  window.__seek = function (i) { show(i); };
  window.__state = function () { return idx; };
  window.__nav = function () { return navCount; };
  window.__t = function (sec) { driven = Date.now(); t = sec; draw(); };
  window.__time = function () { return t; };
  window.__ids = function () { return SC.map(function (s) { return s.id; }); };
})();
