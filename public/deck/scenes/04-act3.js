// @scenes counted-twice provenance-record hub-evidence hub-answers
/* Act III scenes: what messages become, and where they came from.
   Every draw() is a pure function of t. U.cue(k) starts passage k; U.say(k, phrase)
   is when the reader reaches the phrase. Toy outcomes are computed here or by
   NCMA.models; reported findings draw only values their sources give. */
(function () {
  'use strict';
  var NCMA = window.NCMA, M = NCMA.models;
  var ILL = 'Illustrative model · outcomes follow from stated rules';
  var C = { text: 'var(--text)', t2: 'var(--t2)', mu: 'var(--muted)', mint: 'var(--mint)', warm: 'var(--warm)', alert: 'var(--alert)', blue: 'var(--blue)' };
  function clear(g) { while (g.firstChild) g.removeChild(g.firstChild); }
  function sty(e, fill, deco, w) { if (!e) return; if (e.style.fill !== fill) e.style.fill = fill; var d = deco || 'none'; if (e.style.textDecoration !== d) e.style.textDecoration = d; var ww = w || ''; if (e.style.fontWeight !== ww) e.style.fontWeight = ww; }

  // ------------------------------------------------------------------ the relay sentence
  /* An authored relay: one sentence restated by four agents. Each version is a list of
     lines, each line a list of [text, flags]. Flags: tok = a key term a word check looks
     for, num = the number, n = new or changed at this hop, x = removed or changed at the
     next hop. The edits are written to show one kind of change at a time. */
  var VERS = [
    [[['A ', ''], ['preliminary', ''], [' study of ', ''], ['one district', ''], [' found that the new ', ''], ['routing rule', 'tok']],
     [['may', ''], [' cut ', ''], ['response times', 'tok'], [' by ', ''], ['about', ''], [' ', ''], ['10 percent', 'num'], [', according to the ', ''], ['transport office', ''], ['.', '']]],
    [[['In ', ''], ['one district', ''], [', ', ''], ['a preliminary study found', 'x'], [' the new ', ''], ['routing rule', 'tok']],
     [['may', 'x'], [' cut ', ''], ['response times', 'tok'], [' by ', ''], ['about', ''], [' ', ''], ['10 percent', 'num'], [', the ', ''], ['transport office', ''], [' reported.', '']]],
    [[['The new ', ''], ['routing rule', 'tok'], [' ', ''], ['will', 'n x'], [' cut ', ''], ['response times', 'tok'], [' by ', ''], ['about', 'x'], [' ', ''], ['10 percent', 'num']],
     [['in one district', 'x'], [', the ', ''], ['transport office reported', 'x'], ['.', '']]],
    [[['The new ', ''], ['routing rule', 'tok'], [' ', ''], ['cut', 'n'], [' ', ''], ['response times', 'tok'], [' by ', ''], ['10 percent', 'num'], [',', '']],
     [['officials said', 'n x'], ['.', '']]],
    [[['The new ', ''], ['routing rule', 'tok'], [' cut ', ''], ['response times', 'tok'], [' by ', ''], ['10 percent', 'num']],
     [['and is being rolled out citywide', 'n'], ['.', '']]]
  ];
  var plain = function (v) { return v.map(function (l) { return l.map(function (s) { return s[0]; }).join(''); }).join(' '); };
  var KEY = ['routing rule', 'response times', '10 percent'];
  // word check: every key term present. claim check: still possible, still local, still attributed.
  var WORDOK = VERS.map(function (v) { var p = plain(v); return KEY.every(function (k) { return p.indexOf(k) >= 0; }); });
  var CLAIMOK = VERS.map(function (v) { var p = plain(v); return /\bmay\b/.test(p) && p.indexOf('one district') >= 0 && p.indexOf('transport office') >= 0; });

  function sentence(U, parent, cx, y, v, lh, cls) {
    var g = U.g(parent), segs = [];
    v.forEach(function (line, i) {
      var t = U.el('text', { x: cx, y: y + i * lh, 'class': cls || 'word--lg', 'text-anchor': 'middle' }, g);
      line.forEach(function (s) { var ts = U.el('tspan', null, t); ts.textContent = s[0]; segs.push({ el: ts, f: s[1] }); });
    });
    g.segs = segs; U.op(g, 0); return g;
  }
  // mode: 'plain' | 'mark' (x segments struck) | 'tok' (key terms lit) | 'claim' (changed parts in alert)
  function paint(g, mode) {
    g.segs.forEach(function (s) {
      var f = s.f, fill = C.text, deco = '', w = '';
      if (/num/.test(f)) { fill = C.mint; w = '600'; }
      if (/\bn\b/.test(f)) fill = C.warm;
      if (mode === 'mark' && /\bx\b/.test(f)) { fill = C.alert; deco = 'line-through'; }
      if (mode === 'tok') { if (/tok|num/.test(f)) { fill = C.mint; deco = 'underline'; w = '600'; } else fill = C.t2; }
      if (mode === 'claim') { fill = /\bn\b/.test(f) ? C.alert : /num/.test(f) ? C.t2 : C.text; w = /\bn\b/.test(f) ? '600' : ''; }
      sty(s.el, fill, deco, w);
    });
  }
  function relayRow(U, svg, y, r) {
    var c = { n: [] };
    c.src = U.agent(svg, { x: 150, y: y, r: r + 2, role: 'doc', label: 'source', ly: r + 40 });
    c.n.push(c.src);
    [500, 830, 1160, 1490].forEach(function (x, i) { c.n.push(U.agent(svg, { x: x, y: y, r: r, label: 'agent ' + (i + 1), ly: r + 40 })); });
    c.l = []; for (var i = 1; i < 5; i++) c.l.push(U.link(svg, c.n[i - 1], c.n[i], { arrow: true }));
    c.tk = U.token(svg, 'evidence', { r: 14 });
    return c;
  }

  NCMA.scene({ id: 'relay', note: 'Illustrative · rewrites written for this talk, not model outputs', desc: 'A source document and four agents in a row. The sentence they pass along is printed large beneath them and changes at each hop: the words about to change are struck in red, then the new version appears with changed words in amber. A row of seven qualifications below records each change: preliminary lost, may cut becomes will cut and then cut, one district lost, about lost, transport office becomes officials and then is lost, citywide added, and 10 percent kept at every hop.',
    build: function (svg, U) {
      var c = relayRow(U, svg, 70, 34);
      c.vlab = U.text(svg, 884, 220, '', 'lab', { 'text-anchor': 'middle' });
      c.vers = VERS.map(function (v) { return sentence(U, svg, 884, 290, v, 52); });
      // the qualifications, in sentence order, and what happens to each at hops 1..4
      var Q = [
        ['preliminary', 'hedge', ['k', 'k', 'l', 'l', 'l']],
        ['one district', 'scope', ['k', 'k', 'k', 'l', 'l']],
        ['may cut', 'status', ['k', 'k', 'c:will cut', 'a:cut', 'a:cut']],
        ['about', 'precision', ['k', 'k', 'k', 'l', 'l']],
        ['10 percent', 'number', ['m', 'm', 'm', 'm', 'm']],
        ['transport office', 'source', ['k', 'k', 'k', 'c:officials', 'l']],
        ['citywide', 'addition', ['h', 'h', 'h', 'h', 'c:citywide']]
      ];
      c.chips = Q.map(function (q, i) {
        var g = U.g(svg), x = 140 + i * 248;
        var t = U.text(g, x, 520, q[0], 'cap', { 'text-anchor': 'middle' });
        var u = U.el('line', { x1: x - 90, y1: 538, x2: x + 90, y2: 538, 'class': 'rule' }, g);
        var k = U.text(g, x, 590, q[1], 'lab', { 'text-anchor': 'middle' });
        return { g: g, t: t, u: u, k: k, q: q };
      });
      c.cap = U.text(svg, 884, 700, '', 'word--lg', { 'text-anchor': 'middle' });
      return c;
    },
    draw: function (c, t, U) {
      var hop = [0, U.say(1, 'The first agent'), U.say(1, 'The second drops'), U.say(1, 'The third agent'), U.say(1, 'The fourth drops')], D = 1.6;
      var h = 0; for (var k = 1; k <= 4; k++) if (t >= hop[k] + D) h = k;
      var marking = h < 4 && h >= 1 && t >= hop[h + 1] - 0.0 && t < hop[h + 1] + D;
      U.op(c.n[0].g, 1);
      c.n.forEach(function (a, i) { U.cls(a.g, 'is-on', i === h); });
      c.l.forEach(function (l, i) { U.cls(l, 'is-live', h < 4 && i === h && t >= hop[h + 1] && t < hop[h + 1] + D); });
      if (h < 4 && t >= hop[1] && t >= hop[h + 1] && t < hop[h + 1] + D) U.fly(c.tk, [[c.n[h].x + 40, 70], [c.n[h + 1].x - 40, 70]], t, hop[h + 1], D, false); else U.op(c.tk, 0);
      var on = U.ramp(t, 0.6, 0.8);
      c.vers.forEach(function (g, i) { U.op(g, i === h ? on : 0); if (i === h) paint(g, marking ? 'mark' : 'plain'); });
      U.setText(c.vlab, h === 0 ? 'the source' : 'after agent ' + h); U.op(c.vlab, on);
      // chips appear as the passage names each qualification
      var named = [U.say(0, 'the study is preliminary'), U.say(0, 'it was seen in one district'), U.say(0, 'the effect may occur'), U.say(0, 'the figure is approximate'), U.say(0, 'Besides its number'), U.say(0, 'a named office'), 1e9];
      c.chips.forEach(function (ch, i) {
        var st = ch.q[2][h], vis = i === 6 ? (h === 4 ? U.ramp(t, hop[4] + D, 0.6) : 0) : U.ramp(t, named[i], 0.6);
        U.op(ch.g, vis);
        var label = st.indexOf(':') > 0 ? st.split(':')[1] : ch.q[0], kind = st.charAt(0);
        U.setText(ch.t, label);
        var fill = kind === 'm' ? C.mint : kind === 'c' ? C.warm : kind === 'a' || kind === 'l' ? C.alert : C.text;
        sty(ch.t, fill, kind === 'l' ? 'line-through' : '', kind === 'm' ? '600' : '');
        U.op(ch.t, kind === 'l' ? 0.6 : 1);
        ch.u.style.stroke = kind === 'm' ? C.mint : kind === 'k' ? C.mint : kind === 'c' ? C.warm : C.alert;
        U.op(ch.k, U.ramp(t, U.say(2, 'Each edit is'), 0.8));
        U.cls(ch.k, 'lab--hi', kind === 'm');
      });
      U.setText(c.cap, 'the number survived · the qualifications did not');
      U.op(c.cap, U.ramp(t, U.say(2, 'Almost everything'), 0.8));
    } });

  // ------------------------------------------------------------------ token check
  NCMA.scene({ id: 'token-check', note: 'Illustrative · both checks computed from the five versions shown', source: 'Peters & Chin-Yee, 2025', desc: 'The five versions of the relayed sentence are scanned one at a time. A row labeled key words present fills with pass under the source and all four agents, while the key terms are lit in each sentence. A second row, claim intact, fills with pass, pass, fail, fail, fail, while the changed words are lit in red. A line reads: words survived 5 of 5, claim survived 2 of 5. Then three words, tokens, meaning, justification, appear with only tokens in mint. Last, a bracket over the first hop reads measured at one step, and a dashed bracket over the later hops reads qualifiers not tracked across hops.',
    build: function (svg, U) {
      var c = {};
      c.vers = VERS.map(function (v) { return sentence(U, svg, 884, 60, v, 50); });
      c.X = [560, 840, 1120, 1400, 1680];
      c.heads = ['source', 'agent 1', 'agent 2', 'agent 3', 'agent 4'].map(function (s, i) { return U.text(svg, c.X[i], 250, s, 'lab', { 'text-anchor': 'middle' }); });
      c.scan = U.el('rect', { x: -110, y: 205, width: 220, height: 345, rx: 10, 'class': 'box box--hi' }, svg);
      c.rowW = U.text(svg, 40, 352, 'key words present', 'lab'); c.rowC = U.text(svg, 40, 482, 'claim intact', 'lab');
      c.mW = c.X.map(function (x) { return U.text(svg, x, 360, '', 'word--lg', { 'text-anchor': 'middle' }); });
      c.mC = c.X.map(function (x) { return U.text(svg, x, 490, '', 'word--lg', { 'text-anchor': 'middle' }); });
      c.sum = U.text(svg, 884, 640, '', 'word--lg', { 'text-anchor': 'middle' });
      c.tri = U.g(svg);
      c.triW = ['tokens', 'meaning', 'justification'].map(function (s, i) { return U.text(c.tri, 470 + i * 414, 650, s, 'big', { 'text-anchor': 'middle' }); });
      c.triCap = U.text(c.tri, 884, 730, 'a token check can establish only the first', 'lab', { 'text-anchor': 'middle' });
      c.br1 = U.el('path', { d: 'M560,600 L560,620 L840,620 L840,600', 'class': 'ln is-live' }, svg);
      c.br1t = U.text(svg, 700, 670, 'measured at one step', 'lab lab--hi', { 'text-anchor': 'middle' });
      c.br2 = U.el('path', { d: 'M840,700 L840,720 L1680,720 L1680,700', 'class': 'ln ln--dash' }, svg);
      c.br2t = U.text(svg, 1260, 770, 'qualifiers not tracked across hops', 'lab', { 'text-anchor': 'middle' });
      return c;
    },
    draw: function (c, t, U) {
      var t0 = U.say(0, 'The check reads each version'), t1 = U.say(1, 'The source and the first'), step = 1.5;
      var kW = Math.floor((t - t0) / step), kC = Math.floor((t - t1) / step);
      var scanning = t >= t1 ? (kC <= 4 ? ['C', kC] : null) : t >= t0 && kW <= 4 ? ['W', kW] : null;
      var showV = scanning ? scanning[1] : t >= t1 ? 4 : t >= t0 ? 4 : 0, mode = scanning ? (scanning[0] === 'W' ? 'tok' : 'claim') : t >= t1 ? 'claim' : t >= t0 ? 'tok' : 'plain';
      var p3 = U.cue(3), late = t >= U.cue(2);
      c.vers.forEach(function (g, i) { U.op(g, i === showV ? (late ? 0.5 : 1) : 0); if (i === showV) paint(g, mode); });
      if (scanning) { U.op(c.scan, 1); c.scan.setAttribute('x', c.X[scanning[1]] - 110); } else U.op(c.scan, 0);
      c.X.forEach(function (x, i) {
        var w = t >= t0 + i * step + 0.6, cc = t >= t1 + i * step + 0.6;
        U.setText(c.mW[i], w ? (WORDOK[i] ? 'pass' : 'fail') : ''); sty(c.mW[i], WORDOK[i] ? C.mint : C.alert);
        U.setText(c.mC[i], cc ? (CLAIMOK[i] ? 'pass' : 'fail') : ''); sty(c.mC[i], CLAIMOK[i] ? C.mint : C.alert);
        U.op(c.mW[i], t >= p3 ? 0.35 : 1); U.op(c.mC[i], t >= p3 ? 0.35 : 1);
      });
      U.op(c.rowC, U.ramp(t, U.cue(1), 0.6));
      var nW = WORDOK.filter(Boolean).length, nC = CLAIMOK.filter(Boolean).length;
      U.setText(c.sum, 'words survived ' + nW + ' of 5  ·  claim survived ' + nC + ' of 5');
      U.op(c.sum, t >= U.cue(2) ? 0 : U.ramp(t, U.say(1, 'The first check was not wrong'), 0.8));
      U.op(c.tri, t >= p3 ? 0 : U.ramp(t, U.say(2, 'Its tokens are'), 0.8));
      sty(c.triW[0], C.mint); sty(c.triW[1], C.t2); sty(c.triW[2], C.t2);
      U.op(c.triW[1], U.ramp(t, U.say(2, 'Its meaning is'), 0.6)); U.op(c.triW[2], U.ramp(t, U.say(2, 'Its justification is'), 0.6));
      U.op(c.triCap, U.ramp(t, U.say(2, 'A token check can establish'), 0.6));
      [c.br1, c.br1t].forEach(function (e) { U.op(e, U.ramp(t, U.say(3, 'That is a change of scope'), 0.8)); });
      [c.br2, c.br2t].forEach(function (e) { U.op(e, U.ramp(t, U.say(3, 'No study found'), 0.8)); });
      c.heads.forEach(function (h, i) { U.cls(h, 'lab--hi', t >= U.say(3, 'That is a change of scope') && i <= 1); });
    } });

  // ------------------------------------------------------------------ the mutation study
  // Table 1 of the study: transformations on the message-carrying route, and model calls per run
  var ARCH = [['linear chain', 11, 11], ['ring with shortcuts', 6, 14], ['hub and spoke', 2, 11], ['directed hierarchy', 3, 11], ['lattice', 11, 16], ['bidirectional lattice', 14, 28]];
  NCMA.scene({ id: 'mutation-study', note: 'Reported finding · design values from the study, findings stated in words', source: 'Gladstone & Brashears, in press', desc: 'Left: six architectures in rows, each with a row of dots counting the transformations on the shortest route from seed to output (11, 6, 2, 3, 11 and 14) and its model calls per run (11, 14, 11, 11, 16 and 28). Right: three coders. Fidelity: a difference detected by all three. Unsupported content: less consistent across seeds and coders. Divergence across runs: detected by the primary coder only, not reproduced by the two other coders or an embedding measure. Last, the linear chain row is marked from agent 1 to agent 11: fidelity lower and unsupported content higher at the eleventh.',
    build: function (svg, U) {
      var c = { rows: [] };
      c.hd1 = U.text(svg, 345, 40, 'rewrites on the shortest route', 'lab', { 'text-anchor': 'start' });
      c.hd2 = U.text(svg, 935, 40, 'calls', 'lab', { 'text-anchor': 'middle' });
      ARCH.forEach(function (a, i) {
        var g = U.g(svg), y = 110 + i * 92, r = { g: g, y: y, dots: [] };
        r.lab = U.text(g, 0, y + 8, a[0], 'lab lab--t2');
        r.seed = U.token(g, 'evidence', { r: 11 }); U.place(r.seed, 345, y); U.op(r.seed, 1);
        for (var k = 0; k < a[1]; k++) { var d = U.el('circle', { cx: 390 + k * 36, cy: y, r: 10, 'class': 'nd' }, g); r.dots.push(d); }
        r.calls = U.text(g, 935, y + 9, String(a[2]), 'cap', { 'text-anchor': 'middle' });
        c.rows.push(r);
      });
      c.div = U.el('line', { x1: 1030, y1: 20, x2: 1030, y2: 640, 'class': 'rule' }, svg); U.op(c.div, 0);
      c.R = U.g(svg);
      var CX = [1230, 1400, 1570, 1710];
      [['primary', 0], ['GPT-4.1', 1], ['Gemini', 2]].forEach(function (h) { U.agent(c.R, { x: CX[h[1]], y: 60, r: 26, label: h[0], ly: 62 }); });
      c.CX = CX;
      c.o1 = U.g(c.R); U.text(c.o1, 1080, 225, 'fidelity to the seed', 'lab lab--t2');
      [0, 1, 2].forEach(function (i) { U.el('circle', { cx: CX[i], cy: 270, r: 15, 'class': 'nd is-fill', style: 'fill:var(--mint);stroke:var(--mint)' }, c.o1); });
      U.text(c.o1, 1710, 278, 'all three', 'lab lab--hi', { 'text-anchor': 'middle' });
      c.o2 = U.g(c.R); U.text(c.o2, 1080, 365, 'unsupported content', 'lab lab--t2');
      U.text(c.o2, 1080, 415, 'less consistent across seeds and coders', 'cap');
      c.o3 = U.g(c.R); U.text(c.o3, 1080, 505, 'divergence across runs', 'lab lab--t2');
      U.el('circle', { cx: CX[0], cy: 550, r: 15, style: 'fill:var(--mint);stroke:var(--mint);stroke-width:3' }, c.o3);
      [1, 2, 3].forEach(function (i) { U.el('circle', { cx: CX[i], cy: 550, r: 15, style: 'fill:none;stroke:var(--muted);stroke-width:3;stroke-dasharray:4 5' }, c.o3); });
      U.text(c.o3, CX[3], 600, 'embedding', 'lab', { 'text-anchor': 'middle' });
      c.o3b = U.text(c.R, 1400, 640, 'not reproduced', 'lab lab--alert', { 'text-anchor': 'middle' });
      c.bundle = U.g(svg);
      U.el('path', { d: 'M990,85 L1006,85 L1006,595 L990,595', 'class': 'box' }, c.bundle);
      U.lines(c.bundle, 0, 680, ['each row also changes role prompts, sampling settings', 'and the demand to merge two inputs: a bundle'], 'cap', 36);
      c.depth = U.g(svg);
      U.text(c.depth, 390, 74, 'agent 1', 'lab lab--hi', { 'text-anchor': 'middle' });
      U.text(c.depth, 390 + 10 * 36, 74, 'agent 11', 'lab lab--warm', { 'text-anchor': 'middle' });
      U.lines(c.depth, 0, 680, ['linear chain, post hoc: fidelity lower and', 'unsupported content higher at the eleventh agent'], 'cap', 36);
      return c;
    },
    draw: function (c, t, U) {
      var p1 = U.cue(1), p2 = U.cue(2), p3 = U.cue(3);
      var tHub = U.say(0, 'In a hub with spokes'), tCh = U.say(0, 'In a linear chain'), tAll = U.say(1, 'The six architectures'), tRng = U.say(1, 'between 2 and 14');
      c.rows.forEach(function (r, i) {
        var first = i === 0 ? tCh : i === 2 ? tHub : tAll;
        U.op(r.lab, U.ramp(t, first, 0.6)); U.op(r.seed, U.ramp(t, first, 0.6));
        var t0 = i === 0 ? tCh + 0.4 : i === 2 ? tHub + 0.4 : tRng;
        r.dots.forEach(function (d, k) { U.op(d, U.ramp(t, t0 + k * 0.18, 0.3)); });
        U.op(r.calls, U.ramp(t, U.say(1, 'model calls'), 0.6));
        U.em(r.g, t >= p3 ? (i === 0 ? 2 : 1) : 2);
      });
      U.op(c.hd1, U.ramp(t, tHub, 0.6)); U.op(c.hd2, U.ramp(t, U.say(1, 'model calls'), 0.6));
      U.op(c.bundle, U.ramp(t, U.say(1, 'is a bundle'), 0.8) * (1 - U.ramp(t, p3, 0.6)));
      U.op(c.R, U.ramp(t, U.say(2, 'all three coders'), 0.8)); U.op(c.div, U.ramp(t, U.say(2, 'all three coders'), 0.8));
      U.op(c.o1, U.ramp(t, U.say(2, 'all three coders'), 0.6));
      U.op(c.o2, U.ramp(t, U.say(2, 'Differences in unsupported'), 0.6));
      U.op(c.o3, U.ramp(t, U.say(2, 'A difference in how far'), 0.6));
      U.op(c.o3b, U.ramp(t, U.say(2, 'neither independent coder'), 0.6));
      U.op(c.depth, U.ramp(t, p3 + 1.5, 0.8));
      U.em(c.R, t >= p3 ? 1 : 2);
      var ch = c.rows[0].dots, on = t >= p3 + 1.5;
      [ch[0], ch[10]].forEach(function (d, j) { var col = on ? (j ? C.warm : C.mint) : ''; d.style.stroke = col; d.style.fill = col; });
    } });

  // ------------------------------------------------------------------ the documented case
  NCMA.scene({ id: 'status-shift', note: 'Reported finding · phrases quoted from the study record', source: 'Gladstone & Brashears, in press', desc: 'Three boxes joined by arrows. The seed message quotes: would increase spoilage losses by approximately 23 percent, marked conditional projection. One parallel chain before debate quotes: will lead to, marked strengthened, with 23 percent kept. The delivered output reads stated as an outcome, figures intact. A names-and-numbers check under it reads pass. Below, sixty dots stand for the runs from that seed, one highlighted. On the right, twelve squares for the propositions, nine marked as meeting the agreement criterion, and two bars for one proposition: 18.5 percent of outputs marked shifted by one coder and 0.3 percent by the other.',
    build: function (svg, U) {
      var c = {};
      var B = [[20, 'seed message'], [614, 'one chain, before the debate'], [1208, 'delivered output']];
      c.box = B.map(function (b) { var g = U.g(svg); U.el('rect', { x: b[0], y: 40, width: 540, height: 300, rx: 10, 'class': 'box' }, g); U.text(g, b[0] + 30, 85, b[1], 'lab'); return g; });
      var b1 = c.box[0], b2 = c.box[1], b3 = c.box[2];
      var q1 = U.el('text', { x: 290, y: 165, 'class': 'word--lg', 'text-anchor': 'middle' }, b1);
      [['“would increase spoilage', ''], ['losses by approximately', ''], ['23 percent”', 'n']].forEach(function (l, i) { var ts = U.el('tspan', { x: 290, dy: i ? 46 : 0 }, q1); ts.textContent = l[0]; if (l[1]) ts.style.fill = C.mint; });
      U.text(b1, 290, 310, 'conditional projection', 'lab lab--t2', { 'text-anchor': 'middle' });
      U.text(b2, 884, 190, '“will lead to”', 'big big--warm', { 'text-anchor': 'middle' });
      U.text(b2, 884, 250, '23 percent kept', 'lab lab--hi', { 'text-anchor': 'middle' });
      U.text(b2, 884, 310, 'strengthened', 'lab lab--warm', { 'text-anchor': 'middle' });
      U.text(b3, 1478, 190, 'stated as an outcome', 'word--lg', { 'text-anchor': 'middle' });
      U.text(b3, 1478, 250, 'figures intact', 'lab lab--hi', { 'text-anchor': 'middle' });
      U.text(b3, 1478, 310, 'outcome', 'lab lab--alert', { 'text-anchor': 'middle' });
      c.a1 = U.el('path', { d: 'M566,190 L606,190', 'class': 'ln', 'marker-end': 'url(#arrow)' }, svg);
      c.a2 = U.el('path', { d: 'M1160,190 L1200,190', 'class': 'ln', 'marker-end': 'url(#arrow)' }, svg);
      c.tk = U.token(svg, 'evidence', { r: 16 });
      c.check = U.text(svg, 1478, 400, 'names-and-numbers check: pass', 'lab lab--hi', { 'text-anchor': 'middle' });
      c.runs = U.g(svg); c.dots = [];
      for (var i = 0; i < 60; i++) { var x = 60 + (i % 20) * 36, y = 480 + Math.floor(i / 20) * 40; c.dots.push(U.el('circle', { cx: x, cy: y, r: 11, 'class': 'nd' }, c.runs)); }
      U.text(c.runs, 60, 640, '60 runs from this seed · this conversion in 1', 'lab', { 'text-anchor': 'start' });
      c.inst = U.g(svg);
      U.text(c.inst, 900, 450, '12 propositions · agreement criterion met for 9', 'lab', { 'text-anchor': 'start' });
      for (var j = 0; j < 12; j++) U.el('rect', { x: 900 + j * 46, y: 474, width: 32, height: 32, rx: 4, style: j < 9 ? 'fill:var(--mint);stroke:var(--mint)' : 'fill:none;stroke:var(--muted);stroke-width:2' }, c.inst);
      c.bars = U.g(svg);
      U.text(c.bars, 900, 580, 'one proposition, share of outputs marked as shifted', 'lab', { 'text-anchor': 'start' });
      var sc = 700 / 20; // 0 to 20 percent across 700 px
      U.el('rect', { x: 1060, y: 604, width: 18.5 * sc, height: 30, 'class': 'bar bar--warm' }, c.bars);
      U.el('rect', { x: 1060, y: 660, width: Math.max(0.3 * sc, 3), height: 30, 'class': 'bar bar--warm' }, c.bars);
      U.text(c.bars, 900, 628, 'one coder', 'lab lab--t2'); U.text(c.bars, 900, 684, 'the other', 'lab lab--t2');
      U.text(c.bars, 1060 + 18.5 * sc - 12, 628, '18.5%', 'cap', { 'text-anchor': 'end', style: 'fill:var(--bg);font-weight:600' });
      U.text(c.bars, 1080, 684, '0.3%', 'cap', { 'text-anchor': 'start' });
      return c;
    },
    draw: function (c, t, U) {
      var tq = U.say(0, 'would increase'), tw = U.say(0, 'will lead to'), to = U.say(0, 'the statement became');
      U.op(c.box[0], U.ramp(t, Math.min(tq, 4), 0.8));
      U.fly(c.tk, [[560, 190], [614, 190]], t, tw - 1.4, 1.2, false);
      U.op(c.box[1], U.ramp(t, tw, 0.8)); U.op(c.a1, U.ramp(t, tw - 1.4, 0.6));
      U.op(c.box[2], U.ramp(t, to + 0.6, 0.8)); U.op(c.a2, U.ramp(t, to, 0.6));
      if (t >= to - 0.2 && t < to + 1.4) U.fly(c.tk, [[1154, 190], [1208, 190]], t, to - 0.2, 1.2, false);
      U.op(c.check, U.ramp(t, U.say(1, 'would have passed'), 0.6));
      U.op(c.runs, U.ramp(t, U.say(1, 'A search of all 60'), 0.8));
      c.dots.forEach(function (d, i) { var hi = i === 37 && t >= U.say(1, 'found this exact') ; d.style.fill = hi ? C.warm : ''; d.style.stroke = hi ? C.warm : ''; });
      U.op(c.inst, U.ramp(t, U.say(2, 'They met the agreement'), 0.8));
      U.op(c.bars, U.ramp(t, U.say(2, 'For one proposition'), 0.8));
      U.em(c.runs, t >= U.cue(2) ? 1 : 2);
    } });

  // ------------------------------------------------------------------ double counting and the provenance record
  /* The six-clue cast as a relay ending at a1. Stage 1: a5 sends its clue to a2 and a4;
     a3 and a6 send theirs to a4. Stage 2: each relay forwards everything it holds to a1.
     Display numbers run clockwise from the top (a1 1, a2 2, a5 3, a3 4, a6 5, a4 6). */
  var NUM = {}; M.SIX.order.forEach(function (a, i) { NUM[a] = i + 1; });
  var STAGE1 = [['a5', 'a2'], ['a5', 'a4'], ['a3', 'a4'], ['a6', 'a4']], STAGE2 = [['a2', 'a1'], ['a4', 'a1']];
  function relayRun() {
    var hold = {}; M.SIX.agents.forEach(function (a) { hold[a] = [{ o: a, via: [] }]; });
    STAGE1.forEach(function (e) { hold[e[1]].push({ o: e[0], via: [e[1]] }); });
    var got = [{ o: 'a1', via: [], from: 'own' }];
    STAGE2.forEach(function (e) { hold[e[0]].forEach(function (x) { got.push({ o: x.o, via: x.via.indexOf(e[0]) < 0 ? x.via.concat([e[0]]) : x.via, from: e[0] }); }); });
    var sum = got.reduce(function (s, x) { return s + M.SIX.clue[x.o]; }, 0);
    var seen = {}, dedup = got.filter(function (x) { if (seen[x.o]) return false; seen[x.o] = 1; return true; });
    var dsum = dedup.reduce(function (s, x) { return s + M.SIX.clue[x.o]; }, 0);
    return { hold: hold, got: got, sum: sum, dedup: dedup, dsum: dsum, pooled: M.sum(M.SIX.agents) };
  }
  var RUN = relayRun(); // got.length 7, sum +5; dedup 6, dsum +2 = pooled
  function clueTok(U, parent, o, tag) {
    var w = M.SIX.clue[o], g = U.token(parent, 'evidence', { r: Math.abs(w) > 1 ? 22 : 13, cls: w > 0 ? 'clue-A' : 'clue-B' });
    if (tag) { g.tag = U.text(g, 0, Math.abs(w) > 1 ? 52 : 42, String(NUM[o]), 'lab lab--t2'); g.tag.setAttribute('text-anchor', 'middle'); }
    return g;
  }
  function relayScene(id, prov) {
    NCMA.scene({ id: id, note: ILL, desc: prov
      ? 'The same relay of six numbered agents. Every clue now travels with its origin number. When agent 1 tallies what it received, the second copy of agent 3\'s strong clue joins the first instead of taking a new place. The tally shows six clues, one per origin, with agent 3 marked two routes, and reads A ahead by 2.'
      : 'Six numbered agents on a hexagon with their clues. Arrows form a relay: agent 3 sends its strong clue to agents 2 and 6, agents 4 and 5 send theirs to agent 6, and agents 2 and 6 forward everything to agent 1. The clues fly along the arrows and line up in a tally on the right: seven clues, A ahead by 5. Then both routes from agent 3 light up in red, the two strong clues in the tally are marked as the same clue from agent 3, and a line reads pooled once, A ahead by 2.',
      build: function (svg, U) {
        var c = NCMA.six(svg, U, { cx: 430, cy: 400, R: 250, r: 40 });
        c.dl = {};
        STAGE1.concat(STAGE2).forEach(function (e) { var A = c.pos[e[0]], B = c.pos[e[1]]; c.dl[e[0] + e[1]] = U.link(c.edges, { x: A[0], y: A[1], r: 40 }, { x: B[0], y: B[1], r: 40 }, { arrow: true }); });
        // one token per clue agent 1 receives, in the order it receives them
        var OFF = [60, -60, -120], park = function (a, j) { var P = c.pos[a], ux = P[2], uy = P[3], o = OFF[j]; return [P[0] + ux * 84 - uy * o, P[1] + uy * 84 + ux * o]; };
        var nPark = {}, jPark = {}, slotOf = {}, ns = 0;
        RUN.got.forEach(function (g) { if (g.from !== 'own' && g.o !== g.from) nPark[g.from] = (nPark[g.from] || 0) + 1; });
        c.items = RUN.got.map(function (g) {
          var it = { o: g.o, from: g.from, tk: clueTok(U, c.tk, g.o, prov) };
          it.kind = g.from === 'own' ? 'own' : g.o === g.from ? 'relay' : 'passed';
          if (it.kind === 'passed') { jPark[g.from] = jPark[g.from] || 0; it.park = park(g.from, jPark[g.from]++); }
          if (prov && slotOf[g.o] != null) { it.slot = slotOf[g.o]; it.dup = true; } else { it.slot = ns; slotOf[g.o] = ns++; }
          if (!prov && g.o === 'a5') { it.tag2 = U.text(it.tk, 0, 58, String(NUM.a5), 'lab lab--alert'); it.tag2.setAttribute('text-anchor', 'middle'); }
          return it;
        });
        c.slotX = function (k) { return 1010 + k * (prov ? 120 : 104); };
        c.items.forEach(function (it) { it.dest = [c.slotX(it.slot), 250]; });
        c.tallyLab = U.text(svg, 1000, 150, 'what agent 1 adds up', 'lab', { 'text-anchor': 'start' });
        c.score = U.text(svg, 1000, 450, '', 'big', { 'text-anchor': 'start' });
        c.pool = U.text(svg, 1000, 540, 'pooled once: A ahead by ' + RUN.pooled, 'word--lg', { 'text-anchor': 'start' });
        c.same = U.text(svg, 1000, 360, '', 'lab lab--alert', { 'text-anchor': 'start' });
        c.rec = U.lines(svg, 1000, 650, ['record attached by the program,', 'outside the rewritable text'], 'cap', 36, { 'text-anchor': 'start' });
        c.world = U.lines(svg, 1000, 740, ['whether origins observed the world', 'independently: not in the record'], 'lab', 30, { 'text-anchor': 'start' });
        c.routes = U.text(svg, 0, 340, 'two routes', 'lab lab--hi', { 'text-anchor': 'middle' });
        M.SIX.agents.forEach(function (a) { U.setText(c.ag[a].mark, String(NUM[a])); });
        return c;
      },
      draw: function (c, t, U) {
        c.clues(1); c.topo(null);
        Object.keys(c.dl).forEach(function (k) { U.op(c.dl[k], U.ramp(t, 1, 0.8)); });
        var s1 = prov ? U.cue(0) + 4 : U.say(0, 'Agent 3 sends'), s1b = prov ? s1 + 1 : U.say(0, 'Agents 4 and 5'), fw = prov ? U.say(0, 'Agent 1 receives') : U.cue(1) + 0.6, D1 = 1.8, D2 = 2.6;
        c.items.forEach(function (it) {
          var tk = it.tk, home = c.pos[it.o], A1 = [c.pos.a1[0], c.pos.a1[1]];
          var fwT = fw + (it.from === 'a4' ? 0.5 : 0) + (it.kind === 'own' ? -0.3 : 0) + (it.slot % 4) * 0.08, from;
          if (it.kind === 'passed') {
            var start = it.o === 'a5' ? s1 : s1b;
            if (t < start) { U.op(tk, 0); return; }
            var via = c.pos[it.from];
            if (t < start + D1) { U.fly(tk, [[home[0], home[1]], [via[0], via[1]], it.park], t, start, D1, true); return; }
            from = it.park;
            if (t < fwT) { U.place(tk, from[0], from[1]); U.op(tk, 1); return; }
          } else {
            from = it.kind === 'own' ? [A1[0], A1[1] - 60] : [home[0] + (430 - home[0]) * 0.18, home[1] + (400 - home[1]) * 0.18];
            if (t < fwT) { U.op(tk, 0); return; }
          }
          U.fly(tk, it.kind === 'own' ? [from, it.dest] : it.kind === 'passed' ? [from, [c.pos[it.from][0], c.pos[it.from][1]], A1, it.dest] : [from, A1, it.dest], t, fwT, D2, true);
          if (prov && it.dup && t >= fwT + D2) U.op(tk, 0);
        });
        STAGE1.forEach(function (e) { var st = e[0] === 'a5' ? s1 : s1b; U.cls(c.dl[e[0] + e[1]], 'is-live', t >= st && t < st + D1); });
        STAGE2.forEach(function (e) { U.cls(c.dl[e[0] + e[1]], 'is-live', t >= fw && t < fw + D2 + 0.5); });
        var landed = fw + D2 + 0.7;
        U.op(c.tallyLab, U.ramp(t, fw, 0.6));
        var sum = prov ? RUN.dsum : RUN.sum, n = prov ? RUN.dedup.length : RUN.got.length;
        U.setText(c.score, n + ' clues · A ahead by ' + sum);
        U.cls(c.score, 'big--warm', !prov); U.cls(c.score, 'big--hi', prov);
        var tScore = prov ? landed : U.say(1, 'It counts seven');
        U.op(c.score, U.ramp(t, tScore, 0.6));
        var trace = prov ? landed : U.say(2, 'both paths lead');
        var dep = prov && t >= U.say(1, 'The routes do more') && t < U.cue(2);
        ['a5a2', 'a2a1', 'a5a4', 'a4a1'].forEach(function (k) { U.cls(c.dl[k], prov ? 'is-live' : 'is-bad', dep || (t >= trace && t < (prov ? trace + 6 : 1e9))); });
        U.cls(c.ag.a5.g, prov ? 'is-on' : 'is-bad', dep || (t >= trace && (!prov || t < trace + 6)));
        if (prov) ['a2', 'a4'].forEach(function (a) { U.cls(c.ag[a].g, 'is-on', t >= U.say(1, 'They show that agents 2 and 6') && t < U.cue(2)); });
        // the duplicated strong clue in the tally
        c.items.forEach(function (it) {
          if (it.o !== 'a5') return; var ring = it.tk.firstChild;
          ring.style.stroke = !prov && t >= trace ? C.alert : '';
          if (it.tk.tag) U.op(it.tk.tag, 1);
        });
        if (!prov) {
          U.setText(c.same, 'the same clue from agent 3, counted twice');
          U.op(c.same, U.ramp(t, trace + 0.8, 0.6));
          U.op(c.pool, U.ramp(t, U.say(2, 'Here the answer stays A'), 0.8));
          c.items.forEach(function (it) { if (it.tag2) U.op(it.tag2, U.ramp(t, trace + 0.4, 0.5)); });
          [c.rec, c.world, c.routes].forEach(function (e) { U.op(e, 0); });
        } else {
          U.op(c.same, 0); U.op(c.pool, 0);
          var sx = c.items.filter(function (it) { return it.o === 'a5'; })[0];
          c.routes.setAttribute('x', c.slotX(sx.slot)); c.routes.setAttribute('y', 340);
          U.setText(c.routes, 'two routes'); U.op(c.routes, U.ramp(t, landed + 0.3, 0.6));
          U.op(c.rec, U.ramp(t, U.say(2, 'The record is reliable'), 0.8));
          U.op(c.world, U.ramp(t, U.say(2, 'Whether two agents'), 0.8));
        }
      } });
  }
  relayScene('counted-twice', false);
  relayScene('provenance-record', true);

  // ------------------------------------------------------------------ three agreeing reports
  NCMA.scene({ id: 'three-reports', note: 'Illustrative · three constructed systems', source: 'Ju et al., 2026', desc: 'Three panels, each ending in the same row of three reports marked A, with everything above hidden behind dashed boxes. The first panel reveals three sources, each read by its own agent. The second reveals one source read by one agent whose draft three agents rewrite. The third reveals one document read separately by three agents. Under each: 3 sources, 1 upstream message, 1 shared document.',
    build: function (svg, U) {
      var c = { P: [] };
      [300, 884, 1468].forEach(function (cx, k) {
        var p = { cx: cx, g: U.g(svg), up: U.g(svg), tk: [] };
        p.rep = [-140, 0, 140].map(function (dx) { var a = U.agent(p.g, { x: cx + dx, y: 600, r: 34, role: 'doc', mark: 'A' }); U.cls(a.g, 'is-A', true); return a; });
        p.veil = U.el('rect', { x: cx - 250, y: 40, width: 500, height: 480, rx: 10, 'class': 'zone' }, svg);
        p.q = U.text(svg, cx, 300, 'upstream, out of view', 'lab', { 'text-anchor': 'middle' });
        var paths = [];
        if (k === 0) {
          [-140, 0, 140].forEach(function (dx, i) { var s = U.agent(p.up, { x: cx + dx, y: 110, r: 30, role: 'doc' }); var d = U.agent(p.up, { x: cx + dx, y: 340, r: 30 }); U.link(p.up, s, d, { arrow: true }); U.link(p.up, d, p.rep[i], { arrow: true }); paths.push([[cx + dx, 110], [cx + dx, 340], [cx + dx, 600]]); });
          p.title = '3 sources';
        } else if (k === 1) {
          var s = U.agent(p.up, { x: cx, y: 90, r: 30, role: 'doc' }), d = U.agent(p.up, { x: cx, y: 230, r: 30 }); U.link(p.up, s, d, { arrow: true });
          [-140, 0, 140].forEach(function (dx, i) { var w = U.agent(p.up, { x: cx + dx, y: 400, r: 30 }); U.link(p.up, d, w, { arrow: true }); U.link(p.up, w, p.rep[i], { arrow: true }); paths.push([[cx, 90], [cx, 230], [cx + dx, 400], [cx + dx, 600]]); });
          p.title = '1 upstream message';
        } else {
          var s3 = U.agent(p.up, { x: cx, y: 110, r: 30, role: 'doc' });
          [-140, 0, 140].forEach(function (dx, i) { var d3 = U.agent(p.up, { x: cx + dx, y: 340, r: 30 }); U.link(p.up, s3, d3, { arrow: true, cls: 'ln--dash' }); U.link(p.up, d3, p.rep[i], { arrow: true }); paths.push([[cx, 110], [cx + dx, 340], [cx + dx, 600]]); });
          p.title = '1 shared document';
        }
        p.paths = paths; p.tk = paths.map(function () { return U.token(svg, 'evidence', { r: 12 }); });
        p.lab = U.text(svg, cx, 720, '3 reports  ·  ' + p.title, 'word', { 'text-anchor': 'middle' });
        c.P.push(p);
      });
      c.sub = U.text(svg, 884, 790, '', 'lab', { 'text-anchor': 'middle' });
      return c;
    },
    draw: function (c, t, U) {
      var rv = [U.say(1, 'In the first system'), U.say(1, 'In the second'), U.say(2, 'In the third system')];
      c.P.forEach(function (p, k) {
        U.op(p.g, U.ramp(t, 0.8 + k * 0.3, 0.6));
        var o = U.ramp(t, rv[k], 0.8);
        U.op(p.up, o); U.op(p.veil, 1 - o); U.op(p.q, (1 - o) * U.ramp(t, 2, 0.6));
        p.tk.forEach(function (tk, i) { U.fly(tk, p.paths[i], t, rv[k] + 0.9 + i * 0.15, 2.4, false); });
        U.op(p.lab, U.ramp(t, rv[k] + 3.2, 0.6));
        var focus = t < U.cue(1) ? 2 : t < U.cue(2) ? (k < 2 ? 2 : 1) : t < U.say(2, 'These are different') ? (k === 2 ? 2 : 1) : (k > 0 ? 2 : 1);
        var shown = o > 0.01; U.em(p.up, focus === 2 || !shown ? null : 1); U.em(p.lab, focus === 2 || !shown ? null : 1);
      });
      U.setText(c.sub, 'a count of agreeing reports counts messages'); U.op(c.sub, U.ramp(t, U.say(2, 'A count of agreeing'), 0.8));
    } });

  // ------------------------------------------------------------------ residue
  NCMA.scene({ id: 'message-residue', note: 'Reported finding · values as reported', source: 'Gladstone, 2026 (under review)', desc: 'Left: a dashed box marked hidden network, with three reports below it and lines between each pair of reports. Right: the three tested structures, separate drafts, one shared draft, and a Y in which two reports share a draft. Below them, two bars on a scale from 0.5, chance, to 1.0, perfect: summaries of single reports 0.699, and reports compared in pairs 0.908. Then the pair lines are labeled shared rare word sequences, a note reads one report alone equivalent to chance, and a line reads exact structure right for 64.1 percent of sets. Last, the three structures are boxed as the only ones tested, and inside the hidden box two possible causes appear side by side, a shared draft and shared facts.',
    build: function (svg, U) {
      var c = {};
      c.zone = U.el('rect', { x: 80, y: 30, width: 640, height: 330, rx: 10, 'class': 'zone' }, svg);
      c.zl = U.text(svg, 400, 70, 'hidden network', 'lab', { 'text-anchor': 'middle' });
      c.qm = U.text(svg, 400, 230, '?', 'big', { 'text-anchor': 'middle', style: 'font-size:110px;fill:var(--muted)' });
      c.alt = U.g(svg);
      var sd = U.agent(c.alt, { x: 260, y: 220, r: 34, label: 'a shared draft', ly: 74 }), sf = U.agent(c.alt, { x: 540, y: 220, r: 34, role: 'doc', label: 'shared facts', ly: 74 });
      U.text(c.alt, 400, 230, 'or', 'cap', { 'text-anchor': 'middle' });
      c.rep = [230, 400, 570].map(function (x) { return U.agent(svg, { x: x, y: 470, r: 36, role: 'doc' }); });
      c.pl = [[0, 1, 0], [1, 2, 0], [0, 2, 0.6]].map(function (p) { return U.link(svg, c.rep[p[0]], c.rep[p[1]], { bend: p[2] ? p[2] : 0, cls: 'is-live' }); });
      c.pairLab = U.text(svg, 400, 630, 'shared rare word sequences', 'lab lab--hi', { 'text-anchor': 'middle' });
      c.alone = U.text(svg, 400, 690, 'one report alone: equivalent to chance', 'lab', { 'text-anchor': 'middle' });
      c.out = [U.link(svg, { x: 400, y: 360, r: 0 }, c.rep[0], { arrow: true }), U.link(svg, { x: 400, y: 360, r: 0 }, c.rep[1], { arrow: true }), U.link(svg, { x: 400, y: 360, r: 0 }, c.rep[2], { arrow: true })];
      // candidate structures (tested): drafts on top, rewrites below
      c.cand = U.g(svg);
      var S = [[1010, 'separate drafts', [[-60, -60], [0, 0], [60, 60]]], [1300, 'one shared draft', [[0, -60], [0, 0], [0, 60]]], [1590, 'Y', [[-30, -60], [-30, 0], [60, 60]]]];
      S.forEach(function (s) {
        var cx = s[0], drafts = {};
        s[2].forEach(function (pr) { var dx = pr[0]; if (!drafts[dx]) drafts[dx] = U.agent(c.cand, { x: cx + dx, y: 100, r: 18 }); });
        s[2].forEach(function (pr) { var w = U.agent(c.cand, { x: cx + pr[1], y: 210, r: 18 }); U.link(c.cand, drafts[pr[0]], w, { arrow: true }); });
        U.text(c.cand, cx, 280, s[1], 'lab lab--t2', { 'text-anchor': 'middle' });
      });
      c.candBox = U.el('rect', { x: 866, y: 50, width: 890, height: 260, rx: 10, 'class': 'box box--hi' }, svg);
      c.candLab = U.text(svg, 1315, 30, 'the only structures tested', 'lab lab--hi', { 'text-anchor': 'middle' });
      // discrimination bars
      c.ax = U.g(svg); var x0 = 1000, x1 = 1700, sx = function (v) { return x0 + (v - 0.5) / 0.5 * (x1 - x0); };
      U.el('line', { x1: x0, y1: 400, x2: x0, y2: 560, 'class': 'rule' }, c.ax); U.el('line', { x1: x1, y1: 400, x2: x1, y2: 560, 'class': 'rule' }, c.ax);
      U.text(c.ax, x0, 590, '0.5 chance', 'lab', { 'text-anchor': 'middle' }); U.text(c.ax, x1, 590, '1.0 perfect', 'lab', { 'text-anchor': 'middle' });
      c.b1 = U.g(svg); U.text(c.b1, x0, 418, 'single reports, summarized', 'lab lab--t2'); U.el('rect', { x: x0, y: 430, width: sx(0.699) - x0, height: 34, 'class': 'bar bar--mu' }, c.b1); U.text(c.b1, sx(0.699) + 14, 457, '0.699', 'cap');
      c.b2 = U.g(svg); U.text(c.b2, x0, 500, 'reports compared in pairs', 'lab lab--t2'); U.el('rect', { x: x0, y: 512, width: sx(0.908) - x0, height: 34, 'class': 'bar bar--hi' }, c.b2); U.text(c.b2, sx(0.908) + 14, 539, '0.908', 'cap');
      c.exact = U.text(svg, 1000, 680, 'with Y sets: exact structure right for 64.1% of sets', 'cap', { 'text-anchor': 'start' });
      c.limit = U.lines(svg, 1000, 740, ['small synthetic networks · short reports · no disguise'], 'lab', 30, { 'text-anchor': 'start' });
      return c;
    },
    draw: function (c, t, U) {
      var p1 = U.cue(1), p2 = U.cue(2), p3 = U.cue(3);
      U.op(c.zone, 1); U.op(c.zl, U.ramp(t, 0.5, 0.6));
      U.op(c.qm, t >= p3 + 1.5 ? 1 - U.ramp(t, p3 + 1.5, 0.6) : U.ramp(t, 1, 0.6));
      c.rep.forEach(function (r, i) { U.op(r.g, U.ramp(t, U.say(0, 'Language-model agents drafted') + i * 0.3, 0.6)); });
      c.out.forEach(function (l) { U.op(l, U.ramp(t, U.say(0, 'Language-model agents drafted'), 0.6) * 0.6); });
      U.op(c.cand, U.ramp(t, U.say(0, 'Each set of three'), 0.8));
      var tp = U.say(1, 'Any residue had to lie');
      c.pl.forEach(function (l) { U.op(l, U.ramp(t, tp, 0.8)); });
      U.op(c.ax, U.ramp(t, U.say(1, 'For the main producing'), 0.6));
      U.op(c.b1, U.ramp(t, U.say(1, 'separated sets'), 0.6)); U.op(c.b2, U.ramp(t, U.say(1, 'it reached 0.908'), 0.6));
      U.op(c.pairLab, U.ramp(t, U.say(2, 'the overlap of rare'), 0.6));
      U.op(c.alone, U.ramp(t, U.say(2, 'were equivalent to chance'), 0.6));
      U.op(c.exact, U.ramp(t, U.say(2, 'Once Y sets'), 0.6));
      U.op(c.candBox, U.ramp(t, p3 + 0.5, 0.6)); U.op(c.candLab, U.ramp(t, p3 + 0.5, 0.6));
      U.op(c.limit, U.ramp(t, U.say(3, 'The networks were small'), 0.6));
      U.op(c.alt, U.ramp(t, U.say(3, 'Shared facts also'), 0.8));
      U.em(c.ax, t >= p3 ? 1 : 2); U.em(c.b1, t >= p3 ? 1 : 2); U.em(c.b2, t >= p3 ? 1 : 2);
    } });

  // ------------------------------------------------------------------ mixing models
  // answer patterns (1 = correct) for 12 questions; written to separate accuracy from error overlap
  var MIX = [
    { names: ['model X', 'model X', 'model X'], rows: ['011111111001', '111101111001', '111111101001'] },
    { names: ['model X', 'model Y', 'model Z'], rows: ['011111111001', '111011011011', '101110110111'] },
    { names: ['model X', 'weaker V', 'weaker W'], rows: ['011111111001', '000010101111', '000011010111'] }
  ];
  MIX.forEach(function (f) { f.maj = []; for (var j = 0; j < 12; j++) { var n = f.rows.filter(function (r) { return r[j] === '1'; }).length; f.maj.push(n >= 2 ? 1 : 0); } f.score = f.rows.map(function (r) { return r.split('').filter(function (x) { return x === '1'; }).length; }); f.mscore = f.maj.reduce(function (a, b) { return a + b; }, 0); });
  NCMA.scene({ id: 'mixing-models', note: 'Illustrative vote · answer patterns written for this talk', source: 'Wang et al., 2025 · Li et al., 2025 · Ye et al., 2025', desc: 'A grid of twelve questions. Three member rows show filled squares for right answers and hollow slashed squares for errors, and a majority row beneath. Columns where two or more members are wrong are boxed in red. First three samples of model X, 9 of 12 each, majority 10. Then models X, Y and Z, 9 each, majority 11. Then model X with two weaker models V and W, 6 each, sharing four errors, majority 8. Last, three lines summarize studies: a mixture of different models led one benchmark, samples of the best model scored higher, and assigning models to their best functions was reported to help.',
    build: function (svg, U) {
      var c = { cells: [], names: [], scores: [] };
      c.X = function (j) { return 330 + j * 98; };
      c.Y = [130, 220, 310, 430];
      c.boxes = []; for (var j = 0; j < 12; j++) c.boxes.push(U.el('rect', { x: c.X(j) - 40, y: 88, width: 80, height: 384, rx: 8, 'class': 'box box--alert' }, svg));
      for (var r = 0; r < 4; r++) {
        var row = [];
        for (var k = 0; k < 12; k++) {
          var g = U.g(svg); U.place(g, c.X(k), c.Y[r]);
          g.f = U.el('rect', { x: -26, y: -26, width: 52, height: 52, rx: 5, style: 'fill:var(--mint);stroke:none' }, g);
          g.h = U.g(g); U.el('rect', { x: -24, y: -24, width: 48, height: 48, rx: 5, style: 'fill:none;stroke:var(--alert);stroke-width:3' }, g.h); U.el('line', { x1: -18, y1: 18, x2: 18, y2: -18, style: 'stroke:var(--alert);stroke-width:3' }, g.h);
          row.push(g);
        }
        c.cells.push(row);
        c.names.push(U.text(svg, 40, c.Y[r] + 8, r === 3 ? 'majority of 3' : '', r === 3 ? 'lab lab--hi' : 'lab lab--t2'));
        c.scores.push(U.text(svg, 1560, c.Y[r] + 10, '', r === 3 ? 'big' : 'cap', { 'text-anchor': 'start', style: r === 3 ? 'font-size:46px' : '' }));
      }
      c.rule = U.el('line', { x1: 280, y1: 372, x2: 1500, y2: 372, 'class': 'rule' }, svg);
      c.qlab = U.text(svg, 330, 50, '12 questions', 'lab', { 'text-anchor': 'start' });
      c.slab = U.text(svg, 1560, 50, 'right', 'lab', { 'text-anchor': 'start' });
      c.st = [
        U.text(svg, 40, 600, 'a mixture of different models: reported to lead one benchmark', 'cap'),
        U.text(svg, 40, 660, 'samples of the single best model in its place: scored higher', 'cap'),
        U.text(svg, 40, 720, 'models assigned to the functions they did best: reported gains', 'cap')
      ];
      return c;
    },
    draw: function (c, t, U) {
      var f2 = U.say(1, 'Three different models') + 0.8, f3 = U.cue(2) + 0.5, fi = t < f2 ? 0 : t < f3 ? 1 : 2, F = MIX[fi];
      var tRows = 1.0, tMaj = U.say(0, 'so it fails exactly');
      c.cells.forEach(function (row, r) {
        row.forEach(function (g, j) {
          var v = r < 3 ? F.rows[r][j] === '1' : F.maj[j] === 1;
          U.op(g.f, v ? 1 : 0); U.op(g.h, v ? 0 : 1);
          var vis = r < 3 ? U.ramp(t, tRows + r * 0.4, 0.6) : U.ramp(t, tMaj + 1.2, 0.6);
          U.op(g, vis);
        });
        if (r < 3) { U.setText(c.names[r], F.names[r]); U.cls(c.names[r], 'lab--warm', fi === 2 && r > 0); }
        U.op(c.names[r], r < 3 ? U.ramp(t, tRows + r * 0.4, 0.6) : U.ramp(t, tMaj + 1.2, 0.6));
        U.setText(c.scores[r], r < 3 ? F.score[r] + ' of 12' : F.mscore + ' of 12');
        U.op(c.scores[r], r < 3 ? U.ramp(t, U.say(1, 'Three samples'), 0.6) : U.ramp(t, U.say(1, 'Their errors coincide'), 0.6));
        U.cls(c.scores[r], 'big--hi', r === 3 && fi === 1); U.cls(c.scores[r], 'big--warm', r === 3 && fi === 2);
      });
      c.boxes.forEach(function (b, j) { var miss = F.rows.filter(function (row) { return row[j] === '0'; }).length >= 2; U.op(b, miss ? U.ramp(t, tMaj, 0.6) : 0); });
      U.op(c.rule, U.ramp(t, tMaj + 1, 0.6));
      U.op(c.qlab, U.ramp(t, 0.6, 0.6)); U.op(c.slab, U.ramp(t, U.say(1, 'Three samples'), 0.6));
      var p3 = U.cue(3);
      U.op(c.st[0], U.ramp(t, U.say(3, 'A mixture-of-agents'), 0.6));
      U.op(c.st[1], U.ramp(t, U.say(3, 'When samples of'), 0.6));
      U.op(c.st[2], U.ramp(t, U.say(3, 'Assigning each model'), 0.6));
      U.cls(c.st[1], 'lab--hi', false);
    } });

  // ------------------------------------------------------------------ role labels
  NCMA.scene({ id: 'role-labels', note: 'Reported findings · no values drawn', source: 'Zheng et al., 2024 · Gladstone & Brashears, 2026 (under review) · Gladstone & Brashears, in press', desc: 'One agent answers questions while the role written above it changes: critic, planner, expert historian, none. Questions fly in and answers fly out, and a note reads 162 roles, 2,410 questions, no gain over no persona. Then two agents send inputs to a combining agent, one input tagged from a more capable system, and a note reads no reliable improvement.',
    build: function (svg, U) {
      var c = {};
      c.A = U.g(svg);
      c.ag = U.agent(c.A, { x: 620, y: 400, r: 64 });
      c.role = U.text(c.A, 620, 270, '', 'word--lg', { 'text-anchor': 'middle' });
      c.rlab = U.text(c.A, 620, 220, 'role in the prompt', 'lab', { 'text-anchor': 'middle' });
      c.qs = [0, 1, 2].map(function () { return U.token(c.A, 'instruction', { r: 15 }); });
      c.as = [0, 1, 2].map(function () { return U.token(c.A, 'evidence', { r: 15 }); });
      U.text(c.A, 150, 410, 'questions', 'lab', { 'text-anchor': 'middle' });
      c.res = U.g(c.A); U.text(c.res, 1350, 360, '162 roles · 2,410 questions', 'lab', { 'text-anchor': 'middle' }); U.text(c.res, 1350, 420, 'no gain over no persona', 'word--lg', { 'text-anchor': 'middle' });
      c.B = U.g(svg);
      c.i1 = U.agent(c.B, { x: 260, y: 240, r: 46 }); c.i2 = U.agent(c.B, { x: 260, y: 560, r: 46 });
      U.text(c.B, 260, 160, 'from a more capable system', 'lab lab--warm', { 'text-anchor': 'middle' });
      c.cm = U.agent(c.B, { x: 760, y: 400, r: 60, label: 'combines', ly: 100 });
      c.l1 = U.link(c.B, c.i1, c.cm, { arrow: true }); c.l2 = U.link(c.B, c.i2, c.cm, { arrow: true });
      c.lo = U.link(c.B, c.cm, { x: 1110, y: 400, r: 24 }, { arrow: true });
      c.t1 = U.token(c.B, 'evidence', { r: 16 }); c.t2 = U.token(c.B, 'evidence', { r: 16 }); c.to = U.token(c.B, 'both', { r: 16 });
      c.res2 = U.g(c.B); U.text(c.res2, 1350, 360, 'two studies of agent networks', 'lab', { 'text-anchor': 'middle' }); U.text(c.res2, 1350, 420, 'no reliable improvement', 'word--lg', { 'text-anchor': 'middle' });
      return c;
    },
    draw: function (c, t, U) {
      var p1 = U.cue(1), inA = t < p1;
      U.op(c.A, inA ? U.ramp(t, 0.4, 0.6) : 1 - U.ramp(t, p1, 0.6));
      U.op(c.B, U.ramp(t, p1 + 0.4, 0.8));
      var roles = ['critic', 'planner', 'expert historian', 'no role'], per = 4, k = Math.floor(Math.max(0, t - 2) / per) % 4, ph = Math.max(0, t - 2) % per;
      U.setText(c.role, roles[k]); sty(c.role, k === 3 ? C.mu : C.text);
      c.qs.forEach(function (q, i) { if (inA) U.fly(q, [[235, 400], [520, 400]], ph, 0.2 + i * 0.35, 1.1, false); else U.op(q, 0); });
      c.as.forEach(function (a, i) { if (inA) U.fly(a, [[720, 400], [1050, 400]], ph, 1.6 + i * 0.35, 1.1, false); else U.op(a, 0); });
      U.op(c.res, U.ramp(t, U.say(0, 'did not improve accuracy'), 0.8));
      var tb = U.say(1, 'telling the agent');
      U.fly(c.t1, [[300, 260], [710, 380]], t, tb - 1, 1.6, false); U.fly(c.t2, [[300, 540], [710, 420]], t, tb - 0.8, 1.6, false);
      U.fly(c.to, [[830, 400], [1110, 400]], t, tb + 1, 1.4, true);
      U.op(c.res2, U.ramp(t, U.say(1, 'produced no reliable'), 0.8));
    } });

  // ------------------------------------------------------------------ who sits at the center
  /* Two stars built from the six-clue cast: on the left a1 (weak clue for B) is the hub,
     on the right a5 (strong clue for A). Same agents, clues, rule and rounds. Outcomes
     from NCMA.models.runSix. */
  function starPanel(svg, U, cx, hub) {
    var p = { cx: cx, hub: hub, ag: {}, pos: {}, clue: {}, links: {}, held: {} };
    p.lg = U.g(svg); p.ng = U.g(svg); p.tg = U.g(svg);
    var leaves = M.SIX.order.filter(function (a) { return a !== hub; });
    p.pos[hub] = [cx, 400, 0.7071, -0.7071];
    leaves.forEach(function (a, i) { var th = -Math.PI / 2 + i * 2 * Math.PI / 5; p.pos[a] = [cx + 235 * Math.cos(th), 400 + 235 * Math.sin(th), Math.cos(th), Math.sin(th)]; });
    leaves.forEach(function (a) { p.links[a] = U.link(p.lg, { x: cx, y: 400, r: 40 }, { x: p.pos[a][0], y: p.pos[a][1], r: 36 }); });
    M.SIX.agents.forEach(function (a) {
      var P = p.pos[a], isHub = a === hub;
      p.ag[a] = U.agent(p.ng, { x: P[0], y: P[1], r: isHub ? 40 : 36, role: isHub ? 'hub' : null });
      var w = M.SIX.clue[a], strong = Math.abs(w) > 1, d = isHub ? 88 : 36 + 40;
      var tx = P[0] + (isHub ? 0.5878 : P[2]) * d, ty = P[1] + (isHub ? -0.8090 : P[3]) * d;
      p.clue[a] = U.token(p.ng, 'evidence', { r: strong ? 22 : 13, cls: w > 0 ? 'clue-A' : 'clue-B' }); U.place(p.clue[a], tx, ty); U.op(p.clue[a], 1);
    });
    p.tally = U.text(svg, cx, 12, '', 'word--lg', { 'text-anchor': 'middle' });
    p.info = U.text(svg, cx, 740, '', 'lab lab--t2', { 'text-anchor': 'middle' });
    p.cap = U.text(svg, cx, 778, hub === 'a1' ? 'hub holds a weak clue for B' : 'hub holds a strong clue for A', 'lab', { 'text-anchor': 'middle' });
    p.read = U.text(svg, cx, 704, '', 'lab', { 'text-anchor': 'middle' });
    return p;
  }
  function panelRound(p, U, H, r, kind, t, t0, d) {
    var key = 'r' + r;
    if (!p[key]) p[key] = H[r].msgs.map(function (m) {
      var tk = kind === 'evidence' ? U.token(p.tg, 'evidence', { r: 13 }) : U.token(p.tg, 'conclusion', { r: 18, label: m.cc });
      var A = p.pos[m.from], B = p.pos[m.to]; return { tk: tk, pts: U.seg([A[0], A[1]], [B[0], B[1]], 46, 46) };
    });
    p[key].forEach(function (x, i) { U.fly(x.tk, x.pts, t, t0 + (i % 5) * 0.06, d, false); });
  }
  function starScene(id, mode) {
    var HL = M.runSix({ topology: 'starA1', mode: mode, rounds: 2 }), HR = M.runSix({ topology: 'starA5', mode: mode, rounds: 2 });
    NCMA.scene({ id: id, note: ILL, desc: mode === 'evidence'
      ? 'Two stars of the same six agents. On the left the hub holds a weak clue for B, on the right a strong clue for A. Evidence travels between each hub and its outer agents. After round 1 both hubs hold all six clues; the left group is split 3 to 3, the right group is unanimous for A, with outer agents holding two clues each. After round 2 every agent in both stars holds all six clues and judges A.'
      : 'The same two stars, now exchanging answers as solid discs marked A or B. On the left the hub keeps B and the group stays 4 B to 2 A. On the right the hub, outvoted, switches to B, and only one outer agent keeps A: 5 B to 1 A. Both hubs read out B.',
      build: function (svg, U) {
        var c = { L: starPanel(svg, U, 430, 'a1'), R: starPanel(svg, U, 1338, 'a5') };
        c.mid = U.el('line', { x1: 884, y1: 90, x2: 884, y2: 700, 'class': 'rule' }, svg);
        return c;
      },
      draw: function (c, t, U) {
        var r1L, r2L, r1R, r2R;
        if (mode === 'evidence') { r1L = r1R = U.cue(1) + 0.3; r2L = r2R = U.cue(2) + 0.3; }
        else { r1L = U.say(0, 'the hub hears three'); r2L = r1L + 4; r1R = U.cue(1) + 0.3; r2R = r1R + 3.4; }
        [[c.L, HL, r1L, r2L], [c.R, HR, r1R, r2R]].forEach(function (z) {
          var p = z[0], H = z[1], a1 = z[2] + 2.2, a2 = z[3] + 2.2;
          var rr = t >= a2 ? 2 : t >= a1 ? 1 : 0;
          panelRound(p, U, H, 1, mode, t, z[2], 2); panelRound(p, U, H, 2, mode, t, z[3], 2);
          M.SIX.agents.forEach(function (a) {
            var j = H[rr].judge[a], g = p.ag[a];
            U.cls(g.g, 'is-A', j === 'A'); U.cls(g.g, 'is-B', j === 'B'); U.setText(g.mark, j);
          });
          Object.keys(p.links).forEach(function (k) { U.cls(p.links[k], 'is-live', (t >= z[2] && t < a1) || (t >= z[3] && t < a2)); });
          var nA = M.count(H[rr], 'A');
          U.setText(p.tally, (rr ? 'after round ' + rr + ':  ' : 'before:  ') + 'A ' + nA + '  ·  B ' + (6 - nA)); U.op(p.tally, U.ramp(t, 0.8, 0.6));
          var nh = H[rr].know[p.hub].length, nl = H[rr].know[p.hub === 'a1' ? 'a2' : 'a1'].length;
          U.setText(p.info, 'clues held: hub ' + nh + ' · each outer agent ' + nl); U.op(p.info, mode === 'evidence' ? U.ramp(t, 0.8, 0.6) : 0);
          U.setText(p.read, 'read at the hub: ' + H[rr].judge[p.hub]); U.op(p.read, rr ? 1 : 0);
          U.cls(p.read, 'lab--hi', H[rr].judge[p.hub] === 'A'); U.cls(p.read, 'lab--warm', H[rr].judge[p.hub] === 'B');
        });
        if (mode !== 'evidence') {
          var foc = t < U.cue(1) ? 'L' : t < U.cue(2) ? 'R' : '';
          ['L', 'R'].forEach(function (k) { var p = c[k], lv = foc && foc !== k ? 1 : null; [p.lg, p.ng, p.tg].forEach(function (g) { U.em(g, lv); }); });
        }
      } });
  }
  starScene('hub-evidence', 'evidence');
  starScene('hub-answers', 'conclusion');

  // ------------------------------------------------------------------ measured placement
  NCMA.scene({ id: 'placement-measured', note: 'Reported finding · no values drawn', source: 'Gladstone & Brashears, 2026 (under review) · Gladstone & Brashears, in press', desc: 'Left: a seven-agent hierarchy with the stronger model, filled in mint, at the top, and the note synthesis quality higher, direction held, estimate imprecise. Right: a five-agent wheel in which the stronger model moves between the hub and an outer position, with the note hub or outer position, no reliable difference, and neither beat the network without one. A last line reads: in the transformation study, a stronger hub or upper tier did not reliably reduce unsupported content.',
    build: function (svg, U) {
      var c = {};
      c.L = U.g(svg);
      var P = [[440, 110], [290, 290], [590, 290], [210, 470], [370, 470], [510, 470], [670, 470]];
      c.h = P.map(function (p, i) { return U.agent(c.L, { x: p[0], y: p[1], r: i ? 32 : 38 }); });
      [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [2, 6]].forEach(function (e) { U.link(c.L, c.h[e[0]], c.h[e[1]], {}); });
      U.text(c.L, 530, 116, 'stronger model', 'lab lab--hi', { 'text-anchor': 'start' });
      U.text(c.L, 440, 590, 'synthesis quality higher', 'word--lg', { 'text-anchor': 'middle' });
      U.text(c.L, 440, 640, 'direction held · estimate imprecise', 'lab', { 'text-anchor': 'middle' });
      c.R = U.g(svg);
      var W = [[1330, 300], [1330, 110], [1520, 300], [1330, 490], [1140, 300]];
      c.w = W.map(function (p, i) { return U.agent(c.R, { x: p[0], y: p[1], r: i ? 32 : 38 }); });
      [1, 2, 3, 4].forEach(function (i) { U.link(c.R, c.w[0], c.w[i], {}); });
      c.wlab = U.text(c.R, 1330, 590, 'hub or outer position', 'word--lg', { 'text-anchor': 'middle' });
      U.text(c.R, 1330, 640, 'no reliable difference', 'lab', { 'text-anchor': 'middle' });
      c.none = U.text(c.R, 1330, 680, 'neither beat the network without one', 'lab', { 'text-anchor': 'middle' });
      c.mut = U.text(svg, 884, 750, 'transformation study: a stronger hub or upper tier did not reliably reduce unsupported content', 'cap', { 'text-anchor': 'middle' });
      c.mid = U.el('line', { x1: 884, y1: 60, x2: 884, y2: 660, 'class': 'rule' }, svg);
      return c;
    },
    draw: function (c, t, U) {
      var p1 = U.cue(1);
      U.op(c.L, U.ramp(t, 0.5, 0.8));
      U.cls(c.h[0].g, 'is-fill', t >= U.say(0, 'one agent used')); U.cls(c.h[0].g, 'is-on', t >= U.say(0, 'one agent used'));
      U.op(c.R, U.ramp(t, p1, 0.8));
      var per = 5, k = t < p1 + 3 ? 0 : Math.floor((t - p1 - 3) / per) % 2;
      c.w.forEach(function (a, i) { var on = (k === 0 && i === 0) || (k === 1 && i === 2); U.cls(a.g, 'is-fill', on && t >= p1); U.cls(a.g, 'is-on', on && t >= p1); });
      U.op(c.none, U.ramp(t, U.say(1, 'neither placement reliably'), 0.6));
      U.op(c.mut, U.ramp(t, U.say(1, 'In the transformation study'), 0.8));
      U.em(c.L, t >= p1 ? 1 : 2);
    } });
})();
