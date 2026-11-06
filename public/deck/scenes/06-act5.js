/* Act V scenes: evaluation, applications, governance, open questions, closing.
   Every draw() is a pure function of t. Toy outcomes are computed here from the
   six-clue rules (NCMA.models) and from the chapter-16 teaching models of the
   reference edition (site/js/models/ch16.js), ported below so this file has no
   new dependency: mulberry32 replications, message loss, pass@k and pass^k. */
(function () {
  'use strict';
  var NCMA = window.NCMA, M = NCMA.models, SIX = M.SIX;
  var ILL = 'Illustrative model · outcomes follow from stated rules';
  var REP = 'Reported findings · values as reported in the sources';

  // ---------------------------------------------------------------- helpers
  function ln(U, parent, cls, arrow) { var p = U.el('path', { 'class': 'ln' + (cls ? ' ' + cls : '') }, parent); if (arrow) p.setAttribute('marker-end', 'url(#arrow)'); return p; }
  function seg(U, p, a, b, r1, r2) { var s = U.seg(a, b, r1, r2); var d = 'M' + s[0][0].toFixed(1) + ',' + s[0][1].toFixed(1) + ' L' + s[1][0].toFixed(1) + ',' + s[1][1].toFixed(1); if (p.getAttribute('d') !== d) p.setAttribute('d', d); return s; }
  function T(U, parent, x, y, s, cls, anchor) { var e = U.text(parent, x, y, s, cls || 'lab', { 'text-anchor': anchor || 'middle' }); U.op(e, 0); return e; }
  function lerp(a, b, p) { return a + (b - a) * p; }
  function fillc(e, v) { if (e.style.fill !== v) e.style.fill = v; }
  function strokec(e, v) { if (e.style.stroke !== v) e.style.stroke = v; }
  function mid(a, b, f) { f = f == null ? 0.5 : f; return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]; }
  function xy(a) { return [a.x, a.y]; }
  var MINT = 'var(--mint)', WARM = 'var(--warm)', ALERT = 'var(--alert)', TXT = 'var(--text)';

  // ---------------------------------------------------------------- chapter-16 models (ported)
  var C16 = {};
  C16.rng = function (seed) {
    var s = seed >>> 0;
    return function () { s = (s + 0x6D2B79F5) >>> 0; var t = s; t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  };
  var sign = function (x, prev) { return x > 0 ? 'A' : x < 0 ? 'B' : prev; };
  // evidence exchange with independent message loss; records every message and its fate
  C16.trace = function (o) {
    var nb = M.neighbors(SIX.topologies[o.topology]), know = {}, judge = {}, rounds = [];
    SIX.agents.forEach(function (a) { know[a] = [a]; judge[a] = sign(SIX.clue[a], null); });
    var j0 = Object.assign({}, judge);
    for (var r = 1; r <= o.rounds; r++) {
      var nk = {}, nj = {}, msgs = [];
      SIX.agents.forEach(function (a) {
        var got = nb[a].filter(function (s) { var ok = o.rand() >= o.loss; msgs.push({ from: s, to: a, ok: ok, n: know[s].length }); return ok; });
        var u = know[a].slice();
        got.forEach(function (s) { know[s].forEach(function (id) { if (u.indexOf(id) < 0) u.push(id); }); });
        u.sort(); nk[a] = u; nj[a] = sign(M.sum(u), judge[a]);
      });
      know = nk; judge = nj; rounds.push({ msgs: msgs, judge: Object.assign({}, judge) });
    }
    return { j0: j0, rounds: rounds, judge: judge };
  };
  C16.majority = function (judge) { var nA = SIX.agents.filter(function (a) { return judge[a] === 'A'; }).length; return nA > 3 ? 'A' : nA < 3 ? 'B' : 'tie'; };
  C16.SPREAD = { topology: 'starA1', rounds: 2, loss: 0.2, seed: 16, reps: 200 };
  C16.replicate = function () {
    var cfg = C16.SPREAD, out = [];
    for (var i = 0; i < cfg.reps; i++) { var tr = C16.trace({ topology: cfg.topology, rounds: cfg.rounds, loss: cfg.loss, rand: C16.rng(cfg.seed * 100003 + i) }); out.push({ tr: tr, outcome: C16.majority(tr.judge) }); }
    return out;
  };
  C16.clustered = function () {
    var cfg = { topology: 'starA1', rounds: 2, seed: 7, variants: 8, runsPer: 25, lossLo: 0.05, lossHi: 0.8 };
    var g = C16.rng(cfg.seed), tasks = [];
    for (var t = 0; t < cfg.variants; t++) {
      var loss = cfg.lossLo + (cfg.lossHi - cfg.lossLo) * g(), succ = 0, runs = [];
      for (var i = 0; i < cfg.runsPer; i++) {
        var tr = C16.trace({ topology: cfg.topology, rounds: cfg.rounds, loss: loss, rand: C16.rng(cfg.seed * 7919 + t * 1009 + i) });
        var ok = C16.majority(tr.judge) === 'A'; runs.push(ok); if (ok) succ++;
      }
      tasks.push({ loss: loss, successes: succ, runs: runs });
    }
    return tasks;
  };
  function choose(n, k) { if (k < 0 || k > n) return 0; var r = 1; for (var i = 1; i <= k; i++) r = r * (n - k + i) / i; return r; }
  C16.passAt = function (n, c, k) { return 1 - choose(n - c, k) / choose(n, k); };
  C16.passHat = function (n, c, k) { return choose(c, k) / choose(n, k); };
  C16.wilson = function (x, n) { var z = 1.96, p = x / n, d = 1 + z * z / n, c = p + z * z / (2 * n), h = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)); return [(c - h) / d, (c + h) / d]; };
  C16.attrs = function (nodes, edges, readout) {
    var into = {}; nodes.forEach(function (n) { into[n] = []; }); edges.forEach(function (e) { into[e[1]].push(e[0]); });
    var memo = {}; function depth(n) { if (memo[n] != null) return memo[n]; var d = 0; into[n].forEach(function (s) { d = Math.max(d, 1 + depth(s)); }); return (memo[n] = d); }
    var fan = 0; nodes.forEach(function (n) { fan = Math.max(fan, into[n].length); });
    return [nodes.length, edges.length, depth(readout), fan]; // calls, messages, steps to the answer, largest fan-in
  };

  // =================================================================== 1. bundled change
  // Each organization is drawn on its own: agents are model calls, arrows are messages,
  // numerals count the steps to the answer, and a warm node with warm arrows is the
  // largest fan-in. All four attributes are computed from the drawn graphs.
  var IDS = ['w1', 'w2', 'w3', 'w4', 'l1', 'l2', 'm'];
  function starP() { var p = { m: [-40, 400] }; ['l1', 'w4', 'w3', 'w2', 'w1', 'l2'].forEach(function (id, i) { var a = (90 + i * 36) * Math.PI / 180; p[id] = [-40 + 175 * Math.cos(a), 400 + 175 * Math.sin(a)]; }); return p; }
  var CHX = [-290, -210, -130, -50, 30, 110, 190], CHY = [300, 500, 300, 500, 300, 500, 400];
  function chainP() { var p = {}; IDS.forEach(function (id, i) { p[id] = [CHX[i], CHY[i]]; }); return p; }
  var LAY = {
    single: { p: starP(), on: ['m'], e: [], ans: [100, 400] },
    star: { p: starP(), on: IDS, e: ['w1', 'w2', 'w3', 'w4', 'l1', 'l2'].map(function (s) { return [s, 'm']; }), ans: [100, 400] },
    tree: { p: { w1: [-200, 190], w2: [-200, 330], w3: [-200, 470], w4: [-200, 610], l1: [-60, 260], l2: [-60, 540], m: [80, 400] }, on: IDS, e: [['w1', 'l1'], ['w2', 'l1'], ['w3', 'l2'], ['w4', 'l2'], ['l1', 'm'], ['l2', 'm']], ans: [200, 400] },
    chain: { p: chainP(), on: IDS, e: [['w1', 'w2'], ['w2', 'w3'], ['w3', 'w4'], ['w4', 'l1'], ['l1', 'l2'], ['l2', 'm']], ans: [280, 400] },
    chain3: { p: (function () { var p = chainP(); p.w1 = p.w2 = p.w3 = p.w4 = [-100, 400]; p.l1 = [-100, 400]; p.l2 = [40, 400]; p.m = [180, 400]; return p; })(), on: ['l1', 'l2', 'm'], e: [['l1', 'l2'], ['l2', 'm']], ans: [280, 400] }
  };
  // the longest path into the readout (its length is the steps to the answer) and the node with the largest fan-in
  Object.keys(LAY).forEach(function (k) {
    var L = LAY[k], into = {}; L.on.forEach(function (n) { into[n] = []; }); L.e.forEach(function (e) { into[e[1]].push(e[0]); });
    function longest(n) { var best = []; into[n].forEach(function (s) { var q = longest(s).concat([[s, n]]); if (q.length > best.length) best = q; }); return best; }
    L.path = longest('m'); L.a = C16.attrs(L.on, L.e, 'm');
    L.fan = 'm'; L.on.forEach(function (n) { if (into[n].length > into[L.fan].length) L.fan = n; });
  });
  var ALLE = {}; Object.keys(LAY).forEach(function (k) { LAY[k].e.forEach(function (e) { ALLE[e[0] + '-' + e[1]] = e; }); });
  NCMA.scene({ id: 'bundled-change', note: 'Illustrative · agents are model calls, arrows are messages, computed from the drawn graphs', desc: 'One agent answers alone. Beside it seven agents form a hierarchy: four workers, two leads and a manager. As the passage names each difference, the agents light as model calls, messages travel the six arrows, the two steps to the answer are numbered, and the manager and its two incoming arrows turn warm as the point where inputs are reconciled. The single agent then becomes the hub of a star of seven, and a chain of seven appears on the right of the hierarchy. All three light their seven agents and six arrows together, while the star shows one numbered step and a hub reading six arrows and the chain shows six numbered steps and one arrow into its last agent. Finally the star leaves, the chain shrinks to three agents with two numbered steps and three calls, and a dashed outline marks the hierarchy as one bundle.',
    build: function (svg, U) {
      var c = { org: {} };
      c.bundle = U.el('rect', { x: 0, y: 115, width: 540, height: 665, rx: 12, 'class': 'zone' }, svg); U.op(c.bundle, 0);
      c.bundleLab = T(U, svg, 0, 100, 'the architecture, as one bundle', 'lab lab--hi', 'middle');
      ['left', 'mid', 'right'].forEach(function (side) {
        var o = { g: U.g(svg), n: {}, e: {}, num: [] };
        o.eg = U.g(o.g); o.ng = U.g(o.g); o.tk = U.g(o.g);
        Object.keys(ALLE).forEach(function (k) { o.e[k] = { p: ln(U, o.eg, '', true), e: ALLE[k], tk: U.token(o.tk, 'evidence', { r: 9 }) }; });
        o.ae = ln(U, o.eg, '', true);
        IDS.forEach(function (id) { o.n[id] = U.agent(o.ng, { x: 0, y: 0, r: 26 }); });
        o.ans = U.agent(o.g, { x: 0, y: 0, r: 24, role: 'tool' });
        o.ansLab = side === 'left' ? T(U, o.g, 0, 0, 'answer', 'lab') : null;
        for (var i = 0; i < 6; i++) o.num.push(T(U, o.g, 0, 0, String(i + 1), 'word word--lg'));
        o.name = T(U, o.g, 0, 745, '', 'lab lab--t2');
        c.org[side] = o;
      });
      return c;
    },
    draw: function (c, t, U) {
      var tH = U.say(0, 'Beside it, seven agents'), tRe = U.say(2, 'Keep the seven agents'), tS = U.say(2, 'As a star'), tC = U.say(2, 'As a chain'), t3 = U.say(3, 'A chain of three');
      var tCalls = U.say(1, 'makes seven model calls'), tMsg = U.say(1, 'sends six messages'), tDep = U.say(1, 'passes work through two levels'), tFan = U.say(1, 'reconcile two inputs');
      var tMatch = U.say(2, 'Calls and messages are now matched'), tSD = U.say(2, 'The star needs one step'), tSF = U.say(2, 'its hub must read six inputs');
      var tCF = U.say(2, 'The chain reads one input'), tCD = U.say(2, 'needs six steps'), t3c = U.say(3, 'three calls instead of seven'), tB = U.say(3, 'Otherwise the defensible report');
      function pulse(t0) { return t >= t0 && t < t0 + 2.6; }
      function slide(pts) { var x = pts[0][1]; pts.forEach(function (q) { if (t >= q[0]) x = lerp(x, q[1], U.ramp(t, q[0], 1.4)); }); return x; }
      // organization: layout from A to B (p), group x, opacity, and what is shown
      function org(o, A, B, p, gx, op, s) {
        U.place(o.g, gx, 0); U.op(o.g, op);
        var pos = {};
        IDS.forEach(function (id) {
          var a = A.p[id], b = B.p[id]; pos[id] = [lerp(a[0], b[0], p), lerp(a[1], b[1], p)];
          U.place(o.n[id].g, pos[id][0], pos[id][1]);
          var va = A.on.indexOf(id) >= 0 ? 1 : 0, vb = B.on.indexOf(id) >= 0 ? 1 : 0; U.op(o.n[id].g, lerp(va, vb, p));
          U.cls(o.n[id].g, 'is-on', s.calls && B.on.indexOf(id) >= 0);
          var fan = s.fan && id === B.fan; strokec(o.n[id].shape, fan ? WARM : ''); o.n[id].shape.style.strokeWidth = fan ? '5' : '';
        });
        var ap = [lerp(A.ans[0], B.ans[0], p), 400]; U.place(o.ans.g, ap[0], ap[1]);
        if (o.ansLab) { U.place(o.ansLab, ap[0], 470); U.op(o.ansLab, 1); }
        seg(U, o.ae, pos.m, ap, 32, 30); U.op(o.ae, 0.85);
        var inA = {}, inB = {}; A.e.forEach(function (e) { inA[e[0] + '-' + e[1]] = 1; }); B.e.forEach(function (e) { inB[e[0] + '-' + e[1]] = 1; });
        Object.keys(o.e).forEach(function (key) {
          var E = o.e[key], v = inA[key] && inB[key] ? 1 : inB[key] ? U.ramp(p, 0.6, 0.4) : inA[key] ? 1 - U.ramp(p, 0, 0.4) : 0;
          var sg = null; U.op(E.p, v * 0.85); if (v > 0) sg = seg(U, E.p, pos[E.e[0]], pos[E.e[1]], 32, 34);
          var warm = s.fan && inB[key] && E.e[1] === B.fan;
          U.cls(E.p, 'is-live', !!(s.calls && inB[key]) && !warm); strokec(E.p, warm ? WARM : ''); E.p.style.strokeWidth = warm ? '4' : '';
          if (s.msg != null && inB[key] && sg) U.fly(E.tk, sg, t, s.msg, 1.3, false); else U.op(E.tk, 0);
        });
        // step numerals along the longest path to the answer
        o.num.forEach(function (e, i) {
          var q = B.path[i]; if (!q || s.dep == null) { U.op(e, 0); return; }
          var a = pos[q[0]], b = pos[q[1]], mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1;
          var nx = -dy / d, ny = dx / d; if (Math.abs(dy) > Math.abs(dx) ? nx > 0 : ny > 0) { nx = -nx; ny = -ny; }
          U.place(e, mx + nx * 28, my + ny * 28 + 11); e.setAttribute('x', 0); e.setAttribute('y', 0); fillc(e, MINT);
          U.op(e, U.ramp(t, s.dep + i * 0.35, 0.4));
        });
      }
      var L = c.org.left, Mo = c.org.mid, R = c.org.right;
      // left: one agent, which becomes the hub of a star, then leaves
      var lp = t < tS ? 0 : U.ramp(t, tS, 1.4);
      org(L, LAY.single, t < tS ? LAY.single : LAY.star, t < tS ? 1 : lp, slide([[0, 520], [tRe, 250]]), 1 - U.ramp(t, t3, 1.0), {
        calls: pulse(tCalls) || (t >= tS && pulse(tMatch)), msg: t >= tS ? tMatch : null,
        dep: t >= tS ? tSD : null, fan: t >= tSF });
      U.setText(L.name, t < tS ? 'one agent' : 'star'); U.op(L.name, 1);
      // middle: the hierarchy, built in the order the passage names its levels
      var hp = U.ramp(t, tH, 1.2);
      org(Mo, LAY.tree, LAY.tree, 1, slide([[0, 1200], [tRe, 780], [t3, 600]]), hp, {
        calls: pulse(tCalls) || pulse(tMatch) || pulse(t3c), msg: t >= tMatch ? tMatch : tMsg, dep: tDep, fan: t >= tFan });
      var wk = U.say(0, 'four workers answer'), ld = U.say(0, 'two leads combine'), mg = U.say(0, 'and a manager');
      var nop = { m: U.ramp(t, mg, 0.6) }; nop.l1 = nop.l2 = U.ramp(t, ld, 0.6); ['w1', 'w2', 'w3', 'w4'].forEach(function (id) { nop[id] = U.ramp(t, wk, 0.6); });
      IDS.forEach(function (id) { U.op(Mo.n[id].g, nop[id]); });
      LAY.tree.e.forEach(function (e) { U.op(Mo.e[e[0] + '-' + e[1]].p, 0.85 * Math.min(nop[e[0]], nop[e[1]])); });
      U.op(Mo.ae, 0.85 * nop.m); U.op(Mo.ans.g, nop.m);
      U.setText(Mo.name, 'hierarchy'); U.op(Mo.name, 1);
      // right: a chain of seven, then a chain of three
      var rp = t < t3 ? 1 : U.ramp(t, t3, 1.6);
      org(R, LAY.chain, t < t3 ? LAY.chain : LAY.chain3, rp, slide([[0, 1400], [t3, 1220]]), U.ramp(t, tC, 1.0), {
        calls: pulse(tMatch) || pulse(t3c), msg: tMatch, dep: t < t3 ? tCD : t3 + 1.0, fan: t >= tCF });
      U.setText(R.name, t < t3 + 0.8 ? 'chain' : 'chain of three'); U.op(R.name, 1);
      // the bundle
      var bx = slide([[0, 780], [t3, 600]]) - 280; c.bundle.setAttribute('x', bx.toFixed(1)); U.place(c.bundleLab, bx + 280, 0); c.bundleLab.setAttribute('x', 0);
      U.op(c.bundle, U.ramp(t, tB, 0.8)); U.op(c.bundleLab, U.ramp(t, tB + 0.4, 0.8));
    } });

  // =================================================================== 2. rerun spread
  var REPS = C16.replicate();
  var SHOWN = 1; // the run animated in passage 0 (a strong clue lost on its way to the hub)
  NCMA.scene({ id: 'rerun-spread', note: ILL + ' · seed 16, 200 runs', desc: 'The six agents in a star with the top agent as hub exchange evidence for two rounds while some messages are lost, marked with a cross. In the run shown, a strong clue never reaches the hub and most agents end at B. On the right, the first ten runs appear as a row of answers, then 200 runs pile into three stacks: A 129, B 35, no decision 36, with the share answering A and its interval. The network then replays the first ten runs one after another, ending differently each time.',
    build: function (svg, U) {
      var c = NCMA.six(svg, U, { cx: 380, cy: 390, R: 230, r: 36 });
      c.msgs = [0, 1].map(function (r) {
        return REPS[SHOWN].tr.rounds[r].msgs.map(function (m) {
          var A = c.pos[m.from], B = c.pos[m.to], s = U.seg([A[0], A[1]], [B[0], B[1]], 46, 46);
          return { m: m, pts: s, tk: U.token(c.tk, 'evidence', { r: 18, label: m.n }), x: U.token(c.tk, 'lost', { r: 16 }) };
        });
      });
      c.read = T(U, svg, 380, 770, '', 'word--lg');
      c.lost = T(U, svg, 380, 30, 'each message lost with probability 0.2', 'lab', 'middle');
      // first ten
      c.tenLab = T(U, svg, 880, 70, 'first ten runs', 'lab', 'start');
      c.ten = REPS.slice(0, 10).map(function (r, i) {
        var tk = r.outcome === 'tie' ? U.token(svg, 'hedged', { r: 22, label: '=' }) : U.token(svg, 'conclusion', { r: 22, label: r.outcome });
        U.place(tk, 900 + i * 88, 130); return tk;
      });
      // 200 runs into three stacks
      var cols = { A: 1010, B: 1310, tie: 1610 }, n = { A: 0, B: 0, tie: 0 };
      c.sq = REPS.map(function (r) {
        var k = n[r.outcome]++, x = cols[r.outcome] - 90 + (k % 10) * 18, y = 600 - Math.floor(k / 10) * 18 - 14;
        return { e: U.el('rect', { x: x, y: y, width: 14, height: 14, rx: 2, 'class': r.outcome === 'A' ? 'bar bar--hi' : r.outcome === 'B' ? 'bar' : 'bar bar--mu' }, svg), o: r.outcome };
      });
      c.cnt = {}; c.colLab = {};
      [['A', 'A'], ['B', 'B'], ['tie', 'no decision']].forEach(function (p) { c.cnt[p[0]] = T(U, svg, cols[p[0]], 330, '', 'word--lg'); c.colLab[p[0]] = T(U, svg, cols[p[0]], 640, p[1], 'lab'); });
      c.ivl = T(U, svg, 1310, 715, '', 'cap');
      c.det = T(U, svg, 1310, 770, 'same rules without loss: A in every run', 'lab');
      return c;
    },
    draw: function (c, t, U) {
      c.topo('starA1', t, 0.3); c.clues(1);
      var p1 = U.cue(1), p2 = U.cue(2);
      U.op(c.lost, U.ramp(t, U.say(0, 'every message is lost'), 0.6));
      var r1 = U.say(0, 'In this run'), D = 1.6, gap = 3.0;
      // passage 0: the animated run
      var judge = REPS[SHOWN].tr.j0;
      if (t < p2) {
        c.msgs.forEach(function (round, r) {
          var t0 = r1 + r * gap;
          round.forEach(function (x, i) {
            var st = t0 + (i % 6) * 0.04;
            if (x.m.ok) { U.fly(x.tk, x.pts, t, st, D, false); U.op(x.x, 0); }
            else {
              var half = [x.pts[0], mid(x.pts[0], x.pts[1])];
              U.fly(x.tk, half, t, st, D / 2, false);
              var xm = half[1]; U.place(x.x, xm[0], xm[1]);
              U.op(x.x, t < st + D / 2 ? 0 : t < st + D + 1.6 ? 1 : (t < p1 ? 0.6 : 0));
            }
          });
        });
        if (t >= r1 + D + 0.1) judge = REPS[SHOWN].tr.rounds[0].judge;
        if (t >= r1 + gap + D + 0.1) judge = REPS[SHOWN].tr.rounds[1].judge;
        SIX.agents.forEach(function (a) { c.judge(a, judge[a]); });
        var done = t >= r1 + gap + D + 0.4;
        U.setText(c.read, done ? 'majority: ' + REPS[SHOWN].outcome : ''); U.op(c.read, done ? 1 : 0);
      } else {
        c.msgs.forEach(function (round) { round.forEach(function (x) { U.op(x.tk, 0); U.op(x.x, 0); }); });
        // passage 2: replay the first ten endings, one per second
        var k = Math.floor((t - p2 - 0.5) / 1.1); k = ((k % 10) + 10) % 10;
        var jj = REPS[k].tr.judge; SIX.agents.forEach(function (a) { c.judge(a, jj[a]); });
        U.setText(c.read, 'run ' + (k + 1) + ': ' + (REPS[k].outcome === 'tie' ? 'no decision' : REPS[k].outcome)); U.op(c.read, 1);
        c.ten.forEach(function (tk, i) { U.place(tk, 900 + i * 88, 130, i === k ? 1.25 : 1); });
      }
      // the row of ten
      var tTen = U.say(1, 'The first ten runs');
      U.op(c.tenLab, U.ramp(t, tTen, 0.5));
      c.ten.forEach(function (tk, i) {
        var at = tTen + 0.5 + i * 0.35;
        U.op(tk, U.ramp(t, at, 0.4));
        if (t < p2) U.place(tk, 900 + i * 88, 130, 1);
      });
      // 200 runs, in replication order
      var ts = U.say(1, 'Over 200 runs'), per = 7.5 / 200, n = { A: 0, B: 0, tie: 0 };
      c.sq.forEach(function (s, i) { var on = t >= ts + i * per; U.op(s.e, on ? 1 : 0); if (on) n[s.o]++; });
      ['A', 'B', 'tie'].forEach(function (k2) { U.setText(c.cnt[k2], String(n[k2])); U.op(c.cnt[k2], t >= ts ? 1 : 0); U.op(c.colLab[k2], U.ramp(t, ts, 0.5)); });
      var w = C16.wilson(129, 200);
      U.setText(c.ivl, 'A in 64.5% of runs · 95% interval ' + Math.round(w[0] * 100) + ' to ' + Math.round(w[1] * 100) + '%');
      U.op(c.ivl, U.ramp(t, U.say(1, 'The share answering A'), 0.6));
      U.op(c.det, U.ramp(t, U.say(1, 'Under the same rules'), 0.6));
    } });

  // =================================================================== 3. tasks and attempts
  var TASKS = C16.clustered().slice().sort(function (a, b) { return b.successes - a.successes || a.loss - b.loss; });
  var PASS = TASKS.map(function (k) { return [C16.passAt(25, k.successes, 8), C16.passHat(25, k.successes, 8)]; });
  var PA = PASS.reduce(function (a, p) { return a + p[0]; }, 0) / 8, PH = PASS.reduce(function (a, p) { return a + p[1]; }, 0) / 8;
  var RATES = TASKS.map(function (k) { return k.successes / 25; });
  var MEAN = RATES.reduce(function (a, b) { return a + b; }, 0) / 8;
  var B1 = 420, B2 = 660; // bar baselines once the run blocks have cleared
  var SE_RUN = Math.sqrt(MEAN * (1 - MEAN) / 200), SE_TASK = Math.sqrt(RATES.reduce(function (a, r) { return a + (r - MEAN) * (r - MEAN); }, 0) / 7 / 8);
  NCMA.scene({ id: 'every-attempt', note: ILL + ' · seed 7, 8 versions × 25 runs', desc: 'Eight blocks of 25 squares, one per version of the task, ordered from most to fewest successes; filled squares are successful runs, from 22 of 25 down to 1 of 25. On the right two intervals around 0.50: a narrow one treating runs as units and a wider one treating versions as units. Then the blocks and intervals clear, leaving each version’s count, and two rows of bars per version appear: the chance that at least one of eight attempts succeeds, averaging 0.91, and the chance that all eight succeed, averaging 0.042.',
    build: function (svg, U) {
      var c = { col: [] };
      c.head = T(U, svg, 120, 60, '', 'word', 'start');
      TASKS.forEach(function (k, j) {
        var x0 = 120 + j * 160, g = U.g(svg), cells = [];
        k.runs.forEach(function (ok, i) { cells.push(U.el('rect', { x: x0 + (i % 5) * 24, y: 110 + Math.floor(i / 5) * 24, width: 18, height: 18, rx: 2, 'class': ok ? 'bar bar--hi' : 'box' }, g)); });
        var lab = T(U, svg, x0 + 57, 275, k.successes + '/25', 'lab');
        var b1 = U.el('rect', { x: x0 + 29, y: B1, width: 56, height: 0, 'class': 'bar bar--hi' }, svg);
        var b2 = U.el('rect', { x: x0 + 29, y: B2, width: 56, height: 0, 'class': 'bar bar--warm' }, svg);
        U.op(g, 0); c.col.push({ g: g, lab: lab, b1: b1, b2: b2 });
      });
      c.loss = T(U, svg, 120, 322, 'eight versions, ordered by successes', 'lab', 'start');
      // intervals
      c.iv = U.g(svg);
      var Y = function (v) { return 360 - (v - 0.2) / 0.6 * 250; }; c.Y = Y;
      U.el('line', { x1: 1440, y1: Y(0.5), x2: 1750, y2: Y(0.5), 'class': 'rule', 'stroke-dasharray': '6 6' }, c.iv);
      U.text(c.iv, 1430, Y(0.7) + 8, '0.7', 'lab', { 'text-anchor': 'end' }); U.text(c.iv, 1430, Y(0.3) + 8, '0.3', 'lab', { 'text-anchor': 'end' });
      U.el('line', { x1: 1440, y1: Y(0.7), x2: 1452, y2: Y(0.7), 'class': 'rule' }, c.iv); U.el('line', { x1: 1440, y1: Y(0.3), x2: 1452, y2: Y(0.3), 'class': 'rule' }, c.iv);
      function ivl(x, se, cls, lab) { var g = U.g(c.iv), lo = MEAN - 1.96 * se, hi = MEAN + 1.96 * se; U.el('line', { x1: x, y1: Y(lo), x2: x, y2: Y(hi), 'class': 'ln ' + cls, 'stroke-width': 5 }, g); [lo, hi].forEach(function (v) { U.el('line', { x1: x - 16, y1: Y(v), x2: x + 16, y2: Y(v), 'class': 'ln ' + cls, 'stroke-width': 4 }, g); }); U.el('circle', { cx: x, cy: Y(MEAN), r: 8, 'class': 'nd' }, g); U.text(g, x, 400, lab, 'lab', { 'text-anchor': 'middle' }); U.op(g, 0); return g; }
      c.i1 = ivl(1530, SE_RUN, 'is-live', 'per run'); c.i2 = ivl(1680, SE_TASK, 'is-bad', 'per task');
      // reliability rows
      c.r1 = T(U, svg, 120, B1 - 140, 'at least one of 8 succeeds', 'lab lab--t2', 'start');
      c.r2 = T(U, svg, 120, B2 - 140, 'all 8 succeed', 'lab lab--t2', 'start');
      c.d1 = T(U, svg, 520, B1 - 140, '· when a test picks the success', 'lab lab--hi', 'start');
      c.d2 = T(U, svg, 330, B2 - 140, '· when every attempt acts on the world', 'lab lab--warm', 'start');
      c.n1 = T(U, svg, 1600, B1, PA.toFixed(2), 'big big--hi'); c.n2 = T(U, svg, 1600, B2, PH.toFixed(3), 'big big--warm');
      c.avg = T(U, svg, 1600, B1 - 140, 'average over versions', 'lab');
      c.uni = T(U, svg, 1745, B2 + 60, 'if every version succeeded half the time: ' + Math.pow(0.5, 8).toFixed(3), 'lab', 'end');
      return c;
    },
    draw: function (c, t, U) {
      var tc = U.say(0, 'run each version 25 times');
      var p2 = U.cue(2), out = t >= p2 ? 1 - U.ramp(t, p2, 0.8) : 1, up = U.ramp(t, p2 + 0.4, 1.0);
      c.col.forEach(function (k, j) { U.op(k.g, U.ramp(t, tc + j * 0.45, 0.5) * out); U.op(k.lab, U.ramp(t, tc + j * 0.45 + 0.3, 0.5)); U.place(k.lab, 0, -150 * up); });
      U.op(c.loss, U.ramp(t, U.say(0, 'from 22 of 25'), 0.6) * out);
      U.setText(c.head, 'pooled over 200 runs: ' + MEAN.toFixed(2)); U.op(c.head, U.ramp(t, U.say(0, 'Pooled over all 200 runs'), 0.6) * out);
      U.op(c.i1, U.ramp(t, U.say(1, 'Treated as 200'), 0.6)); U.op(c.i2, U.ramp(t, U.say(1, 'Treating the eight versions'), 0.6));
      var ta = U.say(2, 'the chance that at least one'), th = U.say(2, 'the chance that all eight');
      U.op(c.r1, U.ramp(t, ta, 0.5)); U.op(c.r2, U.ramp(t, th, 0.5));
      c.col.forEach(function (k, j) {
        var h1 = 110 * PASS[j][0] * U.ramp(t, ta + 0.3 + j * 0.12, 0.8), h2 = 110 * PASS[j][1] * U.ramp(t, th + 0.3 + j * 0.12, 0.8);
        k.b1.setAttribute('y', (B1 - h1).toFixed(1)); k.b1.setAttribute('height', h1.toFixed(1));
        k.b2.setAttribute('y', (B2 - h2).toFixed(1)); k.b2.setAttribute('height', Math.max(h2, 0).toFixed(1));
        U.op(k.b2, t >= th ? 1 : 0);
      });
      U.op(c.n1, U.ramp(t, U.say(2, 'Averaged over the eight'), 0.6)); U.op(c.avg, U.ramp(t, U.say(2, 'Averaged over the eight'), 0.6));
      U.op(c.n2, U.ramp(t, U.say(2, 'Here it is 0.042'), 0.6)); U.op(c.uni, U.ramp(t, U.say(2, 'Had every version'), 0.6));
      U.op(c.d1, U.ramp(t, U.say(3, 'Software benchmarks'), 0.6)); U.op(c.d2, U.ramp(t, U.say(3, 'A workflow that sends'), 0.6));
      U.op(c.iv, out);
    } });

  // =================================================================== 4. removing a message
  var SENDERS = ['a2', 'a3', 'a4', 'a5', 'a6'];
  function directed(drop) { var e = []; SIX.agents.forEach(function (a) { SIX.agents.forEach(function (b) { if (a !== b && !(drop && a === drop[0] && b === drop[1])) e.push([a, b]); }); }); return e; }
  function influence(mode) { // receivers whose round-1 judgment changes when a5's message to them is removed
    var full = M.runSix({ edges: directed(), directed: true, mode: mode, rounds: 1 })[1].judge, n = 0, tot = 0, cutJ = {};
    SIX.agents.forEach(function (x) { if (x === 'a5') return; tot++; var j = M.runSix({ edges: directed(['a5', x]), directed: true, mode: mode, rounds: 1 })[1].judge; cutJ[x] = j[x]; if (j[x] !== full[x]) n++; });
    return { n: n, tot: tot, full: full.a1, cut: cutJ.a1, fullJ: full, cutJ: cutJ };
  }
  var INF = { evidence: influence('evidence'), conclusion: influence('conclusion') };
  NCMA.scene({ id: 'remove-a-message', note: ILL + ' · last passage: reported finding', source: 'Lowe et al., 2019 · Gladstone, 2026', desc: 'The six agents, with only the five channels into the top agent drawn strongly. Evidence messages labeled with clue weights fly in and the top agent judges A; with one strong clue removed it judges B, and a panel reads 5 of 5 receivers change. Then answer messages B, B, B, A, A fly in and the top agent judges B with or without the removed message, and the panel reads 0 of 5 receivers change. Finally a planted conclusion enters the network from outside.',
    build: function (svg, U) {
      var c = NCMA.six(svg, U, { cx: 520, cy: 400, R: 250, r: 40 });
      var T1 = c.pos.a1;
      c.ev = {}; c.cc = {}; c.ev2 = {}; c.cc2 = {};
      SENDERS.forEach(function (s) {
        var A = c.pos[s], w = SIX.clue[s];
        var pts = U.seg([A[0], A[1]], [T1[0], T1[1]], 50, 52);
        c.ev[s] = { tk: U.token(c.tk, 'evidence', { r: 19, label: (w > 0 ? '+' : '−') + Math.abs(w), cls: w > 0 ? 'clue-A' : 'clue-B' }), pts: pts };
        c.ev2[s] = { tk: U.token(c.tk, 'evidence', { r: 19, label: (w > 0 ? '+' : '−') + Math.abs(w), cls: w > 0 ? 'clue-A' : 'clue-B' }), pts: pts };
        c.cc[s] = { tk: U.token(c.tk, 'conclusion', { r: 18, label: w > 0 ? 'A' : 'B' }), pts: pts };
        c.cc2[s] = { tk: U.token(c.tk, 'conclusion', { r: 18, label: w > 0 ? 'A' : 'B' }), pts: pts };
      });
      c.cutX = U.token(c.tk, 'lost', { r: 18 }); var m5 = mid(c.pos.a5, c.pos.a1, 0.5); U.place(c.cutX, m5[0], m5[1]);
      c.head = T(U, svg, 1330, 120, '', 'word--lg');
      c.l1 = T(U, svg, 1330, 270, '', 'cap'); c.l2 = T(U, svg, 1330, 350, '', 'cap'); c.big = T(U, svg, 1330, 490, '', 'big');
      c.big2 = T(U, svg, 1330, 545, 'receivers change', 'lab');
      c.plant = U.token(c.tk, 'conclusion', { r: 20, label: 'A' });
      c.plantLab = T(U, svg, 1330, 650, 'planted conclusion, private evidence fixed', 'lab lab--warm');
      c.repLab = T(U, svg, 1330, 700, 'reported: its direction moved the final belief', 'lab lab--hi');
      return c;
    },
    draw: function (c, t, U) {
      c.clues(1);
      Object.keys(c.links).forEach(function (k) { U.op(c.links[k], 0.14); U.cls(c.links[k], 'is-cut', false); U.cls(c.links[k], 'is-live', false); });
      SENDERS.forEach(function (s) { U.op(c.links[s + 'a1'], 0.85); });
      var p1 = U.cue(1), p2 = U.cue(2);
      var e1 = U.say(0, 'Take the six agents'), e2 = U.say(0, 'Remove only the message'), e3 = U.say(0, 'Removing that agent');
      var k1 = U.say(1, 'The agent at the top hears'), k2 = U.say(1, 'Remove the same strong'), k3 = U.say(1, 'Removing that message from any');
      var D = 2;
      var mode = t < p1 ? 'evidence' : 'conclusion', R = INF[mode];
      var first = mode === 'evidence' ? e1 : k1, second = mode === 'evidence' ? e2 : k2, third = mode === 'evidence' ? e3 : k3;
      var A = mode === 'evidence' ? c.ev : c.cc, B = mode === 'evidence' ? c.ev2 : c.cc2, O1 = mode === 'evidence' ? c.cc : c.ev, O2 = mode === 'evidence' ? c.cc2 : c.ev2;
      SENDERS.forEach(function (s) {
        U.op(O1[s].tk, 0); U.op(O2[s].tk, 0);
        if (t < second) { U.fly(A[s].tk, A[s].pts, t, first + SENDERS.indexOf(s) * 0.08, D, false); U.op(B[s].tk, 0); }
        else { U.op(A[s].tk, 0); if (s === 'a5') U.op(B[s].tk, 0); else U.fly(B[s].tk, B[s].pts, t, second + 0.9 + SENDERS.indexOf(s) * 0.08, D, false); }
      });
      var cutOn = t >= second && t < (mode === 'evidence' ? p1 : p2 + 0.5);
      U.cls(c.links.a5a1, 'is-cut', cutOn); U.op(c.cutX, cutOn ? U.ramp(t, second, 0.4) : 0);
      // judgments: others show their own first answer; the top agent updates after arrival
      SIX.agents.forEach(function (a) { c.judge(a, sign(SIX.clue[a], null)); });
      var top = sign(SIX.clue.a1, null);
      if (t >= first + D + 0.2) top = R.full;
      if (t >= second + 0.2) top = 'B';
      if (t >= second + 0.9 + D + 0.4) top = R.cut;
      if (mode === 'evidence' && t >= second && t < second + 0.9 + D + 0.4) top = '';
      if (mode === 'conclusion' && t >= second && t < second + 0.9 + D + 0.4) top = '';
      if (t < first) top = sign(SIX.clue.a1, null);
      c.judge('a1', top);
      // every receiver of the strong agent: all messages arrive, then the strong agent's message to each is removed in turn
      var tr = third + 0.2, others = ['a2', 'a3', 'a4', 'a6'];
      if (t >= tr && t < (mode === 'evidence' ? p1 : p2)) {
        others.forEach(function (x) { SIX.agents.forEach(function (y) { if (y !== x && c.links[y + x]) U.op(c.links[y + x], t < tr + 1.0 ? 0.55 : 0.14); }); });
        others.forEach(function (x, i) {
          var tx = tr + 1.0 + i * 0.45;
          c.judge(x, t >= tx + 0.3 ? R.cutJ[x] : R.fullJ[x]);
          if (t >= tx) { U.op(c.links['a5' + x], 0.85); U.cls(c.links['a5' + x], 'is-cut', true); }
        });
      }
      // panel
      U.setText(c.head, mode === 'evidence' ? 'messages carry evidence' : 'messages carry only answers');
      U.op(c.head, t < p2 ? U.ramp(t, mode === 'evidence' ? 1 : p1, 0.6) : 1 - U.ramp(t, p2, 0.6));
      U.setText(c.l1, 'with all five messages: ' + R.full); U.op(c.l1, t < p2 ? (t >= first + D + 0.3 ? 1 : 0) : 0.25);
      U.setText(c.l2, 'without one strong agent’s: ' + R.cut); U.op(c.l2, t < p2 ? (t >= second + 0.9 + D + 0.5 ? 1 : 0) : 0.25);
      U.setText(c.big, R.n + ' of ' + R.tot); U.cls(c.big, 'big--hi', mode === 'evidence'); U.cls(c.big, 'big--warm', mode !== 'evidence');
      var tbig = third + 1.0 + 4 * 0.45; U.op(c.big, t < p2 ? U.ramp(t, tbig, 0.6) : 0.25); U.op(c.big2, t < p2 ? U.ramp(t, tbig, 0.6) : 0.25);
      // passage 2: a conclusion planted from outside
      var tp = U.say(2, 'The test can also insert');
      U.fly(c.plant, [[1000, 760], [c.pos.a5[0] - 70, c.pos.a5[1] - 20]], t, tp, 2.2, true);
      if (t < p2) U.op(c.plant, 0);
      U.op(c.plantLab, U.ramp(t, tp + 0.6, 0.6)); U.op(c.repLab, U.ramp(t, U.say(2, 'and the direction of the planted'), 0.6));
    } });

  // =================================================================== 5. the measuring instrument
  NCMA.scene({ id: 'judge-instrument', note: 'Illustrative · verdicts stipulated, biases as reported', source: 'Zheng et al., 2023', desc: 'A question feeds two answers, X shown first and Y shown second, into a judge model, which declares X better. The two answers swap places and the judge declares Y better. The verdict is marked as discarded for failing the swap, the judge is marked as sharing a model family with a system compared, and a person labeled independent human labels is linked to the verdict as the anchor. Then three coders score the same outputs: the primary coder reports a difference between architectures, the two independent coders do not.',
    build: function (svg, U) {
      var c = {};
      c.top = U.g(svg);
      c.q = U.agent(c.top, { x: 150, y: 300, r: 48, role: 'doc', label: 'question', ly: 86 });
      c.slot = [[500, 170], [500, 430]];
      c.X = U.agent(c.top, { x: 500, y: 170, r: 46, role: 'doc', mark: 'X' }); c.Y = U.agent(c.top, { x: 500, y: 430, r: 46, role: 'doc', mark: 'Y' });
      c.s1 = U.text(c.top, 500, 95, 'shown first', 'lab', { 'text-anchor': 'middle' }); c.s2 = U.text(c.top, 500, 520, 'shown second', 'lab', { 'text-anchor': 'middle' });
      [0, 1].forEach(function (i) { U.link(c.top, { x: 150, y: 300, r: 48 }, { x: c.slot[i][0], y: c.slot[i][1], r: 50 }, { arrow: true }); U.link(c.top, { x: c.slot[i][0], y: c.slot[i][1], r: 50 }, { x: 880, y: 300, r: 64 }, { arrow: true }); });
      c.judge = U.agent(c.top, { x: 880, y: 300, r: 60, label: 'judge model', ly: 100 });
      c.fam = T(U, c.top, 880, 450, 'same model family as a system compared', 'lab lab--warm');
      c.lv = U.link(c.top, { x: 880, y: 300, r: 64 }, { x: 1150, y: 300, r: 4 }, { arrow: true });
      c.verdict = T(U, c.top, 1420, 210, 'X is better', 'big'); c.verdict2 = T(U, c.top, 1420, 300, 'Y is better', 'big');
      c.check = T(U, c.top, 1420, 350, '', 'lab lab--alert');
      c.hum = U.agent(c.top, { x: 1420, y: 620, r: 46, role: 'human', label: 'independent human labels', ly: 84 }); U.op(c.hum.g, 0);
      c.lh = U.link(c.top, { x: 1420, y: 620, r: 50 }, { x: 1420, y: 425, r: 4 }, { arrow: true }); U.op(c.lh, 0);
      c.cons = T(U, c.top, 1420, 392, 'consistency, not validity', 'lab lab--warm'); c.val = T(U, c.top, 1440, 520, 'anchor for validity', 'lab lab--hi', 'start');
      // the coders
      c.cod = U.g(svg); U.op(c.cod, 0);
      var outs = [0, 1, 2, 3, 4, 5].map(function (i) { return U.agent(c.cod, { x: 420 + i * 185, y: 140, r: 30, role: 'doc' }); });
      U.text(c.cod, 884, 60, 'outputs of six architectures', 'lab', { 'text-anchor': 'middle' });
      c.coders = [['primary coder', 470, 'architectures differ', 'lab lab--warm'], ['coder 2', 884, 'difference not reproduced', 'lab'], ['coder 3', 1300, 'difference not reproduced', 'lab']].map(function (d) {
        var a = U.agent(c.cod, { x: d[1], y: 430, r: 46, label: d[0], ly: -64 });
        outs.forEach(function (o) { var l = U.link(c.cod, o, a, {}); U.cls(l, 'is-faint', true); });
        var v = T(U, c.cod, d[1], 540, d[2], d[3]); var r = d[0] === 'primary coder' ? null : T(U, c.cod, d[1], 585, 'repeatable', 'lab lab--t2');
        return { a: a, v: v, r: r };
      });
      return c;
    },
    draw: function (c, t, U) {
      var p2 = U.cue(2), sw = U.say(0, 'Swap the order'), p = U.ramp(t, sw, 1.4);
      U.place(c.X.g, 500, lerp(170, 430, p)); U.place(c.Y.g, 500, lerp(430, 170, p));
      U.cls(c.lv, 'is-live', t >= U.say(0, 'Here the judge prefers') && t < U.say(0, 'Here the judge prefers') + 1.5 || t >= sw + 1.4 && t < sw + 3);
      var tv = U.say(0, 'Here the judge prefers');
      U.op(c.verdict, t < tv ? 0 : t < sw + 1.4 ? U.ramp(t, tv, 0.4) : 1 - 0.55 * U.ramp(t, sw + 1.4, 0.6)); U.op(c.verdict2, U.ramp(t, sw + 1.4, 0.5));
      var tb = U.say(1, 'Present every pair in both orders');
      U.setText(c.check, 'verdict changes with order: discard'); U.op(c.check, U.ramp(t, tb + 1, 0.5) * (t < U.say(1, 'is consistency') ? 1 : 0));
      U.op(c.fam, U.ramp(t, U.say(1, 'Use a judge from a different'), 0.5)); U.cls(c.judge.g, 'is-bad', t >= U.say(1, 'Use a judge from a different') && t < p2);
      var ta = U.say(1, 'The anchor for validity');
      U.op(c.hum.g, U.ramp(t, ta, 0.6)); U.op(c.lh, U.ramp(t, ta + 0.4, 0.6)); U.cls(c.lh, 'is-live', t >= ta + 0.4);
      U.op(c.cons, U.ramp(t, U.say(1, 'is consistency'), 0.5)); U.op(c.val, U.ramp(t, ta + 0.8, 0.5));
      U.op(c.top, t < p2 ? 1 : 1 - U.ramp(t, p2, 0.8));
      U.op(c.cod, U.ramp(t, p2 + 0.6, 0.8));
      var tc = U.say(2, 'A difference between architectures'), tn = U.say(2, 'was not reproduced');
      c.coders.forEach(function (k, i) {
        U.op(k.v, U.ramp(t, i === 0 ? tc + 1 : tn + 0.5 + i * 0.3, 0.5));
        if (k.r) U.op(k.r, U.ramp(t, U.say(2, 'although each coder was repeatable'), 0.5));
        U.cls(k.a.g, 'is-on', t >= (i === 0 ? tc : tn) && t < (i === 0 ? tc : tn) + 2.5);
      });
    } });

  // =================================================================== 6. where it was tested
  var ROWS = ['A · snapshot 1', 'model B', 'model C', 'model D', 'model E', 'A · snapshot 2'], NEW = ROWS.length - 1, NC = 5;
  NCMA.scene({ id: 'tested-cells', note: 'Illustrative grid · the reported range is stated, not drawn', source: 'Kim et al., 2025 · van Erven et al., 2025', desc: 'On the left the six agents, labeled with the model they run. On the right a grid of five models by five task families, twenty-five cells; six cells, two models on three task families, fill in as tested. A dashed outline then marks the whole grid as the scope of a general claim, and a line reports a range from plus 80.8 to minus 70.0 percent across tasks. Then the network keeps its shape while its model label changes to snapshot 2: the snapshot 1 row is struck through as retired, and a new row appears with every cell untested.',
    build: function (svg, U) {
      var c = NCMA.six(svg, U, { cx: 240, cy: 360, R: 140, r: 24 });
      c.mod = T(U, svg, 240, 640, '', 'word');
      c.cells = []; c.rl = [];
      for (var j = 0; j < NC; j++) U.text(svg, 790 + j * 130, 100, String(j + 1), 'lab', { 'text-anchor': 'middle' });
      c.th = U.text(svg, 1050, 60, 'task family', 'lab', { 'text-anchor': 'middle' });
      ROWS.forEach(function (name, i) {
        var y = 120 + i * 78, row = [];
        c.rl.push(T(U, svg, 715, y + 41, name, 'lab', 'end'));
        for (var j2 = 0; j2 < NC; j2++) {
          var g = U.g(svg), x = 735 + j2 * 130;
          U.el('rect', { x: x, y: y, width: 110, height: 64, rx: 6, 'class': 'box', 'stroke-dasharray': i === NEW ? '5 6' : null }, g);
          var f = U.el('rect', { x: x + 4, y: y + 4, width: 102, height: 56, rx: 4, 'class': 'bar bar--hi' }, g); U.op(f, 0);
          row.push({ g: g, f: f });
        }
        c.cells.push(row);
      });
      c.strike = U.el('line', { x1: 500, y1: 152, x2: 1400, y2: 152, 'class': 'ln is-bad' }, svg);
      c.ret = T(U, svg, 1420, 160, 'retired', 'lab lab--alert', 'start');
      c.newLab = T(U, svg, 1420, 120 + NEW * 78 + 40, 'untested', 'lab lab--warm', 'start');
      c.claim = U.el('rect', { x: 723, y: 108, width: 664, height: 5 * 78 + 10, rx: 10, 'class': 'zone' }, svg); U.op(c.claim, 0);
      c.claimLab = T(U, svg, 1055, 640, 'a claim about agent networks in general', 'lab lab--warm');
      c.kim = T(U, svg, 1055, 710, 'matched compute: +80.8% on one task, −70.0% on another', 'cap');
      return c;
    },
    draw: function (c, t, U) {
      c.topo('complete', t, 0); Object.keys(c.links).forEach(function (k) { U.op(c.links[k], 0.4); }); c.clues(0.8);
      var p1 = U.cue(1), tm = U.say(1, 'change only the model');
      U.setText(c.mod, t >= tm ? 'model A · snapshot 2' : 'model A · snapshot 1'); U.op(c.mod, 1);
      U.cls(c.mod, 'word--lg', t >= tm && t < tm + 2);
      var tt = U.say(0, 'Here a study runs two models');
      c.rl.forEach(function (e, i) { U.op(e, i < NEW ? U.ramp(t, 0.5, 0.6) : U.ramp(t, tm + 1.2, 0.6)); });
      c.cells.forEach(function (row, i) {
        row.forEach(function (cell, j) {
          U.op(cell.g, i < NEW ? U.ramp(t, 0.5, 0.6) : U.ramp(t, tm + 1.2, 0.6));
          var tested = (i === 0 || i === 1) && j < 3, k = (i === 0 ? 0 : 3) + j;
          U.op(cell.f, tested ? 0.55 * U.ramp(t, tt + 0.6 + k * 0.35, 0.4) * (i === 0 && t >= tm + 0.6 ? 0.3 : 1) : 0);
        });
      });
      var tc = U.say(0, 'A claim about agent networks');
      U.op(c.claim, U.ramp(t, tc, 0.6)); U.op(c.claimLab, U.ramp(t, tc + 0.3, 0.6));
      var hgt = 5 * 78 + 10 + 78 * U.ramp(t, tm + 1.2, 0.8); c.claim.setAttribute('height', hgt.toFixed(1));
      U.op(c.kim, U.ramp(t, U.say(0, 'In one preprint'), 0.6));
      U.op(c.strike, U.ramp(t, tm + 0.6, 0.5)); U.op(c.ret, U.ramp(t, tm + 0.8, 0.5));
      U.op(c.newLab, U.ramp(t, tm + 1.8, 0.5));
    } });

  // =================================================================== 7. repairing code
  NCMA.scene({ id: 'repo-patch', note: REP + ' · the two rates come from different problem sets', source: 'Jimenez et al., 2024 · Yang et al., 2024 · Xia et al., 2025', desc: 'An issue enters a system, which returns a patch to hidden tests inside a dashed boundary marked unseen by the system; the tests return resolved. Inside the system two designs then work in turn: one agent calling navigate, edit and run tests in the order it chooses, resolving 12.5 percent of the full benchmark, and a fixed sequence of locate, repair and validate, resolving 32 percent of a smaller subset. A team of role agents appears between them, and a person is added after the tests as the one who merges.',
    build: function (svg, U) {
      var c = {};
      c.issue = U.agent(svg, { x: 110, y: 400, r: 46, role: 'doc', label: 'issue', ly: 86 });
      c.sys = U.el('rect', { x: 280, y: 90, width: 760, height: 610, rx: 12, 'class': 'zone' }, svg); c.sysLab = U.text(svg, 300, 130, 'the system', 'lab');
      c.zt = U.el('rect', { x: 1150, y: 270, width: 240, height: 260, rx: 12, 'class': 'zone' }, svg); U.text(svg, 1270, 250, 'unseen by the system', 'lab', { 'text-anchor': 'middle' });
      c.tests = U.agent(svg, { x: 1270, y: 390, r: 52, role: 'tool', label: 'hidden tests', ly: 92 });
      c.res = T(U, svg, 1580, 405, '', 'word--lg');
      c.lIn = U.link(svg, { x: 110, y: 400, r: 50 }, { x: 280, y: 400, r: 0 }, { arrow: true });
      c.lOut = U.link(svg, { x: 1040, y: 400, r: 0 }, { x: 1270, y: 390, r: 56 }, { arrow: true });
      c.lRes = U.link(svg, { x: 1270, y: 390, r: 56 }, { x: 1470, y: 395, r: 0 }, { arrow: true });
      // the repository the system works in (passage 0)
      c.repo = U.g(svg); c.files = [];
      for (var fi = 0; fi < 12; fi++) c.files.push(U.agent(c.repo, { x: 480 + (fi % 4) * 120, y: 250 + Math.floor(fi / 4) * 130, r: 30, role: 'doc' }));
      c.repoLab = U.text(c.repo, 660, 620, 'the repository', 'lab', { 'text-anchor': 'middle' });
      c.fixLab = T(U, svg, 720, 455, 'changed', 'lab lab--hi');
      c.tk0 = U.token(svg, 'instruction', { r: 16 }); c.pt0 = U.token(svg, 'evidence', { r: 16 });
      // agent loop
      c.rowA = U.g(svg);
      c.ag = U.agent(c.rowA, { x: 400, y: 260, r: 40, label: 'one agent', ly: -60 });
      c.tools = [['navigate', 620], ['edit', 770], ['run tests', 920]].map(function (d, i) { var a = U.agent(c.rowA, { x: d[1], y: 260, r: 30, role: 'tool', label: d[0], ly: -50 }); a.l = U.link(c.rowA, { x: 400, y: 260, r: 42 }, { x: d[1], y: 260, r: 34 }, { bend: 0.22 + i * 0.05 }); return a; });
      c.tagA = U.text(c.rowA, 660, 400, 'full benchmark: 12.5%', 'lab lab--hi', { 'text-anchor': 'middle' });
      c.tc = U.token(c.rowA, 'instruction', { r: 12 }); c.pA = U.token(svg, 'evidence', { r: 15 });
      // fixed pipeline
      c.rowB = U.g(svg);
      c.boxes = [['locate', 440], ['repair', 650], ['validate', 860]].map(function (d) { U.el('rect', { x: d[1] - 80, y: 545, width: 160, height: 70, rx: 8, 'class': 'box' }, c.rowB); U.text(c.rowB, d[1], 589, d[0], 'cap', { 'text-anchor': 'middle' }); return d[1]; });
      U.link(c.rowB, { x: 520, y: 580, r: 0 }, { x: 570, y: 580, r: 0 }, { arrow: true }); U.link(c.rowB, { x: 730, y: 580, r: 0 }, { x: 780, y: 580, r: 0 }, { arrow: true });
      c.labB = U.text(c.rowB, 650, 528, 'fixed three steps', 'lab', { 'text-anchor': 'middle' });
      c.tagB = U.text(c.rowB, 650, 665, 'smaller subset: 32%', 'lab lab--hi', { 'text-anchor': 'middle' });
      c.tb = U.token(c.rowB, 'instruction', { r: 12 }); c.pB = U.token(svg, 'evidence', { r: 15 });
      // team
      c.team = U.g(svg);
      var tp = [[560, 420], [640, 420], [720, 420], [800, 420]];
      tp.forEach(function (p, i) { tp.forEach(function (q, j) { if (j === i + 1) U.link(c.team, { x: p[0], y: p[1], r: 22 }, { x: q[0], y: q[1], r: 22 }, {}); }); });
      tp.forEach(function (p) { U.agent(c.team, { x: p[0], y: p[1], r: 20 }); });
      U.text(c.team, 680, 462, 'agents in software roles', 'lab lab--hi', { 'text-anchor': 'middle' });
      c.bar = T(U, svg, 660, 750, 'must beat both, on the same tests, at comparable cost', 'lab lab--warm');
      c.merge = U.agent(svg, { x: 1580, y: 620, r: 44, role: 'human', label: 'a person merges', ly: 82 }); c.lm = U.link(svg, { x: 1580, y: 430, r: 0 }, { x: 1580, y: 620, r: 48 }, { arrow: true });
      return c;
    },
    draw: function (c, t, U) {
      var p1 = U.cue(1), p2 = U.cue(2);
      var tf = U.say(0, 'must find the code'), tp = U.say(0, 'A patch counts');
      U.fly(c.tk0, [[160, 400], [330, 400], [680, 380]], t, tf, 1.8, false);
      U.fly(c.pt0, [[795, 380], [1040, 400], [1215, 392]], t, tp, 2, false);
      var tch = U.say(0, 'change it');
      U.op(c.repo, t < p1 ? 1 : 1 - U.ramp(t, p1, 0.6));
      c.files.forEach(function (fl, i) { U.cls(fl.g, 'is-on', i === 6 ? t >= tf + 1.8 && t < p1 : t >= U.say(0, 'leave everything else') && t < U.say(0, 'leave everything else') + 1.6); });
      U.cls(c.files[6].g, 'is-fill', t >= tch && t < p1);
      U.op(c.fixLab, t < p1 ? U.ramp(t, tch, 0.5) : 0);
      if (t >= p1) { U.op(c.tk0, 0); U.op(c.pt0, 0); }
      var r0 = t < p1 ? (t >= tp + 2 ? 'resolved' : '') : '';
      // passage 1: the two designs
      var ta = U.say(1, 'SWE-agent gave one model'), tb = U.say(1, 'It runs a fixed sequence');
      U.op(c.rowA, U.ramp(t, ta - 0.5, 0.6) * (t >= p2 ? 0.35 : 1)); U.op(c.rowB, U.ramp(t, tb - 0.5, 0.6) * (t >= p2 ? 0.35 : 1));
      U.op(c.tagA, U.ramp(t, U.say(1, 'and resolved 12.5 percent'), 0.5) * (t >= p2 ? 1 - U.ramp(t, p2, 0.5) : 1)); U.op(c.tagB, U.ramp(t, U.say(1, 'On a smaller subset'), 0.5));
      var order = [0, 1, 2, 1, 2], kk = Math.floor((t - ta) / 1.3);
      c.tools.forEach(function (tl, i) { U.cls(tl.l, 'is-live', t >= ta && kk < 5 && order[kk] === i); });
      if (t >= ta && kk < 5) { var tl = c.tools[order[kk]], ph = t - ta - kk * 1.3; U.fly(c.tc, [[440, 250], [tl.x - 34, 250]], ph, 0, 0.6, false); } else U.op(c.tc, 0);
      var pa = ta + 6.8; U.fly(c.pA, [[955, 260], [1215, 380]], t, pa, 1.6, false);
      var bk = Math.floor((t - tb) / 1.2);
      if (t >= tb && bk < 3) U.fly(c.tb, [[c.boxes[bk] - 60, 580], [c.boxes[bk] + 60, 580]], t - tb - bk * 1.2, 0, 1, false); else U.op(c.tb, 0);
      var pb = tb + 3.8; U.fly(c.pB, [[940, 580], [1215, 405]], t, pb, 1.6, false);
      if (t >= pa + 1.6 && t < pa + 4) r0 = 'resolved'; if (t >= pb + 1.6 && t < pb + 4) r0 = 'resolved';
      U.cls(c.lOut, 'is-live', r0 !== ''); U.cls(c.lRes, 'is-live', r0 !== '');
      U.setText(c.res, r0); fillc(c.res, MINT); U.op(c.res, r0 ? 1 : 0);
      // passage 2: a team must beat both; a person merges
      U.op(c.team, U.ramp(t, U.say(2, 'Frameworks that organize'), 0.6)); U.op(c.bar, U.ramp(t, U.say(2, 'have to beat both'), 0.6));
      var tmg = U.say(2, 'A patch reaches the code');
      U.op(c.merge.g, U.ramp(t, tmg, 0.6)); U.op(c.lm, U.ramp(t, tmg, 0.6));
      U.op(c.sys, 1); U.op(c.sysLab, t < p1 ? 1 : 0.5);
    } });

  // =================================================================== 8. writing a briefing
  NCMA.scene({ id: 'briefing-review', note: 'Illustrative workflow · last passage: reported engineering figures', source: 'Hadfield et al., 2025', desc: 'The briefing workflow: an orchestrator sends sub-tasks to two researchers, each researcher reads a web page and writes notes into a shared draft, a writer drafts from the notes, and a reviewer checks the draft against the sources before an approver receives it. One page is marked as giving a wrong date. Its claim travels faithfully through the researcher, the draft and the writer, the reviewer marks it as matching its source, and it reaches the approver still carrying the error. Finally the workflow shrinks into a zone labeled lead agent with subagents, and one agent with search and review tools appears beside it; plus 90.2 percent marks the reported gain on an internal evaluation. A warm bar under the workflow grows to about fifteen times the tokens of chat, a warm outline binds the organization and its budget as one bundle, and a dashed bar of the same length appears under the single agent as the same budget.',
    build: function (svg, U) {
      var c = {};
      c.net = U.g(svg);
      c.orc = U.agent(c.net, { x: 160, y: 400, r: 46, role: 'hub', label: 'orchestrator', ly: 90 });
      c.r1 = U.agent(c.net, { x: 430, y: 230, r: 40, label: 'researcher 1', ly: -58 }); c.r2 = U.agent(c.net, { x: 430, y: 570, r: 40, label: 'researcher 2', ly: 76 });
      c.pg1 = U.agent(c.net, { x: 700, y: 110, r: 40, role: 'doc', label: 'web page', lx: 62, ly: 8, anchor: 'start' });
      c.pg2 = U.agent(c.net, { x: 700, y: 690, r: 40, role: 'doc', label: 'web page', lx: 62, ly: 8, anchor: 'start' });
      c.dr = U.agent(c.net, { x: 980, y: 400, r: 50, role: 'doc', label: 'shared draft', ly: 92 });
      c.wr = U.agent(c.net, { x: 980, y: 170, r: 40, label: 'writer', ly: -58 });
      c.rv = U.agent(c.net, { x: 1300, y: 400, r: 44, label: 'reviewer', ly: 80 });
      c.ap = U.agent(c.net, { x: 1610, y: 400, r: 46, role: 'human', label: 'approver', ly: 84 });
      var L = function (a, b, o) { return U.link(c.net, a, b, o || {}); };
      c.L = { o1: L(c.orc, c.r1), o2: L(c.orc, c.r2), p1: L(c.r1, c.pg1), p2: L(c.r2, c.pg2), n1: L(c.r1, c.dr), n2: L(c.r2, c.dr), w: L(c.wr, c.dr), v: L(c.dr, c.rv), a: L(c.rv, c.ap, { arrow: true }), chk: L(c.rv, c.pg1, { cls: 'ln--dash', bend: 0.12 }) };
      U.op(c.L.chk, 0); c.netLabs = Array.prototype.slice.call(c.net.querySelectorAll('text.lab'));
      c.tk = {};
      ['o1', 'o2'].forEach(function (k) { c.tk[k] = U.token(svg, 'instruction', { r: 13 }); });
      ['s1', 's2', 'n1', 'n2', 'w1', 'w2', 'v'].forEach(function (k) { c.tk[k] = U.token(svg, 'evidence', { r: 13 }); });
      c.bad = U.token(svg, 'evidence', { r: 17 }); strokec(c.bad.firstChild, ALERT);
      c.wrong = T(U, svg, 700, 45, 'wrong date', 'lab lab--alert');
      c.match = T(U, svg, 1300, 300, 'matches its source', 'lab lab--hi');
      c.passed = T(U, svg, 1610, 540, 'error, with a source', 'lab lab--alert');
      // passage 2: the organization, shrunk into its own zone, beside one agent with the same tools
      c.zL = U.el('rect', { x: 40, y: 50, width: 860, height: 470, rx: 12, 'class': 'zone' }, svg); U.op(c.zL, 0);
      c.zLl = T(U, svg, 470, 560, 'lead agent with subagents', 'lab lab--t2');
      c.zR = U.el('rect', { x: 1230, y: 50, width: 530, height: 470, rx: 12, 'class': 'zone' }, svg); U.op(c.zR, 0);
      c.zRl = T(U, svg, 1495, 560, 'one agent, same tools', 'lab lab--t2');
      c.one = U.g(svg); U.op(c.one, 0);
      var one = U.agent(c.one, { x: 1400, y: 290, r: 46 }), srch = U.agent(c.one, { x: 1620, y: 200, r: 32, role: 'tool', label: 'search', ly: 62 }), rvw = U.agent(c.one, { x: 1620, y: 390, r: 32, role: 'tool', label: 'review', ly: 62 });
      U.link(c.one, one, srch, {}); U.link(c.one, one, rvw, {});
      c.gain = T(U, svg, 1065, 300, '+90.2%', 'big'); c.gainL = T(U, svg, 1065, 345, 'internal evaluation', 'lab');
      c.bL = U.el('rect', { x: 70, y: 625, width: 0, height: 32, rx: 3, 'class': 'bar bar--warm' }, svg);
      c.bLl = T(U, svg, 70, 700, 'about 15 times the tokens of chat', 'lab lab--warm', 'start');
      c.bR = U.el('rect', { x: 1250, y: 625, width: 510, height: 32, rx: 3, 'class': 'box box--hi', 'stroke-dasharray': '8 6' }, svg); U.op(c.bR, 0);
      c.bRl = T(U, svg, 1250, 700, 'the same budget', 'lab lab--hi', 'start');
      c.bun = U.el('rect', { x: 25, y: 35, width: 890, height: 700, rx: 14, 'class': 'box box--warm', 'stroke-dasharray': '10 8' }, svg); U.op(c.bun, 0);
      c.bunL = T(U, svg, 470, 775, 'organization and budget, bundled', 'lab lab--warm');
      return c;
    },
    draw: function (c, t, U) {
      var p1 = U.cue(1), p2 = U.cue(2), P = function (a) { return [a.x, a.y]; };
      var to = U.say(0, 'An orchestrator divides'), ts = U.say(0, 'search and read'), tn = U.say(0, 'write notes with source links'), tw = U.say(0, 'a writer drafts'), tv = U.say(0, 'a reviewer checks');
      var F = function (k, a, b, t0, hold) { var s = U.seg(P(a), P(b), a.r + 8, b.r + 8); U.fly(c.tk[k], s, t, t0, 1.4, hold); };
      if (t < p1) {
        F('o1', c.orc, c.r1, to); F('o2', c.orc, c.r2, to + 0.1);
        F('s1', c.pg1, c.r1, ts + 0.6); F('s2', c.pg2, c.r2, ts + 0.7);
        F('n1', c.r1, c.dr, tn); F('n2', c.r2, c.dr, tn + 0.1);
        F('w1', c.dr, c.wr, tw); F('w2', c.wr, c.dr, tw + 1.6);
        F('v', c.dr, c.rv, tv);
      } else Object.keys(c.tk).forEach(function (k) { U.op(c.tk[k], 0); });
      var live = function (k, a, b) { U.cls(c.L[k], 'is-live', t >= a && t < b); };
      live('o1', to, to + 1.5); live('o2', to, to + 1.5); live('p1', ts, ts + 2.2); live('p2', ts, ts + 2.2); live('n1', tn, tn + 1.5); live('n2', tn, tn + 1.5); live('w', tw, tw + 3.2); live('v', tv, tv + 1.5);
      // passage 1: an error in a source passes every check
      var tb = U.say(1, 'One retrieved page gives'), tc = U.say(1, 'The researcher copies'), twc = U.say(1, 'the writer cites it'), trc = U.say(1, 'the reviewer confirms'), ta = U.say(1, 'the error reaches the approver');
      U.cls(c.pg1.g, 'is-bad', t >= tb); U.op(c.wrong, U.ramp(t, tb, 0.5));
      var path = null;
      if (t >= tc && t < twc) path = [[[700, 150], [440, 272]], tc];
      if (t >= twc && t < trc) path = [[[430, 272], [930, 400], [980, 220], [980, 360]], twc];
      if (t >= trc && t < ta) path = [[[1030, 400], [1250, 400]], trc];
      if (t >= ta) path = [[[1250, 400], [1560, 400]], ta];
      if (path) U.fly(c.bad, path[0], t, path[1], path === null ? 1 : 1.6, true); else U.op(c.bad, 0);
      U.op(c.L.chk, t >= trc && t < p2 ? U.ramp(t, trc + 0.8, 0.5) : 0); U.cls(c.L.chk, 'is-live', t >= trc + 0.8 && t < p2);
      U.op(c.match, U.ramp(t, trc + 1.4, 0.5) * (t < p2 ? 1 : 0.4));
      U.op(c.passed, U.ramp(t, ta + 1.8, 0.5));
      U.cls(c.L.a, 'is-live', t >= ta && t < ta + 1.8);
      // passage 2: the organization against one agent, and the budget that came with it
      var s = U.ramp(t, p2, 1.2), gone = t >= p2 ? 1 - U.ramp(t, p2, 0.5) : 1;
      U.place(c.net, 30 * s, 75 * s, 1 - 0.5 * s);
      c.netLabs.forEach(function (e) { U.op(e, gone); });
      [c.wrong, c.match, c.passed].forEach(function (e) { U.op(e, Math.min(Number(e.style.opacity || 1), gone)); });
      if (t >= p2) { U.op(c.bad, 0); U.op(c.L.chk, 0); U.cls(c.pg1.g, 'is-bad', false); }
      var tg = U.say(2, 'outperformed a single agent'), tk = U.say(2, 'fifteen times as many tokens'), tbn = U.say(2, 'The comparison bundles'), tsb = U.say(2, 'given the same budget');
      U.op(c.zL, U.ramp(t, p2 + 0.8, 0.6)); U.op(c.zLl, U.ramp(t, p2 + 0.8, 0.6));
      U.op(c.one, U.ramp(t, tg, 0.6)); U.op(c.zR, U.ramp(t, tg, 0.6)); U.op(c.zRl, U.ramp(t, tg, 0.6));
      U.op(c.gain, U.ramp(t, tg + 0.8, 0.5)); U.op(c.gainL, U.ramp(t, tg + 0.8, 0.5));
      c.bL.setAttribute('width', (510 * U.ramp(t, tk, 1.4)).toFixed(1)); U.op(c.bL, t >= tk ? 1 : 0); U.op(c.bLl, U.ramp(t, tk + 0.6, 0.5));
      U.op(c.bun, U.ramp(t, tbn, 0.6)); U.op(c.bunL, U.ramp(t, tbn + 0.3, 0.6));
      U.op(c.bR, U.ramp(t, tsb, 0.6)); U.op(c.bRl, U.ramp(t, tsb + 0.3, 0.6));
    } });

  // =================================================================== 9. laboratories and robots
  NCMA.scene({ id: 'checked-outside', note: REP + ' · design proposals drawn as hedged rings', source: 'Swanson et al., 2025 · Mandi et al., 2024', desc: 'Top: a principal-investigator agent meets with three scientist agents, with a person giving feedback. Their designs, drawn as uncertain rings, flow to a wet-lab test, and two emerge as solid rings with improved binding. Bottom: two robot-arm agents talk, write a plan of subtasks and waypoints, and send it to a collision check, which first fails and returns the plan to an arm; the revised plan passes to a motion planner and the arms move. At the end the two checks are highlighted and the conversations dimmed.',
    build: function (svg, U) {
      var c = {};
      U.el('line', { x1: 0, y1: 400, x2: 1768, y2: 400, 'class': 'rule' }, svg);
      c.talkA = U.g(svg); c.talkB = U.g(svg);
      c.hu = U.agent(c.talkA, { x: 110, y: 200, r: 36, role: 'human', label: 'human feedback', ly: 70 });
      c.pi = U.agent(c.talkA, { x: 330, y: 200, r: 44, role: 'hub', label: 'PI agent', ly: 82 });
      c.sc = [[540, 105], [580, 200], [540, 295]].map(function (p) { return U.agent(c.talkA, { x: p[0], y: p[1], r: 26 }); });
      c.scLab = U.text(c.talkA, 560, 368, 'scientist agents', 'lab', { 'text-anchor': 'middle' });
      U.link(c.talkA, c.hu, c.pi, {}); c.sc.forEach(function (s) { U.link(c.talkA, c.pi, s, {}); });
      c.lab = U.agent(svg, { x: 1090, y: 200, r: 52, role: 'tool', label: 'wet-lab test', ly: 90 });
      c.nDes = T(U, svg, 850, 120, '92 designs', 'lab');
      c.des = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(function () { return U.token(svg, 'hedged', { r: 12 }); });
      c.win = [0, 1].map(function () { return U.token(svg, 'evidence', { r: 16 }); });
      c.winLab = T(U, svg, 1420, 290, '2 with improved binding', 'lab lab--hi');
      // robotics
      c.a1 = U.agent(c.talkB, { x: 170, y: 520, r: 36, label: 'arm 1', lx: -56, ly: 8, anchor: 'end' });
      c.a2 = U.agent(c.talkB, { x: 170, y: 710, r: 36, label: 'arm 2', lx: -56, ly: 8, anchor: 'end' });
      c.dl = U.link(c.talkB, c.a1, c.a2, {}); U.text(c.talkB, 200, 622, 'dialog', 'lab', { 'text-anchor': 'start' });
      c.plan = U.agent(svg, { x: 500, y: 615, r: 42, role: 'doc', label: 'plan', ly: 82 });
      c.chk = U.agent(svg, { x: 830, y: 615, r: 46, role: 'tool', label: 'collision check', ly: 84 });
      c.mp = U.agent(svg, { x: 1160, y: 615, r: 46, role: 'tool', label: 'motion planner', ly: 84 });
      c.ex = U.agent(svg, { x: 1490, y: 615, r: 46, role: 'tool', label: 'arms move', ly: 84 });
      c.lp1 = U.link(svg, c.a1, c.plan, {}); c.lp2 = U.link(svg, c.a2, c.plan, {}); c.lc = U.link(svg, c.plan, c.chk, { arrow: true }); c.lm = U.link(svg, c.chk, c.mp, { arrow: true }); c.le = U.link(svg, c.mp, c.ex, { arrow: true });
      c.back = U.el('path', { d: 'M800,575 Q520,440 206,505', 'class': 'ln is-bad', 'marker-end': 'url(#arrow)' }, svg);
      c.fail = T(U, svg, 830, 520, 'collision: back to the arms', 'lab lab--alert');
      c.dtk = [0, 1].map(function () { return U.token(svg, 'evidence', { r: 11 }); });
      c.ptk = U.token(svg, 'instruction', { r: 14 }); c.ptk2 = U.token(svg, 'instruction', { r: 14 }); c.btk = U.token(svg, 'injected', { r: 13 });
      c.dec = [T(U, svg, 1090, 330, 'decides', 'lab lab--hi'), T(U, svg, 830, 745, 'decides', 'lab lab--hi')];
      return c;
    },
    draw: function (c, t, U) {
      var p1 = U.cue(1), p2 = U.cue(2);
      // virtual lab
      var tm = U.say(0, 'through a series of research meetings');
      c.sc.forEach(function (s, i) { U.cls(s.g, 'is-on', t >= tm && Math.floor((t - tm) / 0.8) % 3 === i && t < tm + 6); });
      var td = U.say(0, 'designed 92 nanobodies'), tl = U.say(0, 'When the designs were made');
      U.op(c.nDes, U.ramp(t, td, 0.5));
      c.des.forEach(function (k, i) { U.fly(k, [[640, 200], [850, 160 + (i % 5) * 20], [1030, 200]], t, td + 0.3 + i * 0.25, 1.8, false); });
      c.win.forEach(function (k, i) { U.fly(k, [[1150, 200], [1380 + i * 60, 200]], t, tl + 1.5 + i * 0.4, 1.2, true); });
      U.op(c.winLab, U.ramp(t, U.say(0, 'two showed improved binding'), 0.5));
      U.cls(c.lab.g, 'is-on', t >= tl && t < tl + 3 || t >= p2);
      // robotics
      var tdl = U.say(1, 'The agents discuss'), tpr = U.say(1, 'propose subtasks'), tf = U.say(1, 'When a collision check fails'), trv = U.say(1, 'they revise the plan'), tok = U.say(1, 'The system achieved');
      c.dtk.forEach(function (k, i) { var ph = Math.max(0, t - tdl) % 2.4; if (t >= tdl && t < tpr) U.fly(k, i ? [[170, 670], [170, 560]] : [[170, 560], [170, 670]], ph, i * 1.2, 1, false); else U.op(k, 0); });
      U.cls(c.dl, 'is-live', t >= tdl && t < tpr);
      U.fly(c.ptk, [[206, 540], [458, 615], [784, 615]], t, tpr, 2.4, false);
      if (t >= tf + 0.2 && t < trv + 1.5) { U.op(c.back, U.ramp(t, tf + 0.2, 0.4)); U.op(c.fail, U.ramp(t, tf + 0.2, 0.4)); } else { U.op(c.back, 0); U.op(c.fail, 0); }
      U.fly(c.btk, [[800, 575], [500, 470], [206, 505]], t, tf + 0.4, 1.8, false);
      U.cls(c.chk.g, 'is-bad', t >= tf && t < trv);
      U.fly(c.ptk2, [[206, 540], [458, 615], [784, 615], [876, 615], [1114, 615], [1206, 615], [1444, 615]], t, trv + 0.6, 4, false);
      U.cls(c.chk.g, 'is-on', t >= trv + 1.6 && t < tok + 1 || t >= p2); U.cls(c.ex.g, 'is-on', t >= trv + 4.6 && t < p2);
      U.cls(c.lm, 'is-live', t >= trv + 2 && t < trv + 3.4); U.cls(c.le, 'is-live', t >= trv + 3.4 && t < trv + 4.6);
      // passage 2
      U.em(c.talkA, t >= p2 ? 1 : 2); U.em(c.talkB, t >= p2 ? 1 : 2);
      c.dec.forEach(function (e, i) { U.op(e, U.ramp(t, U.say(2, i ? 'a collision check' : 'a laboratory test of binding'), 0.5)); });
    } });

  // =================================================================== 10. attack and defense
  var LX = function (min) { return 150 + Math.log10(min) / 3.3 * 1500; };
  NCMA.scene({ id: 'hijack-retry', note: REP, source: 'Zhang et al., 2025 · NIST CAISI, 2025', desc: 'First an agent works a terminal against a target and recovers a flag, and a time axis of how long the first human team needed shows models solving complete tasks only up to 11 minutes, with the hardest task at about 25 hours. Then a web page carrying a hidden instruction steers an agent to a tool. Bars report attack success for one model: 11 percent for the strongest existing attack against 81 percent for attacks built for the model, and 57 percent for one attempt against 80 percent with repeated attempts.',
    build: function (svg, U) {
      var c = {};
      c.ctf = U.g(svg);
      c.ag = U.agent(c.ctf, { x: 220, y: 180, r: 40, label: 'agent', ly: -58 });
      c.tm = U.agent(c.ctf, { x: 560, y: 180, r: 50, role: 'tool', label: 'terminal · target', ly: 88 });
      c.lt = U.link(c.ctf, c.ag, c.tm, {}); c.lf = U.link(c.ctf, c.tm, { x: 880, y: 180, r: 20 }, { arrow: true });
      c.flag = U.token(c.ctf, 'evidence', { r: 18 }); c.ping = U.token(c.ctf, 'instruction', { r: 12 });
      c.flagLab = T(U, c.ctf, 900, 250, 'flag matches', 'lab lab--hi');
      c.axis = U.g(c.ctf);
      U.el('line', { x1: LX(1), y1: 470, x2: LX(1800), y2: 470, 'class': 'rule' }, c.axis);
      c.band = U.el('rect', { x: LX(1), y: 446, width: LX(11) - LX(1), height: 48, 'class': 'bar bar--hi' }, c.axis);
      [[1, '1 min'], [11, '11 min'], [60, '1 h'], [1500, '25 h']].forEach(function (d) { U.el('line', { x1: LX(d[0]), y1: 458, x2: LX(d[0]), y2: 482, 'class': 'rule' }, c.axis); U.text(c.axis, LX(d[0]), 530, d[1], 'lab', { 'text-anchor': 'middle' }); });
      c.hard = U.el('circle', { cx: LX(1500), cy: 470, r: 10, 'class': 'nd' }, c.axis);
      U.text(c.axis, 900, 595, 'time the first human team needed', 'lab lab--t2', { 'text-anchor': 'middle' });
      c.solved = T(U, c.ctf, (LX(1) + LX(11)) / 2 + 60, 420, 'models solved complete tasks only here', 'lab lab--hi');
      c.hardLab = T(U, c.ctf, LX(1500), 420, 'hardest task', 'lab');
      // hijacking
      c.hj = U.g(svg); U.op(c.hj, 0);
      c.pg = U.agent(c.hj, { x: 150, y: 230, r: 44, role: 'doc', label: 'web page or email', ly: 82 });
      c.ag2 = U.agent(c.hj, { x: 450, y: 230, r: 42, label: 'agent', ly: 80 });
      c.tool = U.agent(c.hj, { x: 750, y: 230, r: 46, role: 'tool', label: 'tool', ly: 84 });
      c.l1 = U.link(c.hj, c.pg, c.ag2, { arrow: true }); c.l2 = U.link(c.hj, c.ag2, c.tool, { arrow: true });
      c.inj = U.token(c.hj, 'injected', { r: 16 });
      c.unasked = T(U, c.hj, 750, 360, 'an action the user did not ask for', 'lab lab--alert');
      c.scope = T(U, c.hj, 450, 470, 'one model · AgentDojo environments', 'lab lab--t2');
      c.bars = [[1060, 11, 'suite'], [1190, 81, 'adapted'], [1440, 57, 'one try'], [1570, 80, 'repeated']].map(function (d) {
        var r = U.el('rect', { x: d[0] - 50, y: 640, width: 100, height: 0, 'class': d[1] > 60 ? 'bar bar--alert' : 'bar' }, c.hj);
        var v = T(U, c.hj, d[0], 630, d[1] + '%', 'word--lg'); var l = U.text(c.hj, d[0], 678, d[2], 'lab', { 'text-anchor': 'middle' }); U.op(l, 0);
        return { r: r, v: v, l: l, val: d[1] };
      });
      c.base = U.el('line', { x1: 990, y1: 640, x2: 1650, y2: 640, 'class': 'rule' }, c.hj);
      c.g1 = T(U, c.hj, 1125, 728, 'adapting the attack', 'lab lab--t2'); c.g2 = T(U, c.hj, 1505, 728, 'allowing retries', 'lab lab--t2');
      c.bound = T(U, c.hj, 1310, 170, 'fixed suite, one attempt: a lower bound', 'lab lab--warm');
      return c;
    },
    draw: function (c, t, U) {
      var p1 = U.cue(1), p2 = U.cue(2);
      U.op(c.ctf, t < p1 ? 1 : 1 - U.ramp(t, p1, 0.8)); U.op(c.hj, U.ramp(t, p1 + 0.5, 0.8));
      var tw = U.say(0, 'an agent works through a terminal'), tr = U.say(0, 'succeeds when it recovers');
      var ph = Math.max(0, t - tw) % 2; if (t >= tw && t < tr) U.fly(c.ping, [[262, 180], [508, 180]], ph, 0, 0.9, false); else U.op(c.ping, 0);
      U.cls(c.lt, 'is-live', t >= tw && t < tr);
      U.fly(c.flag, [[612, 180], [880, 180]], t, tr, 1.4, true); U.op(c.flagLab, U.ramp(t, tr + 1.4, 0.5)); U.cls(c.lf, 'is-live', t >= tr && t < tr + 1.6);
      var ts = U.say(0, 'Several models solved');
      U.op(c.axis, U.ramp(t, ts - 0.5, 0.6)); U.op(c.band, U.ramp(t, ts + 0.6, 0.6) * 0.45); U.op(c.solved, U.ramp(t, ts + 1, 0.6));
      U.op(c.hardLab, U.ramp(t, U.say(0, 'The hardest'), 0.6));
      // hijacking
      var th = U.say(1, 'steers it toward');
      U.fly(c.inj, [[194, 230], [408, 230], [450, 230], [704, 230]], t, th, 2.6, true); if (t < p1) U.op(c.inj, 0);
      U.cls(c.l1, 'is-bad', t >= th && t < th + 1.4); U.cls(c.l2, 'is-bad', t >= th + 1.4);
      U.cls(c.tool.g, 'is-bad', t >= th + 2.6); U.op(c.unasked, U.ramp(t, th + 2.6, 0.5));
      U.op(c.scope, U.ramp(t, U.say(1, 'tested agents built on one model'), 0.6));
      var tb = [U.say(1, 'The strongest attack in the existing'), U.say(1, 'Attacks the team developed'), U.say(2, 'letting the attacker try'), U.say(2, 'letting the attacker try') + 1.4];
      c.bars.forEach(function (b, i) { var h = b.val * 4.8 * U.ramp(t, tb[i], 1); b.r.setAttribute('y', (640 - h).toFixed(1)); b.r.setAttribute('height', h.toFixed(1)); b.v.setAttribute('y', (628 - h).toFixed(1)); U.op(b.v, U.ramp(t, tb[i] + 0.7, 0.4)); U.op(b.l, U.ramp(t, tb[i], 0.4)); });
      U.op(c.g1, U.ramp(t, tb[0], 0.5)); U.op(c.g2, U.ramp(t, tb[2], 0.5)); U.op(c.base, U.ramp(t, tb[0], 0.5));
      U.op(c.bound, U.ramp(t, U.say(2, 'A single-attempt rate'), 0.6)); U.cls(c.bars[0].r, 'bar--warm', t >= U.say(2, 'A single-attempt rate'));
    } });

  // =================================================================== 11. stand-ins and answer keys
  NCMA.scene({ id: 'scored-against', note: REP, source: 'Park et al., 2024 · Kim et al., 2024', desc: 'Left: a person, an interview transcript and an agent built from it. Two bars compare how well agents reproduced their person’s survey answers, as a share of the person’s own two-week consistency: 83 percent for interview agents, 74 percent for demographic agents, against a dashed line for the person. Right: a medical case goes to a moderator that sends it to a single agent or a group, whose answer is checked against an answer key; best on 7 of 10 benchmarks. A dashed box for patient outcomes sits unconnected, marked not measured.',
    build: function (svg, U) {
      var c = {};
      U.el('line', { x1: 880, y1: 40, x2: 880, y2: 760, 'class': 'rule' }, svg);
      c.L = U.g(svg);
      c.per = U.agent(c.L, { x: 130, y: 190, r: 44, role: 'human', label: 'person', ly: 82 });
      c.iv = U.agent(c.L, { x: 380, y: 190, r: 42, role: 'doc', label: 'interview', ly: 82 });
      c.ag = U.agent(c.L, { x: 630, y: 190, r: 42, label: 'agent', ly: 82 });
      c.l1 = U.link(c.L, c.per, c.iv, { arrow: true }); c.l2 = U.link(c.L, c.iv, c.ag, { arrow: true });
      c.bars = [['agent built from the interview', 83, 'bar--hi', 470], ['agent given demographics only', 74, '', 590]].map(function (d) {
        var lab = T(U, c.L, 60, d[3] - 22, d[0], 'lab lab--t2', 'start');
        var r = U.el('rect', { x: 60, y: d[3], width: 0, height: 34, 'class': 'bar ' + d[2] }, c.L);
        var v = T(U, c.L, 0, d[3] + 28, d[1] + '%', 'word', 'start');
        return { lab: lab, r: r, v: v, val: d[1] };
      });
      c.ref = U.el('line', { x1: 660, y1: 420, x2: 660, y2: 650, 'class': 'rule', 'stroke-dasharray': '6 6' }, c.L); U.op(c.ref, 0);
      c.refLab = T(U, c.L, 660, 700, 'the person, two weeks later', 'lab');
      c.R = U.g(svg);
      c.cs = U.agent(c.R, { x: 970, y: 250, r: 42, role: 'doc', label: 'case', ly: 80 });
      c.md = U.agent(c.R, { x: 1180, y: 250, r: 42, role: 'hub', label: 'moderator', ly: 86 });
      c.solo = U.agent(c.R, { x: 1410, y: 130, r: 34, label: 'one agent', ly: -50 });
      c.grp = [[1370, 350], [1450, 350], [1410, 410]].map(function (p) { return U.agent(c.R, { x: p[0], y: p[1], r: 22 }); });
      c.grpLab = U.text(c.R, 1500, 425, 'group', 'lab', { 'text-anchor': 'start' });
      c.key = U.agent(c.R, { x: 1650, y: 250, r: 44, role: 'tool', label: 'answer key', ly: 82 });
      [c.solo, { x: 1410, y: 370, r: 60 }].forEach(function (a) { U.link(c.R, c.md, a, {}); U.link(c.R, a, c.key, { arrow: true }); });
      U.link(c.R, c.cs, c.md, { arrow: true });
      c.t1 = U.token(c.R, 'instruction', { r: 14 }); c.t2 = U.token(c.R, 'instruction', { r: 14 }); c.t3 = U.token(c.R, 'conclusion', { r: 14 });
      c.best = T(U, c.R, 1310, 530, 'best on 7 of 10 benchmarks', 'lab lab--hi');
      c.ghost = U.el('rect', { x: 1150, y: 590, width: 400, height: 80, rx: 10, 'class': 'zone' }, c.R); U.op(c.ghost, 0);
      c.ghostT = T(U, c.R, 1350, 640, 'patient outcomes', 'cap'); c.ghostN = T(U, c.R, 1350, 720, 'not measured', 'lab lab--warm');
      return c;
    },
    draw: function (c, t, U) {
      var p1 = U.cue(1);
      var tb = U.say(0, 'built an agent from each');
      U.cls(c.l1, 'is-live', t >= tb && t < tb + 1.2); U.cls(c.l2, 'is-live', t >= tb + 1.2 && t < tb + 2.4);
      var tr = [U.say(0, 'with 83 percent'), U.say(0, 'against 74 percent')];
      c.bars.forEach(function (b, i) { var w = b.val * 6 * U.ramp(t, tr[i], 1); b.r.setAttribute('width', w.toFixed(1)); b.v.setAttribute('x', (72 + w).toFixed(1)); U.op(b.v, U.ramp(t, tr[i] + 0.8, 0.4)); U.op(b.lab, U.ramp(t, tr[i] - 0.4, 0.4)); });
      U.op(c.ref, U.ramp(t, tr[0] - 1, 0.5)); U.op(c.refLab, U.ramp(t, tr[0] - 1, 0.5));
      U.em(c.L, t >= p1 ? 1 : 2);
      U.op(c.R, t < p1 ? 0.3 : U.ramp(t, p1, 0.6) * 0.7 + 0.3);
      var tj = U.say(1, 'MDAgents first judges'), ts = U.say(1, 'then sends it'), ta = U.say(1, 'It achieved the best');
      U.fly(c.t1, [[1014, 250], [1136, 250]], t, tj, 1.2, false);
      U.fly(c.t2, [[1222, 240], [1376, 140]], t, ts, 1.2, false); U.fly(c.t3, [[1222, 262], [1380, 360]], t, ts + 0.4, 1.2, false);
      if (t < p1) { U.op(c.t1, 0); U.op(c.t2, 0); U.op(c.t3, 0); }
      U.cls(c.key.g, 'is-on', t >= ta); U.op(c.best, U.ramp(t, ta, 0.5));
      var tp = U.say(1, 'Patient outcomes');
      U.op(c.ghost, U.ramp(t, tp, 0.6)); U.op(c.ghostT, U.ramp(t, tp, 0.6) * 0.7); U.op(c.ghostN, U.ramp(t, tp + 0.5, 0.6));
    } });

  // =================================================================== 12. authority
  NCMA.scene({ id: 'delegated-authority', note: 'Illustrative workflow · last passage: reported case studies', source: 'South et al., 2025 · Shapira et al., 2026', desc: 'A delegation chain from the owner to the orchestrator, the writer and the draft, with each link labeled by its narrowing scope: one briefing, send to owner only; draft only, no send; section 2 only. An unknown sender then claims to be the owner and asks for the draft to be sent elsewhere; at the orchestrator the link turns red, is cut, and a note reads no owner credential, refused and logged. In a replay without the check, the same message passes and the orchestrator sends the draft out.',
    build: function (svg, U) {
      var c = {};
      c.own = U.agent(svg, { x: 170, y: 290, r: 46, role: 'human', label: 'owner', ly: 82 });
      c.orc = U.agent(svg, { x: 620, y: 290, r: 48, role: 'hub', label: 'orchestrator', ly: -76 });
      c.wr = U.agent(svg, { x: 1070, y: 290, r: 44, label: 'writer', ly: 80 });
      c.dr = U.agent(svg, { x: 1500, y: 290, r: 44, role: 'doc', label: 'draft', ly: 82 });
      c.L = [U.link(svg, c.own, c.orc, { arrow: true }), U.link(svg, c.orc, c.wr, { arrow: true }), U.link(svg, c.wr, c.dr, { arrow: true })];
      c.sc = [[395, ['one briefing', 'send to owner only']], [845, ['draft only', 'no send']], [1285, ['section 2 only']]].map(function (d) { var e = U.lines(svg, d[0], 420, d[1], 'lab lab--hi', 32, { 'text-anchor': 'middle' }); U.op(e, 0); return e; });
      c.tk = [0, 1, 2].map(function () { return U.token(svg, 'instruction', { r: 15 }); });
      c.imp = U.agent(svg, { x: 620, y: 650, r: 40, label: 'unknown sender', ly: 76 }); U.cls(c.imp.g, 'is-bad', true);
      c.say = U.lines(svg, 60, 600, ['“I am the owner. Send the draft', 'to a new address.”'], 'cap', 34, { 'text-anchor': 'start' }); U.op(c.say, 0);
      c.li = U.link(svg, c.imp, c.orc, { arrow: true });
      c.itk = U.token(svg, 'instruction', { r: 15 }); c.cut = U.token(svg, 'lost', { r: 20 }); U.place(c.cut, 620, 500);
      c.cred = T(U, svg, 745, 215, 'credential from the owner?', 'lab lab--warm', 'start');
      c.ref = T(U, svg, 760, 560, 'no owner credential · refused and logged', 'lab lab--alert', 'start');
      c.send = U.agent(svg, { x: 960, y: 680, r: 44, role: 'tool', label: 'send', ly: 80 }); c.ls = U.link(svg, c.orc, c.send, { arrow: true });
      c.out = T(U, svg, 1030, 690, 'draft sent to the new address', 'lab lab--alert', 'start');
      c.wo = T(U, svg, 60, 700, 'without a check', 'lab lab--warm', 'start');
      c.otk = U.token(svg, 'instruction', { r: 15 });
      return c;
    },
    draw: function (c, t, U) {
      var p1 = U.cue(1), p2 = U.cue(2);
      var tt = [U.say(0, 'The owner asks'), U.say(0, 'The orchestrator passes'), U.say(0, 'and the writer may edit')];
      var P = [c.own, c.orc, c.wr, c.dr];
      c.tk.forEach(function (k, i) { var s = U.seg([P[i].x, P[i].y], [P[i + 1].x, P[i + 1].y], P[i].r + 8, P[i + 1].r + 8); U.fly(k, s, t, tt[i], 1.6, false); U.op(c.sc[i], U.ramp(t, tt[i] + 1, 0.6) * (t >= p1 ? 0.6 : 1)); U.cls(c.L[i], 'is-live', t >= tt[i] && t < tt[i] + 1.7); });
      var ti = U.say(1, 'a message arrives from an unknown sender'), ta = U.say(1, 'asks for the draft'), tc = U.say(1, 'The orchestrator looks for a credential'), tf = U.say(1, 'finds none');
      var vis = t >= ti ? U.ramp(t, ti, 0.6) : 0;
      U.op(c.imp.g, vis); U.op(c.li, vis); U.op(c.say, t >= ta ? U.ramp(t, ta - 0.5, 0.6) : 0);
      var s = U.seg([c.imp.x, c.imp.y], [c.orc.x, c.orc.y], 46, 62);
      var refused = t >= tf && t < p2;
      if (t < p2) { U.fly(c.itk, s, t, ta + 0.5, 2, true); } else U.op(c.itk, 0);
      U.op(c.cred, t >= tc && t < p2 ? U.ramp(t, tc, 0.5) : 0);
      U.cls(c.li, 'is-bad', refused); U.op(c.cut, refused ? U.ramp(t, tf, 0.4) : 0); U.op(c.ref, refused ? U.ramp(t, tf + 0.3, 0.5) : 0);
      if (refused) U.op(c.itk, 1 - U.ramp(t, tf, 0.5));
      // passage 2: replay without the check
      var tw = U.say(2, 'Without such a check');
      U.op(c.wo, U.ramp(t, tw, 0.5));
      var s2 = U.seg([c.imp.x, c.imp.y], [c.orc.x, c.orc.y], 46, 52), s3 = U.seg([c.orc.x, c.orc.y], [c.send.x, c.send.y], 52, 48);
      U.fly(c.otk, s2.concat(s3), t, tw + 0.6, 3.2, true); if (t < p2) U.op(c.otk, 0);
      U.op(c.send.g, t >= p2 ? U.ramp(t, tw, 0.5) : 0); U.op(c.ls, t >= p2 ? U.ramp(t, tw, 0.5) : 0);
      U.cls(c.ls, 'is-bad', t >= tw + 2.2); U.cls(c.send.g, 'is-bad', t >= tw + 3.8); U.op(c.out, U.ramp(t, tw + 3.8, 0.5));
      U.cls(c.li, 'is-live', t >= tw + 0.6 && t < tw + 2.2);
    } });

  // =================================================================== 13. boundaries
  NCMA.scene({ id: 'what-may-cross', note: 'Illustrative system · reported evaluation in the second passage', source: 'Motwani et al., 2024', desc: 'The organization sits in the middle, the public web on its left, a model provider in a strip above it and recipients on its right. Inside, a researcher reads a web page, an analyst reads an internal record, both pass notes to a writer, the writer produces a draft and an approval step releases it to readers. Three crossings light in turn: a page entering from the web, notes rising to the provider in model calls from the researcher, the analyst and the writer, and the draft leaving through approval. A message carrying hidden content then passes a monitor on the link from the analyst to the writer, while an attempt by the analyst to send outside stops at the boundary for lack of a tool. Finally every channel reachable from the internal record lights up: the record leaves through approval and in the model calls of the analyst and the writer.',
    build: function (svg, U) {
      var c = {};
      [[330, 160, 930, 620, 'organization', 352, 760], [20, 160, 290, 260, 'public web', 42, 196], [330, 20, 930, 110, 'model provider', 352, 56], [1300, 400, 448, 300, 'recipients', 1322, 436]].forEach(function (z) { U.el('rect', { x: z[0], y: z[1], width: z[2], height: z[3], rx: 12, 'class': 'zone' }, svg); U.text(svg, z[5], z[6], z[4], 'lab'); });
      c.pg = U.agent(svg, { x: 165, y: 260, r: 38, role: 'doc' });
      c.rs = U.agent(svg, { x: 450, y: 250, r: 40, label: 'researcher', lx: -30, ly: -50, anchor: 'end' });
      c.an = U.agent(svg, { x: 770, y: 250, r: 40, label: 'analyst', lx: 30, ly: -50, anchor: 'start' });
      c.rec = U.agent(svg, { x: 1030, y: 400, r: 44, role: 'doc', label: 'internal record', ly: 84 });
      c.wr = U.agent(svg, { x: 630, y: 520, r: 40, label: 'writer', ly: 76 });
      c.dr = U.agent(svg, { x: 860, y: 600, r: 40, role: 'doc', label: 'draft', ly: 78 });
      c.ap = U.agent(svg, { x: 1100, y: 600, r: 36, role: 'human', label: 'approval', ly: 70 });
      c.rd = U.agent(svg, { x: 1520, y: 600, r: 38, role: 'human', label: 'readers', ly: 70 });
      var L = function (a, b, o) { return U.link(svg, a, b, o || {}); }, up = function (a) { return { x: a.x, y: 130, r: 0 }; };
      c.L = { pr: L(c.pg, c.rs, { arrow: true }), rw: L(c.rs, c.wr, { arrow: true }), aw: L(c.an, c.wr, { arrow: true }), ra: L(c.rec, c.an, { arrow: true }), wd: L(c.wr, c.dr, { arrow: true }), da: L(c.dr, c.ap, { arrow: true }), ar: L(c.ap, c.rd, { arrow: true }),
        m1: L(c.rs, up(c.rs), { cls: 'ln--dash', arrow: true }), m2: L(c.an, up(c.an), { cls: 'ln--dash', arrow: true }), m3: L(c.wr, up(c.wr), { cls: 'ln--dash', arrow: true }) };
      c.tk = {}; ['pr', 'm1', 'm2', 'm3', 'da', 'ar', 'hid', 'try'].forEach(function (k) { c.tk[k] = U.token(svg, k === 'pr' ? 'injected' : k === 'try' ? 'instruction' : 'evidence', { r: 13 }); });
      c.mon = U.agent(svg, { x: 700, y: 385, r: 22, role: 'tool' }); c.monLab = T(U, svg, 738, 393, 'monitor', 'lab', 'start');
      c.hidLab = T(U, svg, 630, 640, 'hidden content passes', 'lab lab--alert');
      c.tryL = U.link(svg, { x: 770, y: 250, r: 40 }, { x: 1250, y: 250, r: 0 }, { cls: 'ln--dash' }); U.op(c.tryL, 0);
      c.x = U.token(svg, 'lost', { r: 18 }); U.place(c.x, 1262, 250);
      c.noTool = T(U, svg, 1050, 300, 'no tool that writes outside', 'lab lab--hi');
      c.c1 = T(U, svg, 165, 380, 'untrusted text', 'lab lab--alert');
      c.c2 = T(U, svg, 1240, 86, '', 'lab lab--warm', 'end');
      c.c3 = T(U, svg, 1724, 490, '', 'lab lab--hi', 'end');
      return c;
    },
    draw: function (c, t, U) {
      var p1 = U.cue(1), p2 = U.cue(2), P = function (a) { return [a.x, a.y]; };
      var F = function (k, a, b, t0, d) { U.fly(c.tk[k], U.seg(P(a), P(b), a.r + 8, b.r + 8), t, t0, d || 1.6, false); };
      var top = function (a) { return { x: a.x, y: 120, r: 0 }; };
      var t1 = U.say(0, 'Retrieved pages enter'), t2 = U.say(0, 'notes leave the organization'), t3 = U.say(0, 'The finished draft leaves');
      if (t < p1) { F('pr', c.pg, c.rs, t1); F('m1', c.rs, top(c.rs), t2, 1.2); F('m2', c.an, top(c.an), t2 + 0.2, 1.2); F('m3', c.wr, top(c.wr), t2 + 0.4, 1.6); F('da', c.dr, c.ap, t3); F('ar', c.ap, c.rd, t3 + 1.6); }
      else ['pr', 'm1', 'm2', 'm3', 'da', 'ar'].forEach(function (k) { U.op(c.tk[k], 0); });
      var ph = t < p1;
      U.cls(c.L.pr, 'is-bad', ph && t >= t1); U.op(c.c1, U.ramp(t, t1 + 0.4, 0.5) * (ph ? 1 : 0.5));
      ['m1', 'm2', 'm3'].forEach(function (k) { U.cls(c.L[k], 'is-live', ph && t >= t2 && t < t2 + 2.2); }); U.op(c.c2, U.ramp(t, t2 + 0.4, 0.5) * (ph || t >= p2 ? 1 : 0.5));
      U.cls(c.L.da, 'is-live', ph && t >= t3); U.cls(c.L.ar, 'is-live', ph && t >= t3 + 1.6); U.op(c.c3, U.ramp(t, t3 + 1.6, 0.5) * (ph ? 1 : 0.5));
      // passage 1: reading for content against limiting reach
      var tr = U.say(1, 'One reads the messages'), th = U.say(1, 'agents can hide information'), tl = U.say(1, 'The other way limits reach');
      var mid1 = t >= p1 && t < p2;
      U.op(c.mon.g, mid1 ? U.ramp(t, tr, 0.5) : 0); U.op(c.monLab, mid1 ? U.ramp(t, tr, 0.5) : 0);
      U.cls(c.mon.g, 'is-on', t >= tr && t < p2);
      U.fly(c.tk.hid, U.seg(P(c.an), P(c.wr), 48, 48), t, th, 2.2, false); if (!mid1) U.op(c.tk.hid, 0);
      U.op(c.hidLab, t >= th + 1.4 && t < p2 ? U.ramp(t, th + 1.4, 0.5) : 0);
      U.fly(c.tk.try, [[818, 250], [1240, 250]], t, tl + 0.4, 2, true); if (!mid1) U.op(c.tk.try, 0);
      U.op(c.tryL, mid1 ? U.ramp(t, tl + 0.4, 0.4) * 0.7 : 0);
      U.op(c.x, t >= tl + 2.4 && t < p2 ? 1 : 0); U.op(c.noTool, t >= tl + 2.4 && t < p2 ? U.ramp(t, tl + 2.4, 0.5) : 0);
      // passage 2: reach from the record
      var tq = U.say(2, 'Start from the internal record');
      if (t >= p2) {
        var steps = [['ra'], ['aw', 'm2'], ['wd', 'm3'], ['da'], ['ar']];
        steps.forEach(function (ks, i) { ks.forEach(function (k) { var on = t >= tq + 0.8 + i * 0.9; U.cls(c.L[k], k.charAt(0) === 'm' ? 'is-bad' : 'is-live', on); if (k.charAt(0) === 'm') U.cls(c.L[k], 'is-live', false); }); });
        U.cls(c.L.pr, 'is-bad', false); U.cls(c.L.rw, 'is-live', false); U.cls(c.L.m1, 'is-live', false);
        U.cls(c.rec.g, 'is-on', t >= tq);
        U.op(c.c3, U.ramp(t, U.say(2, 'through the approval step'), 0.5)); U.op(c.c2, U.ramp(t, U.say(2, 'to the provider in every model call'), 0.5));
        U.setText(c.c2, 'leaves in every model call'); U.setText(c.c3, 'leaves through approval');
      } else { U.setText(c.c2, 'notes leave in model calls'); U.setText(c.c3, 'draft leaves through approval'); U.cls(c.rec.g, 'is-on', false); U.cls(c.L.ra, 'is-live', false); U.cls(c.L.aw, 'is-live', false); U.cls(c.L.wd, 'is-live', false); ['m2', 'm3'].forEach(function (k) { U.cls(c.L[k], 'is-bad', false); }); }
    } });

  // =================================================================== 14. oversight
  var NS = [6, 12, 24];
  NCMA.scene({ id: 'where-to-watch', note: 'Illustrative · message counts are n(n−1) per round for fully connected agents', desc: 'A person faces a fully connected network whose messages stream toward them; the network grows from 6 to 12 to 24 agents and the count of messages per round rises from 30 to 132 to 552. The scene then changes to the briefing pipeline with mechanical checks on its links, a source link that must resolve and a schema, and a person placed before the send tool. Finally three log lines appear, and the draft is opened to show that one claim still has no link.',
    build: function (svg, U) {
      var c = {};
      c.A = U.g(svg);
      c.per = U.agent(c.A, { x: 170, y: 400, r: 50, role: 'human', label: 'a person reading', ly: 86 });
      c.lg = U.g(c.A); c.ng = U.g(c.A); c.tg = U.g(c.A);
      c.lines = []; for (var i = 0; i < 24; i++) for (var j = i + 1; j < 24; j++) c.lines.push({ i: i, j: j, e: U.el('line', { 'class': 'ln is-faint' }, c.lg) });
      c.nodes = []; for (i = 0; i < 24; i++) c.nodes.push(U.el('circle', { r: 14, 'class': 'nd' }, c.ng));
      c.toks = []; for (i = 0; i < 24; i++) c.toks.push(U.token(c.tg, 'evidence', { r: 9 }));
      c.cnt = T(U, c.A, 1150, 770, '', 'word--lg');
      // pipeline
      c.B = U.g(svg); U.op(c.B, 0);
      var X = [130, 360, 600, 840, 1080, 1320, 1580];
      c.pp = [U.agent(c.B, { x: X[0], y: 300, r: 38, label: 'researcher', ly: 74 }), U.agent(c.B, { x: X[1], y: 300, r: 36, role: 'doc', label: 'notes', ly: 74 }), U.agent(c.B, { x: X[2], y: 300, r: 38, label: 'writer', ly: 74 }),
        U.agent(c.B, { x: X[3], y: 300, r: 38, role: 'doc', label: 'draft', ly: 74 }), U.agent(c.B, { x: X[4], y: 300, r: 38, label: 'reviewer', ly: 74 }), U.agent(c.B, { x: X[5], y: 300, r: 40, role: 'hub', label: 'orchestrator', ly: 82 }),
        U.agent(c.B, { x: X[6], y: 300, r: 42, role: 'human', label: 'a person decides', ly: 80 })];
      c.send = U.agent(c.B, { x: 1580, y: 580, r: 40, role: 'tool', label: 'send', ly: 74 });
      c.pl = []; for (i = 0; i < 6; i++) c.pl.push(U.link(c.B, c.pp[i], c.pp[i + 1], { arrow: true })); c.pl.push(U.link(c.B, c.pp[6], c.send, { arrow: true }));
      c.checks = [[480, 'link resolves'], [1200, 'fits schema']].map(function (d) { var g = U.g(c.B); U.el('rect', { x: d[0] - 13, y: 287, width: 26, height: 26, rx: 4, 'class': 'box box--hi' }, g); U.text(g, d[0], 250, d[1], 'lab lab--hi', { 'text-anchor': 'middle' }); U.op(g, 0); return g; });
      c.ptk = U.token(c.B, 'evidence', { r: 13 });
      c.log = U.g(c.B); U.op(c.log, 0);
      U.text(c.log, 60, 500, 'log', 'lab');
      c.rows = [['step 10', 'reviewer → orchestrator: two claims lack a source'], ['step 11', 'orchestrator → approver: revised draft submitted']].map(function (r, i) { var g = U.g(c.log); U.text(g, 60, 550 + i * 50, r[0], 'lab', {}); U.text(g, 200, 550 + i * 50, r[1], 'cap', {}); U.op(g, 0); return g; });
      c.open = T(U, c.B, 840, 420, 'claim 2: still no link', 'lab lab--alert');
      return c;
    },
    draw: function (c, t, U) {
      var p1 = U.cue(1), p2 = U.cue(2);
      var tn = [0, U.say(0, 'twelve exchange 132'), U.say(0, 'twenty-four exchange 552')];
      var k = t >= tn[2] ? 2 : t >= tn[1] ? 1 : 0, n0 = NS[Math.max(0, k - 1)], n1 = NS[k], p = k === 0 ? 1 : U.ramp(t, tn[k], 1.4);
      var pos = function (i, n) { var a = -Math.PI / 2 + i * 2 * Math.PI / n; return [1150 + 300 * Math.cos(a), 390 + 300 * Math.sin(a)]; };
      var P = [];
      for (var i = 0; i < 24; i++) {
        var a = pos(Math.min(i, n0 - 1), n0), b = pos(i, n1), v0 = i < n0 ? 1 : 0, v1 = i < n1 ? 1 : 0;
        if (i >= n0) a = b;
        P.push([lerp(a[0], b[0], p), lerp(a[1], b[1], p)]);
        c.nodes[i].setAttribute('cx', P[i][0].toFixed(1)); c.nodes[i].setAttribute('cy', P[i][1].toFixed(1)); U.op(c.nodes[i], lerp(v0, v1, p));
      }
      c.lines.forEach(function (L) { var v = (L.j < n1 ? 1 : 0) * (L.j < n0 ? 1 : p); L.e.setAttribute('x1', P[L.i][0].toFixed(1)); L.e.setAttribute('y1', P[L.i][1].toFixed(1)); L.e.setAttribute('x2', P[L.j][0].toFixed(1)); L.e.setAttribute('y2', P[L.j][1].toFixed(1)); U.op(L.e, v); });
      var ts = U.say(0, 'by reading its messages');
      c.toks.forEach(function (tk, i) { if (i >= n1 || t < ts) { U.op(tk, 0); return; } var per = 2.6, ph = ((t - ts) + i * 0.37) % per; U.fly(tk, [P[i], [230, 400]], ph, 0, 2.2, false); });
      var m = n1 * (n1 - 1); U.setText(c.cnt, n1 + ' agents · ' + m + ' messages per round'); U.op(c.cnt, U.ramp(t, U.say(0, 'Six agents that all talk'), 0.5));
      U.op(c.A, t < p1 ? 1 : 1 - U.ramp(t, p1, 0.8));
      // pipeline with checks
      U.op(c.B, U.ramp(t, p1 + 0.6, 0.8));
      var tc = U.say(1, 'Some checks are mechanical');
      c.checks.forEach(function (g, i) { U.op(g, U.ramp(t, U.say(1, i ? 'a message must fit its schema' : 'a note must carry a source link'), 0.5)); });
      var pts = c.pp.map(function (a) { return [a.x, a.y]; }).concat([[1580, 540]]);
      var ph2 = t - tc; if (t >= tc && t < p2) U.fly(c.ptk, pts, ph2 % 9, 0, 7.5, false); else U.op(c.ptk, 0);
      var tp = U.say(1, 'The person then judges'); U.cls(c.pp[6].g, 'is-on', t >= tp && t < p2);
      U.op(c.log, U.ramp(t, p2, 0.6));
      c.rows.forEach(function (g, i) { U.op(g, U.ramp(t, U.say(2, i ? 'the orchestrator then submitted' : 'The log says'), 0.5)); });
      var to = U.say(2, 'Here one of the two claims');
      U.cls(c.pp[3].g, 'is-bad', t >= to); U.op(c.open, U.ramp(t, to, 0.5));
      U.em(c.pl[2], t >= to ? 2 : 2);
    } });

  // =================================================================== 15. long runs
  var PSTEP = 0.98, NSTEP = 40;
  var STEPXY = []; for (var si = 0; si < NSTEP; si++) { var row = Math.floor(si / 10), col = si % 10; if (row % 2) col = 9 - col; STEPXY.push([110 + col * 95, 150 + row * 160]); }
  NCMA.scene({ id: 'long-runs', note: 'Illustrative arithmetic · independent steps, each right with probability 0.98', desc: 'Forty steps laid out in a winding path. A token moves along them, each passed step turning mint, while a chart on the right traces the chance that every step so far has gone right: 0.82 after ten steps and 0.45 after forty. Then the label state checked independently of reports appears, and a check at the end of each row. Finally the curve dims beneath two lines: the calculated curve assumes 98 percent success at every step, independently, and actual workflow reliability requires testing complete runs.',
    build: function (svg, U) {
      var c = { st: [] };
      for (var i = 0; i < NSTEP - 1; i++) U.el('line', { x1: STEPXY[i][0], y1: STEPXY[i][1], x2: STEPXY[i + 1][0], y2: STEPXY[i + 1][1], 'class': 'ln is-faint' }, svg);
      STEPXY.forEach(function (p) { c.st.push(U.el('circle', { cx: p[0], cy: p[1], r: 15, 'class': 'nd' }, svg)); });
      c.tok = U.token(svg, 'evidence', { r: 11 });
      c.assume = T(U, svg, 110, 770, 'no step checked', 'lab', 'start');
      // chart
      var X = function (k) { return 1160 + k / NSTEP * 540; }, Y = function (v) { return 620 - v * 480; }; c.X = X; c.Y = Y;
      c.ax = U.g(svg);
      U.el('line', { x1: X(0), y1: Y(0), x2: X(NSTEP), y2: Y(0), 'class': 'rule' }, c.ax); U.el('line', { x1: X(0), y1: Y(0), x2: X(0), y2: Y(1), 'class': 'rule' }, c.ax);
      U.text(c.ax, X(0) - 14, Y(1) + 8, '1', 'lab', { 'text-anchor': 'end' }); U.text(c.ax, X(0) - 14, Y(0) + 8, '0', 'lab', { 'text-anchor': 'end' });
      U.text(c.ax, X(NSTEP / 2), Y(0) + 50, 'steps', 'lab', { 'text-anchor': 'middle' });
      U.text(c.ax, X(0), Y(1) - 30, 'chance every step so far is right', 'lab lab--t2', { 'text-anchor': 'start' });
      c.curve = U.el('path', { 'class': 'ln is-live', fill: 'none' }, svg);
      c.m10 = T(U, svg, X(10) + 14, Y(Math.pow(PSTEP, 10)) - 18, 'after 10: ' + Math.pow(PSTEP, 10).toFixed(2), 'lab lab--hi', 'start');
      c.m40 = T(U, svg, X(40), Y(Math.pow(PSTEP, 40)) + 44, 'after 40: ' + Math.pow(PSTEP, 40).toFixed(2), 'lab lab--hi', 'end');
      c.dots = [10, 40].map(function (k) { var e = U.el('circle', { cx: X(k), cy: Y(Math.pow(PSTEP, k)), r: 7, 'class': 'nd is-fill' }, svg); fillc(e, MINT); U.op(e, 0); return e; });
      c.checks = [9, 19, 29, 39].map(function (k) { var p = STEPXY[k], g = U.g(svg); U.el('rect', { x: p[0] + (k % 20 === 9 ? 30 : -56), y: p[1] - 13, width: 26, height: 26, rx: 4, 'class': 'box box--hi' }, g); U.op(g, 0); return g; });
      c.chkLab = T(U, svg, 1060, 100, 'state checked independently of reports', 'lab lab--hi', 'end');
      c.calc = T(U, svg, 1430, 720, 'calculated: assumes 98% per step, independently', 'lab lab--warm');
      c.open = T(U, svg, 1430, 766, 'actual reliability: requires testing whole runs', 'lab lab--hi');
      return c;
    },
    draw: function (c, t, U) {
      var t0 = U.say(0, 'Suppose every step'), per = 0.42;
      var k = U.clamp((t - t0) / per, 0, NSTEP - 1);
      c.st.forEach(function (e, i) { strokec(e, t >= t0 && i <= k ? MINT : ''); });
      if (t >= t0) { var i0 = Math.floor(k), f = k - i0, a = STEPXY[i0], b = STEPXY[Math.min(i0 + 1, NSTEP - 1)]; U.place(c.tok, lerp(a[0], b[0], f), lerp(a[1], b[1], f)); U.op(c.tok, 1); } else U.op(c.tok, 0);
      var d = 'M' + c.X(0) + ',' + c.Y(1);
      for (var j = 1; j <= Math.floor(k) + 1 && t >= t0; j++) d += ' L' + c.X(j).toFixed(1) + ',' + c.Y(Math.pow(PSTEP, j)).toFixed(1);
      c.curve.setAttribute('d', d); U.op(c.curve, t >= t0 ? 1 : 0);
      U.op(c.m10, t >= t0 + 9 * per ? U.ramp(t, Math.max(t0 + 9 * per, U.say(0, 'After ten steps')), 0.5) : 0); U.op(c.dots[0], t >= t0 + 9 * per ? 1 : 0);
      U.op(c.m40, t >= t0 + 39 * per ? 1 : 0); U.op(c.dots[1], t >= t0 + 39 * per ? 1 : 0);
      var tc = U.say(1, 'against the state of the environment'), tm = U.say(1, 'The result would be a measure');
      U.op(c.assume, U.ramp(t, U.say(0, 'The assumptions are simplifications'), 0.5) * (1 - U.ramp(t, tc, 0.5)));
      c.checks.forEach(function (g, i) { U.op(g, U.ramp(t, U.say(1, 'comparing runs with and without') + i * 0.3, 0.4)); }); U.op(c.chkLab, U.ramp(t, tc, 0.5));
      // final beat: the computed curve set apart from the reliability that would have to be measured
      U.op(c.calc, U.ramp(t, tm, 0.5)); U.op(c.open, U.ramp(t, tm + 0.8, 0.5));
      if (t >= tm) U.op(c.curve, 1 - 0.45 * U.ramp(t, tm, 0.6));
    } });

  // =================================================================== 16. closing
  NCMA.scene({ id: 'justified-reliance', note: ILL, desc: 'The six agents from the opening, now with a web page outside them on the left and a routing system behind a dashed boundary on the right. The page sends an uncertain message to two agents, each of which passes a summary inward along a separate path to the agent beside the boundary, which receives two agreeing reports and sends an instruction to the routing system. The paths then light backward from that agent and meet at the single page; the first link on each path turns red where may close became will close. Finally the channels, the shared page, the boundary and the acting agent are highlighted in turn, and the picture holds.',
    build: function (svg, U) {
      var c = NCMA.six(svg, U, { cx: 900, cy: 400, R: 260, r: 40 });
      c.page = U.agent(svg, { x: 250, y: 400, r: 56, role: 'doc', label: 'web page', ly: 90 });
      c.pageTxt = U.lines(svg, 250, 560, ['“Route 9 bridge', 'may close on Friday”'], 'word', 34, { 'text-anchor': 'middle' });
      c.zone = U.el('rect', { x: 1390, y: 250, width: 350, height: 300, rx: 12, 'class': 'zone' }, svg);
      U.text(svg, 1565, 232, 'outside the system', 'lab', { 'text-anchor': 'middle' });
      c.tool = U.agent(svg, { x: 1565, y: 400, r: 50, role: 'tool', label: 'routing system', ly: 88 });
      var P = c.pos, A = function (k) { return [P[k][0], P[k][1]]; };
      c.E = {};
      var defs = [['pa4', [250, 400], A('a4'), 62, 46], ['pa6', [250, 400], A('a6'), 62, 46], ['a4a1', A('a4'), A('a1'), 46, 46], ['a1a2', A('a1'), A('a2'), 46, 46], ['a2a5', A('a2'), A('a5'), 46, 46], ['a6a3', A('a6'), A('a3'), 46, 46], ['a3a5', A('a3'), A('a5'), 46, 46], ['a5t', A('a5'), [1565, 400], 46, 56]];
      defs.forEach(function (d) { var p = ln(U, c.edges, '', true); var s = seg(U, p, d[1], d[2], d[3], d[4]); c.E[d[0]] = { p: p, s: s }; });
      c.tok = {};
      ['pa4', 'pa6'].forEach(function (k) { c.tok[k] = U.token(c.tk, 'hedged', { r: 15 }); });
      ['a4a1', 'a1a2', 'a2a5', 'a6a3', 'a3a5'].forEach(function (k) { c.tok[k] = U.token(c.tk, 'evidence', { r: 15 }); });
      c.tok.a5t = U.token(c.tk, 'instruction', { r: 16 });
      c.agree = T(U, svg, 1125, 650, 'two reports agree', 'lab lab--hi');
      c.acted = T(U, svg, 1565, 640, 'deliveries rerouted', 'lab lab--warm');
      c.one = T(U, svg, 250, 300, 'two reports · one source', 'lab lab--hi');
      c.mw = [T(U, svg, 600, 182, 'may → will', 'lab lab--alert'), T(U, svg, 600, 640, 'may → will', 'lab lab--alert')];
      c.cond = [T(U, svg, 1040, 175, 'channels', 'lab lab--hi', 'start'), T(U, svg, 250, 300, 'shared source', 'lab lab--hi'), T(U, svg, 1565, 595, 'tool and permission', 'lab lab--hi')];
      return c;
    },
    draw: function (c, t, U) {
      c.topo('complete', t, 0); Object.keys(c.links).forEach(function (k) { U.op(c.links[k], 0.13); }); c.clues(0.3);
      SIX.agents.forEach(function (a) { c.judge(a, ''); });
      var p1 = U.cue(1), p2 = U.cue(2);
      var ts = U.say(0, 'Each reader summarizes'), H = 1.3;
      var sched = { pa4: ts, pa6: ts + 0.1, a4a1: ts + 1.7, a1a2: ts + 1.7 + H + 0.1, a2a5: ts + 1.7 + 2 * (H + 0.1), a6a3: ts + 1.8, a3a5: ts + 1.8 + 2 * (H + 0.1) - (H + 0.1) + 1.4 };
      var arrive = Math.max(sched.a2a5, sched.a3a5) + H;
      Object.keys(sched).forEach(function (k) { U.fly(c.tok[k], c.E[k].s, t, sched[k], k.charAt(0) === 'p' ? 1.5 : H, k === 'a2a5' || k === 'a3a5'); U.cls(c.E[k].p, 'is-live', t >= sched[k] && t < sched[k] + H + 0.2 && t < p1); });
      if (t >= p1) ['a2a5', 'a3a5'].forEach(function (k) { U.op(c.tok[k], 1 - U.ramp(t, p1, 0.5)); });
      U.op(c.agree, t >= arrive ? U.ramp(t, arrive, 0.5) * (t >= p1 ? 0.5 : 1) : 0);
      var tact = U.say(0, 'it reroutes the deliveries');
      U.fly(c.tok.a5t, c.E.a5t.s, t, tact, 1.4, true);
      U.cls(c.E.a5t.p, 'is-live', t >= tact && t < tact + 1.6); U.cls(c.tool.g, 'is-on', t >= tact + 1.4); U.op(c.acted, U.ramp(t, tact + 1.4, 0.5));
      U.cls(c.ag.a5.g, 'is-on', t >= arrive);
      // passage 1: trace backward
      var tb = U.say(1, 'lets the two reports be traced backward'), lv = [['a2a5', 'a3a5'], ['a1a2', 'a6a3'], ['a4a1'], ['pa4', 'pa6']];
      if (t >= p1) lv.forEach(function (ks, i) { ks.forEach(function (k) { U.cls(c.E[k].p, 'is-live', t >= tb + 0.3 + i * 0.7); }); });
      var tsrc = U.say(1, 'Both paths end at the same page');
      U.cls(c.page.g, 'is-on', t >= tsrc); U.op(c.one, t >= tsrc && t < U.say(2, 'this shared source') ? U.ramp(t, tsrc, 0.5) : 0);
      var tw = U.say(1, 'The first summary on each path');
      ['pa4', 'pa6'].forEach(function (k) { U.cls(c.E[k].p, 'is-bad', t >= tw); });
      c.mw.forEach(function (e) { U.op(e, U.ramp(t, tw + 0.3, 0.5)); });
      // passage 2: the conditions, placed on their referents
      var tch = U.say(2, 'these channels'), tsh = U.say(2, 'this shared source'), ttl = U.say(2, 'this tool and its permission'), trd = U.say(2, 'this way of reading the answer');
      U.op(c.cond[0], U.ramp(t, tch, 0.5)); U.op(c.cond[1], U.ramp(t, tsh, 0.5)); U.op(c.cond[2], U.ramp(t, ttl, 0.5));
      U.cls(c.zone, 'box--hi', t >= ttl); if (t >= ttl) strokec(c.zone, MINT); else strokec(c.zone, '');
      c.ag.a5.shape.style.filter = t >= trd && t < trd + 4 ? 'drop-shadow(0 0 12px rgba(111,216,190,.7))' : '';
      U.op(c.acted, t >= p2 ? 0.6 : U.ramp(t, tact + 1.4, 0.5));
    } });
})();
