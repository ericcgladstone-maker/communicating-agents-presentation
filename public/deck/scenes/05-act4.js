/* Act IV scenes: networks that change, fail, and have to be engineered.
   Every draw() is a pure function of t. Toy outcomes are computed here from the
   stated rules (ports of the reference edition's ch13, ch14 and ch15 models), so
   no figure hard-codes a result. */
(function () {
  'use strict';
  var NCMA = window.NCMA, M = NCMA.models;
  var ILL = 'Illustrative model · outcomes follow from stated rules';
  var REACH = 'Illustrative model · reachability under a stated rule, not a compliance rate';

  function hex(cx, cy, R, i) { var th = -Math.PI / 2 + i * Math.PI / 3; return [cx + R * Math.cos(th), cy + R * Math.sin(th), Math.cos(th), Math.sin(th)]; }
  function clear(g) { while (g.firstChild) g.removeChild(g.firstChild); }
  function ringBad(parent, U, x, y, r) { var e = U.el('circle', { cx: x, cy: y, r: r, 'class': 'nd' }, parent); e.style.fill = 'none'; e.style.stroke = 'var(--alert)'; e.style.strokeDasharray = '7 6'; e.style.strokeWidth = '3'; return e; }

  // =============================================================== chapter 13 models
  // delegation by recent success (reference edition, models/ch13.js)
  var AG = ['n1', 'n2', 'n3', 'n4', 'n5', 'n6'];
  function delegate(o) {
    var T = o.steps || 12, cap = o.cap || 0, win = o.window || 0, first = o.first || 0, last = {}, recv = {}, hist = [];
    AG.forEach(function (a) { last[a] = -1; recv[a] = []; });
    for (var t = 1; t <= T; t++) {
      var req = AG[(first + t - 1) % 6], best = null;
      AG.forEach(function (a) { if (a !== req && last[a] >= 0 && (best === null || last[a] > last[best])) best = a; });
      var to = best || AG[(AG.indexOf(req) + 1) % 6];
      var load = recv[to].filter(function (s) { return s >= t - win && s < t; }).length, ok = !(cap && load >= cap);
      recv[to].push(t);
      if (ok) last[to] = t; else if (o.forget) last[to] = -1;
      hist.push({ t: t, from: req, to: to, ok: ok });
    }
    return hist;
  }
  // naming game on a seeded schedule of pairs (reference edition, models/ch13.js)
  function rng(seed) { var s = seed >>> 0; return function () { s = (s + 0x6D2B79F5) >>> 0; var t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  var NAMES = ['K', 'L', 'M', 'P', 'R', 'S', 'T', 'V', 'W', 'X', 'Y', 'Z'];
  function naming(seed, steps) {
    var r = rng(seed), inv = {}, made = 0, hist = [];
    AG.forEach(function (a) { inv[a] = []; });
    var snap = function () { var o = {}, s = {}; AG.forEach(function (a) { o[a] = inv[a].slice(); inv[a].forEach(function (n) { s[n] = 1; }); }); return { inv: o, names: Object.keys(s).sort() }; };
    var h0 = snap(); h0.i = 0; hist.push(h0);
    for (var i = 1; i <= steps; i++) {
      var sp = AG[Math.floor(r() * 6)], hr = sp; while (hr === sp) hr = AG[Math.floor(r() * 6)];
      if (!inv[sp].length) inv[sp].push(NAMES[made++ % NAMES.length]);
      var name = inv[sp][inv[sp].length - 1], ok = inv[hr].indexOf(name) >= 0;
      if (ok) { inv[sp] = [name]; inv[hr] = [name]; } else inv[hr].push(name);
      var h = snap(); h.i = i; h.sp = sp; h.hr = hr; h.name = name; h.ok = ok; hist.push(h);
    }
    return hist;
  }

  // =============================================================== chapter 14 model
  // the six-clue case under evidence exchange with one thing broken (models/ch14.js runFault)
  var KEY = 0;
  function runFault(o) {
    var SIX = M.SIX, removed = o.removed || [];
    var agents = SIX.agents.filter(function (a) { return removed.indexOf(a) < 0; });
    var clue = Object.assign({}, SIX.clue); if (o.fabricate) clue[o.fabricate.id] = o.fabricate.weight;
    var cut = {}; (o.cutLinks || []).forEach(function (e) { cut[e[0] + e[1]] = cut[e[1] + e[0]] = 1; });
    var edges = (o.edges || []).filter(function (e) { return !cut[e[0] + e[1]] && removed.indexOf(e[0]) < 0 && removed.indexOf(e[1]) < 0; });
    var nb = {}; agents.forEach(function (a) { nb[a] = []; }); edges.forEach(function (e) { nb[e[0]].push(e[1]); nb[e[1]].push(e[0]); });
    var sum = function (ids) { return ids.reduce(function (s, id) { return s + clue[id]; }, 0); };
    var sign = function (x, p) { return x > 0 ? 'A' : x < 0 ? 'B' : p; };
    var know = {}, judge = {};
    agents.forEach(function (a) { know[a] = [a]; if (o.fabricate && o.fabricate.agent === a) know[a].push(o.fabricate.id); judge[a] = sign(SIX.clue[a], null); });
    var snap = function (msgs) { var k = {}; agents.forEach(function (a) { k[a] = know[a].slice(); }); return { agents: agents.slice(), know: k, judge: Object.assign({}, judge), msgs: msgs || [] }; };
    var hist = [snap()];
    var sent = function (f, to) { var s = know[f].slice(), x = o.faulty; if (x && x.agent === f && x.to.indexOf(to) >= 0) s = s.filter(function (id) { return x.strip.indexOf(id) < 0; }); return s; };
    for (var r = 1; r <= o.rounds; r++) {
      var nk = {}, nj = {}, msgs = [];
      agents.forEach(function (a) {
        var u = know[a].slice();
        nb[a].forEach(function (s) { var m = sent(s, a); msgs.push({ from: s, to: a, ev: m, full: m.length === know[s].length }); m.forEach(function (id) { if (u.indexOf(id) < 0) u.push(id); }); });
        nk[a] = u; nj[a] = sign(sum(u), judge[a]);
      });
      know = nk; judge = nj; hist.push(snap(msgs));
    }
    hist.edges = edges; hist.key = 'h' + (KEY++);
    return hist;
  }
  function tally(h) { var a = h.agents.filter(function (x) { return h.judge[x] === 'A'; }).length; return { A: a, B: h.agents.length - a }; }
  function readout(h) { var c = tally(h); return c.A > c.B ? 'A' : c.B > c.A ? 'B' : 'tie'; }
  var T = M.SIX.topologies;

  // animate the rounds of a runFault history on a six-cast; starts[r-1] is when round r leaves
  function play(c, U, H, t, starts, d) {
    var rc = 0; c._tk = c._tk || {}; c.all = c.all || [];
    for (var r = 1; r < H.length; r++) {
      var key = H.key + ':' + r;
      // a receiver with many incoming messages takes them farther out along each link, so they do not pile up on it
      var inc = {}; H[r].msgs.forEach(function (m) { inc[m.to] = (inc[m.to] || 0) + 1; });
      if (!c._tk[key]) c._tk[key] = H[r].msgs.map(function (m) {
        var trim = c.r + (inc[m.to] >= 4 ? 66 : 10);
        var kind = m.ev.indexOf('x') >= 0 ? 'introduced' : m.full === false ? 'altered' : 'evidence';
        var tk = U.token(c.tk, kind, { r: kind === 'introduced' ? 14 : 18, label: kind === 'evidence' ? m.ev.length : null });
        c.all.push(tk);
        var A = c.pos[m.from], B = c.pos[m.to]; return { tk: tk, pts: U.seg([A[0], A[1]], [B[0], B[1]], c.r + 10, trim) };
      });
      var s = starts[r - 1]; if (s == null) continue;
      c._tk[key].forEach(function (x, i) { U.fly(x.tk, x.pts, t, s + (i % 6) * 0.04, d, false); });
      if (t >= s + d) rc = r;
    }
    return rc;
  }
  function hideAll(c, U) { (c.all || []).forEach(function (tk) { U.op(tk, 0); }); }
  function apply(c, U, H, rc, removed) {
    M.SIX.agents.forEach(function (a) {
      var off = !!removed && removed.indexOf(a) >= 0;
      U.cls(c.ag[a].g, 'is-off', off); c.judge(a, off ? '' : H[rc].judge[a]); U.op(c.clue[a], off ? 0.22 : 1);
    });
  }
  function edges(c, U, list, cut) {
    Object.keys(c.links).forEach(function (k) { U.op(c.links[k], 0); U.cls(c.links[k], 'is-cut', false); });
    list.forEach(function (e) { U.op(c.links[e[0] + e[1]], 0.8); });
    (cut || []).forEach(function (e) { var l = c.links[e[0] + e[1]]; U.op(l, 0.7); U.cls(l, 'is-cut', true); });
  }
  function six(svg, U, o) { var c = NCMA.six(svg, U, o); c.r = o.r || 40; return c; }

  // =============================================================== the briefing workflow cast
  // stable positions for every scene that shows the whole workflow
  var BP = { orc: [880, 190], hu: [1340, 190], r1: [640, 310], r2: [640, 580], search: [420, 445], page: [140, 445], doc: [880, 445], wr: [1120, 310], rv: [1120, 580], send: [1340, 445], out: [1640, 445] };
  var BSPEC = {
    orc: { role: 'hub', r: 44, label: 'orchestrator', ly: -66 }, hu: { role: 'human', r: 44, label: 'approver', ly: -62 },
    r1: { r: 42, label: 'researcher 1' }, r2: { r: 42, label: 'researcher 2' }, search: { role: 'tool', r: 38, label: 'search' },
    page: { role: 'doc', r: 44, label: 'web page' }, doc: { role: 'doc', r: 56, label: 'shared draft' }, wr: { r: 42, label: 'writer' },
    rv: { r: 42, label: 'reviewer' }, send: { role: 'tool', r: 38, label: 'email tool' }, out: { role: 'doc', r: 40, label: 'outside address' }
  };
  var BLINKS = [['page', 'search'], ['search', 'r1'], ['search', 'r2'], ['orc', 'r1'], ['orc', 'r2'], ['r1', 'doc'], ['r2', 'doc'], ['doc', 'wr'], ['doc', 'rv'], ['orc', 'wr'], ['rv', 'orc'], ['orc', 'hu'], ['wr', 'send'], ['hu', 'send'], ['send', 'out']];
  function briefCast(svg, U) {
    var c = { A: {}, L: {} };
    c.zone = U.el('rect', { x: 290, y: 30, width: 1190, height: 740, rx: 14, 'class': 'zone' }, svg);
    c.zoneLab = U.text(svg, 312, 70, 'trust boundary', 'lab');
    c.lg = U.g(svg); c.ng = U.g(svg); c.xg = U.g(svg); c.tg = U.g(svg);
    Object.keys(BSPEC).forEach(function (id) { var s = BSPEC[id], p = BP[id]; c.A[id] = U.agent(c.ng, Object.assign({ x: p[0], y: p[1] }, s)); });
    BLINKS.forEach(function (e) { var l = U.link(c.lg, c.A[e[0]], c.A[e[1]], {}); c.L[e[0] + e[1]] = c.L[e[1] + e[0]] = l; U.op(l, 0.35); });
    c.seg = function (a, b) { var A = c.A[a], B = c.A[b]; return U.seg([A.x, A.y], [B.x, B.y], A.r + 8, B.r + 8); };
    c.toks = [];
    // a scripted list of hops: [from, to, kind, t0, d, label]
    c.script = function (list) { return list.map(function (e) { var tk = U.token(c.tg, e[2], { r: e[2] === 'injected' ? 18 : 18, label: e[5] }); c.toks.push(tk); return { tk: tk, pts: c.seg(e[0], e[1]), t0: e[3], d: e[4] || 1.1, from: e[0], to: e[1] }; }); };
    c.run = function (U2, t, hops, hold) { hops.forEach(function (h) { U.fly(h.tk, h.pts, t, h.t0, h.d, hold); var live = t >= h.t0 && t < h.t0 + h.d; if (live) U.cls(c.L[h.from + h.to], 'is-live', true); }); };
    c.reset = function () { Object.keys(c.L).forEach(function (k) { U.cls(c.L[k], 'is-live', false); U.cls(c.L[k], 'is-bad', false); U.cls(c.L[k], 'is-cut', false); }); Object.keys(c.A).forEach(function (k) { U.cls(c.A[k].g, 'is-bad', false); U.cls(c.A[k].g, 'is-on', false); }); };
    c.show = function (ids, o) { ids.forEach(function (id) { U.op(c.A[id].g, o); }); };
    return c;
  }

  // =============================================================== 1. hub grows
  function hubCast(svg, U, hists) {
    var c = { pos: {}, ag: {}, cnt: {}, ln: {} };
    c.eg = U.g(svg); c.ng = U.g(svg); c.tg = U.g(svg);
    AG.forEach(function (a, i) { c.pos[a] = hex(460, 400, 262, i); });
    hists.forEach(function (h) { h.forEach(function (s) { var k = s.from + '>' + s.to; if (!c.ln[k]) { var A = c.pos[s.from], B = c.pos[s.to]; c.ln[k] = U.link(c.eg, { x: A[0], y: A[1], r: 46 }, { x: B[0], y: B[1], r: 46 }, { arrow: true, bend: 0.13 }); U.op(c.ln[k], 0); } }); });
    AG.forEach(function (a) { var p = c.pos[a]; c.ag[a] = U.agent(c.ng, { x: p[0], y: p[1], r: 46, mark: a }); c.cnt[a] = U.text(c.ng, p[0] + p[2] * 92, p[1] + p[3] * 92 + 12, '0', 'word--lg', { 'text-anchor': 'middle' }); U.op(c.cnt[a], 0); });
    c.tok = U.token(c.tg, 'instruction', { r: 15 }); c.bad = U.token(c.tg, 'lost', { r: 17 });
    // the rule, as a designer would write it
    c.card = U.g(svg);
    U.el('rect', { x: 990, y: 110, width: 740, height: 330, rx: 10, 'class': 'box' }, c.card);
    U.text(c.card, 1022, 160, 'the rule every requester follows', 'lab');
    c.rule = U.lines(c.card, 1022, 224, ['hand the task to the agent whose', 'latest success is most recent', 'if no other has succeeded yet,', 'choose the next agent clockwise'], 'cap', 46);
    c.step = U.text(svg, 1360, 590, '', 'big', { 'text-anchor': 'middle' });
    c.sub = U.text(svg, 1360, 660, '', 'cap', { 'text-anchor': 'middle' });
    return c;
  }
  // draw one run: times[k] is when delegation k leaves; d its flight time
  function hubRun(c, U, t, H, times, d) {
    var done = 0, cur = -1, cum = {}, indeg = {}, failE = {}, fails = 0;
    times.forEach(function (t0, k) { if (t >= t0 + d) done = k + 1; else if (t >= t0 && cur < 0) cur = k; });
    AG.forEach(function (a) { indeg[a] = 0; });
    for (var k = 0; k < done; k++) { var s = H[k], key = s.from + '>' + s.to; cum[key] = (cum[key] || 0) + 1; indeg[s.to]++; if (!s.ok) { failE[key] = 1; fails++; } }
    Object.keys(c.ln).forEach(function (key) {
      var n = cum[key] || 0, l = c.ln[key];
      U.op(l, n ? 1 : 0); l.style.strokeWidth = n ? (2.4 + 0.55 * Math.min(n, 10)).toFixed(1) : '';
      U.cls(l, 'is-bad', !!failE[key]); U.cls(l, 'is-live', cur >= 0 && key === H[cur].from + '>' + H[cur].to);
    });
    AG.forEach(function (a) { U.setText(c.cnt[a], String(indeg[a])); U.op(c.cnt[a], 1); U.cls(c.ag[a].g, 'is-on', cur >= 0 && H[cur].from === a); U.cls(c.ag[a].g, 'is-bad', false); U.cls(c.ag[a].g, 'is-A', false); });
    if (cur >= 0) { var A = c.pos[H[cur].from], B = c.pos[H[cur].to]; U.fly(c.tok, U.seg([A[0], A[1]], [B[0], B[1]], 52, 56), t, times[cur], d, true); } else U.op(c.tok, 0);
    // a failed delegation flashes on the delegate just after it lands
    U.op(c.bad, 0);
    if (done > 0) { var L = H[done - 1], since = t - times[done - 1] - d; if (!L.ok && since < 0.9) { U.cls(c.ag[L.to].g, 'is-bad', true); var P = c.pos[L.to]; U.place(c.bad, P[0], P[1]); U.op(c.bad, 1 - since / 0.9); } }
    if (done === H.length) { var best = AG[0]; AG.forEach(function (a) { if (indeg[a] > indeg[best]) best = a; }); if (indeg[best] >= 8) U.cls(c.ag[best].g, 'is-A', true); }
    return { done: done, cur: cur, fails: fails, indeg: indeg };
  }
  function hubTimes(t1, t2, t3, gap) { var a = [t1, t2]; for (var k = 2; k < 12; k++) a.push(t3 + (k - 2) * gap); return a; }

  var D1 = delegate({ steps: 12 }), D4 = delegate({ steps: 12, first: 3 });
  NCMA.scene({ id: 'hub-grows', note: ILL, source: 'Barabási & Albert, 1999', desc: 'Six identical agents, n1 to n6, on a hexagon, with a card stating the rule: hand the task to the agent whose latest success is most recent, otherwise the next agent clockwise. Over twelve steps each requester sends a task along an arrow that thickens with use. n2 ends with ten of twelve tasks and n3 with two. The same rule started at n4 ends with n5 holding ten of twelve.',
    build: function (svg, U) { return hubCast(svg, U, [D1, D4]); },
    draw: function (c, t, U) {
      U.op(c.card, U.ramp(t, U.say(1, 'by a single rule'), 0.8));
      var r2 = U.say(3, 'Start the same rule'), r;
      if (t < U.cue(2)) { r = hubRun(c, U, -1, D1, hubTimes(1e9, 1e9, 1e9, 1), 1); AG.forEach(function (a) { U.op(c.cnt[a], U.ramp(t, U.say(1, 'Here are six'), 0.6)); }); U.setText(c.step, ''); U.setText(c.sub, ''); return; }
      if (t < r2) {
        r = hubRun(c, U, t, D1, hubTimes(U.say(2, 'At the first step'), U.say(2, 'At the second'), U.say(2, 'From then on'), 1.25), 1.0);
        U.setText(c.step, 'step ' + Math.max(1, r.done + (r.cur >= 0 ? 1 : 0)) + ' of 12');
        U.setText(c.sub, r.done === 12 ? 'n2 received ' + r.indeg.n2 + ' of 12' : '');
      } else {
        r = hubRun(c, U, t, D4, hubTimes(r2 + 0.6, r2 + 1.4, r2 + 2.2, 0.75), 0.6);
        U.setText(c.step, 'start at n4 · step ' + Math.max(1, r.done + (r.cur >= 0 ? 1 : 0)));
        U.setText(c.sub, r.done === 12 ? 'n5 received ' + r.indeg.n5 + ' of 12' : '');
      }
      U.op(c.step, 1); U.op(c.sub, 1);
      U.cls(c.sub, 'lab--hi', false);
    } });

  // =============================================================== 2. overload, and the rule beside the pattern
  var DO = delegate({ steps: 12, cap: 2, window: 2 }), DF = delegate({ steps: 12, cap: 2, window: 2, forget: true });
  NCMA.scene({ id: 'hub-overload', note: ILL, desc: 'The same six agents and rule, with a capacity limit: an agent fails after two tasks in two steps. n2 again receives ten of twelve tasks and five fail, marked in the alert color. A fifth line is added to the rule card: a failure clears that agent’s record. Rerun, the load spreads over n2, n3, n4 and n5 and two tasks fail. The rule card and the resulting network are then labeled as the rule and the pattern it produced.',
    build: function (svg, U) {
      var c = hubCast(svg, U, [DO, DF]);
      c.cap = U.text(svg, 1022, 492, 'capacity: an agent fails after 2 tasks in 2 steps', 'lab lab--warm');
      c.newLine = U.text(c.card, 1022, 408, 'a failure clears that agent’s record', 'word--lg');
      c.newLine.style.fill = 'var(--mint)';
      c.fail = U.text(svg, 1360, 730, '', 'big big--warm', { 'text-anchor': 'middle' });
      c.cmp = U.lines(svg, 1022, 610, ['rule as first written: n2 gets 10 of 12, 5 fail', 'one line changed: no agent above 4, 2 fail'], 'cap', 50);
      c.rL = U.text(svg, 990, 90, 'the rule, as written', 'lab lab--hi'); c.pL = U.text(svg, 0, 40, 'the pattern it produced', 'lab lab--hi');
      return c;
    },
    draw: function (c, t, U) {
      U.op(c.card, 1); U.op(c.cap, U.ramp(t, U.say(0, 'so add one limit'), 0.8));
      var tA = U.say(0, 'Run the same twelve steps'), tB = U.say(2, 'Now outcomes feed back'), p3 = U.cue(3), r;
      if (t < tB) { r = hubRun(c, U, t, DO, hubTimes(tA + 0.4, tA + 1.2, tA + 2.0, 0.8), 0.65); }
      else { r = hubRun(c, U, t, DF, hubTimes(tB + 0.3, tB + 1.0, tB + 1.7, 0.75), 0.6); }
      U.op(c.newLine, U.ramp(t, U.say(2, 'Change one line'), 0.8));
      var started = t >= tA + 0.4;
      U.setText(c.step, started ? 'step ' + Math.max(1, r.done + (r.cur >= 0 ? 1 : 0)) + ' of 12' : '');
      U.setText(c.fail, started ? r.fails + ' failed' : '');
      U.op(c.step, t < p3 ? 1 : 0); U.op(c.fail, t < p3 ? 1 : 0); U.op(c.sub, 0);
      U.op(c.cmp, U.ramp(t, p3 + 0.5, 0.8));
      U.op(c.rL, U.ramp(t, U.say(3, 'Set the rule beside'), 0.6)); U.op(c.pL, U.ramp(t, U.say(3, 'The hub is a pattern'), 0.6));
      if (!started) AG.forEach(function (a) { U.op(c.cnt[a], 0); });
    } });

  // =============================================================== 3. naming game
  var NG1 = naming(7, 15), NG2 = naming(10, 18);
  function landTimes(anchors, n) { // anchors: [[k, time when meeting k has landed]], linear between
    var out = [null]; for (var k = 1; k <= n; k++) { for (var j = 1; j < anchors.length; j++) { var a = anchors[j - 1], b = anchors[j]; if (k <= b[0]) { out.push(a[1] + (b[1] - a[1]) * (k - a[0]) / (b[0] - a[0])); break; } } }
    return out;
  }
  NCMA.scene({ id: 'naming-game', note: ILL, desc: 'Six agents on a hexagon, each with its list of known names printed beside it. Pairs meet one at a time and the speaker’s name travels to the hearer. Counters show the names in use and the meetings so far, and a row of squares fills in for each successful meeting. After three meetings K, L and M are in use, after fifteen every agent holds only M. A second run with a different order of meetings ends with every agent holding L after eighteen.',
    build: function (svg, U) {
      var c = { pos: {}, ag: {}, inv: {}, pl: {} };
      c.eg = U.g(svg); c.ng = U.g(svg); c.tg = U.g(svg);
      AG.forEach(function (a, i) { c.pos[a] = hex(460, 400, 250, i); });
      AG.forEach(function (a, i) { AG.forEach(function (b, j) { if (j > i) { var A = c.pos[a], B = c.pos[b]; var l = U.link(c.eg, { x: A[0], y: A[1], r: 44 }, { x: B[0], y: B[1], r: 44 }, {}); c.pl[a + b] = c.pl[b + a] = l; U.op(l, 0.12); } }); });
      AG.forEach(function (a) { var p = c.pos[a]; c.ag[a] = U.agent(c.ng, { x: p[0], y: p[1], r: 44, mark: a }); c.inv[a] = U.text(c.ng, p[0] + p[2] * 100, p[1] + p[3] * 100 + 12, '', 'word--lg', { 'text-anchor': 'middle' }); });
      c.tok = U.token(c.tg, 'evidence', { r: 20, label: '' }); c.tokLab = c.tok.querySelector('text');
      c.heads = U.g(svg);
      U.text(c.heads, 1000, 140, 'names in use', 'lab'); c.nNames = U.text(svg, 1000, 222, '', 'big');
      U.text(c.heads, 1330, 140, 'meetings', 'lab'); c.nMeet = U.text(svg, 1330, 222, '', 'big');
      U.text(c.heads, 1000, 300, 'each meeting, filled if it succeeds', 'lab');
      c.sq = []; for (var k = 0; k < 18; k++) c.sq.push(U.el('rect', { x: 1000 + k * 38, y: 322, width: 28, height: 28, rx: 4, 'class': 'box' }, svg));
      c.rules = U.lines(svg, 1000, 470, ['speaker says its newest name', 'hearer knows it: both keep only that name', 'hearer does not: adds it to its list'], 'cap', 48);
      c.fin = U.text(svg, 1000, 720, '', 'word--lg');
      return c;
    },
    draw: function (c, t, U) {
      var p1 = U.cue(1), r2 = U.say(2, 'Under a different order'), H, land, n;
      U.op(c.rules, U.ramp(t, U.say(0, 'They meet in pairs'), 0.8));
      if (t < r2) { H = NG1; n = 15; land = landTimes([[0, p1 + 0.4], [3, U.say(1, 'After three meetings') - 0.2], [10, U.say(1, 'After ten') - 0.2], [15, U.say(1, 'After fifteen meetings') - 0.2]], n); }
      else { H = NG2; n = 18; land = landTimes([[0, r2 + 0.2], [18, r2 + 6.5]], n); }
      var gap = (land[n] - land[1]) / Math.max(1, n - 1), d = Math.min(0.9, Math.max(0.35, gap * 0.75));
      var done = 0, cur = 0; for (var k = 1; k <= n; k++) { if (t >= land[k]) done = k; else if (t >= land[k] - d && !cur) cur = k; }
      var S = H[done];
      Object.keys(c.pl).forEach(function (k2) { U.cls(c.pl[k2], 'is-live', false); U.op(c.pl[k2], 0.12); });
      AG.forEach(function (a) { U.setText(c.inv[a], S.inv[a].join(' ')); U.cls(c.ag[a].g, 'is-on', false); U.cls(c.ag[a].g, 'is-A', false); });
      if (cur) { var m = H[cur], A = c.pos[m.sp], B = c.pos[m.hr]; U.cls(c.pl[m.sp + m.hr], 'is-live', true); U.op(c.pl[m.sp + m.hr], 1); U.cls(c.ag[m.sp].g, 'is-on', true); U.setText(c.tokLab, m.name); U.fly(c.tok, U.seg([A[0], A[1]], [B[0], B[1]], 50, 50), t, land[cur] - d, d, true); }
      else U.op(c.tok, 0);
      if (done && H[done].ok && t < land[done] + 0.6) { U.cls(c.ag[H[done].sp].g, 'is-A', true); U.cls(c.ag[H[done].hr].g, 'is-A', true); }
      var agreed = S.names.length === 1 && AG.every(function (a) { return S.inv[a].length === 1; });
      if (agreed) AG.forEach(function (a) { U.cls(c.ag[a].g, 'is-A', true); });
      var on = t >= p1;
      U.op(c.heads, U.ramp(t, p1, 0.6)); // the measures appear with their first values, never as empty headers
      U.setText(c.nNames, on ? String(S.names.length) : ''); U.setText(c.nMeet, on ? String(done) : '');
      c.sq.forEach(function (q, k2) { var vis = on && k2 < done; U.op(q, vis ? 1 : 0); q.setAttribute('class', vis && H[k2 + 1].ok ? 'bar--hi' : 'box'); });
      U.setText(c.fin, agreed ? 'every agent holds ' + S.names[0] + ' from meeting ' + done : ''); U.op(c.fin, agreed ? 1 : 0);
    } });

  // =============================================================== 4. conventions among language-model agents
  NCMA.scene({ id: 'llm-conventions', note: 'Reported finding · design and results as reported, no other values drawn', source: 'Flint Ashery, Aiello & Baronchelli, 2025', desc: 'A ring of 24 small agents stands for one population. Random pairs light up in turn and are joined by a line. Beside the ring, the design: 24 agents per population, four models, a name picked from a shared pool, a reward when the names match, a memory of the last five meetings. Then the results appear as text: a shared convention in every model, a collective bias that no agent showed alone, and a committed minority that could overturn the convention at 2% to 67% of the population depending on the model. Three agents on the ring turn amber as the committed minority, a schematic number, not a reported one.',
    build: function (svg, U) {
      var c = { P: [], ag: [] }; c.eg = U.g(svg); c.ng = U.g(svg);
      for (var i = 0; i < 24; i++) { var th = -Math.PI / 2 + i * Math.PI / 12; c.P.push([460 + 300 * Math.cos(th), 400 + 300 * Math.sin(th)]); }
      c.pairs = [[0, 9], [4, 15], [11, 20], [6, 18], [13, 2], [21, 8], [16, 3], [10, 23]];
      c.pl = c.pairs.map(function (p) { var l = U.link(c.eg, { x: c.P[p[0]][0], y: c.P[p[0]][1], r: 18 }, { x: c.P[p[1]][0], y: c.P[p[1]][1], r: 18 }, { cls: 'is-live' }); U.op(l, 0); return l; });
      c.P.forEach(function (p) { c.ag.push(U.agent(c.ng, { x: p[0], y: p[1], r: 17 })); });
      c.mid = U.text(svg, 460, 770, '', 'lab', { 'text-anchor': 'middle' });
      c.minor = [3, 11, 19]; // a few agents, not a reported proportion
      c.design = U.lines(svg, 1000, 140, ['24 agents per population, 4 models', 'random pairs pick a name from a pool', 'reward when the two names match', 'each remembers its last 5 meetings'], 'cap', 46);
      c.r1 = U.text(svg, 1000, 400, 'a shared convention in every model', 'word--lg'); c.r1.style.fill = 'var(--mint)';
      c.r2 = U.text(svg, 1000, 460, 'interaction created or amplified preferences', 'word--lg');
      c.r3 = U.text(svg, 1000, 580, 'a committed group could overturn it', 'word--lg'); c.r3.style.fill = 'var(--warm)';
      c.r4 = U.text(svg, 1000, 636, 'critical size 2% to 67% of the population,', 'cap');
      c.r5 = U.text(svg, 1000, 680, 'depending on the model', 'cap');
      return c;
    },
    draw: function (c, t, U) {
      var per = 2.6, k = Math.floor(Math.max(0, t - 1) / per) % c.pairs.length, ph = (Math.max(0, t - 1) % per) / per;
      c.pl.forEach(function (l, i) { U.op(l, i === k && t >= 1 ? (ph < 0.8 ? 1 : 0) : 0); });
      var conv = t >= U.say(1, 'In every model tested');
      c.ag.forEach(function (a, i) { var on = t >= 1 && (i === c.pairs[k][0] || i === c.pairs[k][1]) && ph < 0.8; U.cls(a.g, 'is-on', on && !conv); U.cls(a.g, 'is-A', conv); });
      var com = t >= U.say(2, 'A committed group');
      c.ag.forEach(function (a, i) { var nd = a.g.querySelector('.nd'), m = com && c.minor.indexOf(i) >= 0; if (m) U.cls(a.g, 'is-A', false); if (nd) { nd.style.stroke = m ? 'var(--warm)' : ''; nd.style.strokeWidth = m ? '5' : ''; } });
      U.setText(c.mid, t < 1 ? '' : com ? 'committed agents: never adapt' : conv ? 'one convention' : (k % 2 ? 'names differ: no reward' : 'names match: reward')); U.op(c.mid, ph < 0.8 || conv ? 1 : 0);
      c.mid.style.fill = com ? 'var(--warm)' : '';
      U.op(c.design, U.ramp(t, U.say(0, 'Each population used'), 0.8));
      U.op(c.r1, U.ramp(t, U.say(1, 'In every model tested'), 0.6)); U.op(c.r2, U.ramp(t, U.say(1, 'came to prefer some names'), 0.6));
      U.op(c.r3, U.ramp(t, U.say(2, 'A committed group'), 0.6)); U.op(c.r4, U.ramp(t, U.say(2, 'That size depended'), 0.6)); U.op(c.r5, U.ramp(t, U.say(2, 'That size depended'), 0.6));
    } });

  // =============================================================== 5. a new partner, and listening
  NCMA.scene({ id: 'new-partner', note: 'Reported findings · drawn schematically, no values drawn', source: 'Hu et al., 2020 · Lowe et al., 2019', desc: 'Two trained pairs, A1 with A2 and B1 with B2. Each sender sends the symbol 7 and its own partner picks the right one of three cards, marked works. Then A1 is paired with B2 across a dashed channel: B2 reads 7 in its own code, picks the wrong card, and the pairing is marked fails. Finally A1 sends an altered message to A2, and A2 picks the same card as before, marked same choice: message not used.',
    build: function (svg, U) {
      var c = {};
      c.A1 = U.agent(svg, { x: 300, y: 190, r: 50, mark: 'A1' }); c.A2 = U.agent(svg, { x: 760, y: 190, r: 50, mark: 'A2' });
      c.B1 = U.agent(svg, { x: 300, y: 570, r: 50, mark: 'B1' }); c.B2 = U.agent(svg, { x: 760, y: 570, r: 50, mark: 'B2' });
      c.la = U.link(svg, c.A1, c.A2, {}); c.lb = U.link(svg, c.B1, c.B2, {}); c.lx = U.link(svg, c.A1, c.B2, { cls: 'ln--dash' });
      c.ta = U.text(svg, 530, 150, 'trained together', 'lab', { 'text-anchor': 'middle' }); c.tb = U.text(svg, 530, 530, 'trained together', 'lab', { 'text-anchor': 'middle' });
      c.tx = U.text(svg, 600, 380, 'new partner', 'lab lab--warm');
      U.text(svg, 300, 112, 'their 7 means card 1', 'lab', { 'text-anchor': 'middle' }); U.text(svg, 300, 662, 'their 7 means card 3', 'lab', { 'text-anchor': 'middle' });
      function cards(y) { return [0, 1, 2].map(function (i) { return U.el('rect', { x: 900 + i * 86, y: y - 40, width: 60, height: 80, rx: 6, 'class': 'box' }, svg); }); }
      c.ca = cards(190); c.cb = cards(570);
      c.res = { A: U.text(svg, 1190, 200, '', 'word--lg'), B: U.text(svg, 1190, 580, '', 'word--lg') };
      c.m = { a: U.token(svg, 'evidence', { r: 20, label: '7' }), b: U.token(svg, 'evidence', { r: 20, label: '7' }), x: U.token(svg, 'evidence', { r: 20, label: '7' }), alt: U.token(svg, 'altered', { r: 20 }) };
      c.why = U.lines(svg, 1190, 270, ['message changed,', 'choice unchanged'], 'lab lab--warm', 32);
      return c;
    },
    draw: function (c, t, U) {
      var p1 = U.cue(1), p2 = U.cue(2), tA = U.say(0, 'Two pairs trained'), tB = tA + 2.8, tX = U.say(1, 'failed with every independently'), tI = U.say(2, 'Here the altered message');
      function pick(cs, k, cls) { cs.forEach(function (r, i) { r.setAttribute('class', i === k ? 'box ' + cls : 'box'); }); }
      var inter = t >= tI;
      U.fly(c.m.a, [[356, 190], [704, 190]], t, tA, 1.6, false);
      U.fly(c.m.b, [[356, 570], [704, 570]], t, tB, 1.6, false);
      U.fly(c.m.x, U.seg([300, 190], [760, 570], 56, 56), t, tX, 2, false);
      U.fly(c.m.alt, [[356, 190], [704, 190]], t, tI, 1.6, true);
      var crossOn = t >= p1;
      U.op(c.lx, crossOn ? U.ramp(t, p1, 0.8) : 0); U.op(c.tx, crossOn ? U.ramp(t, p1, 0.8) : 0);
      U.em(c.B1.g, crossOn && !inter ? 1 : 2); U.em(c.lb, crossOn && !inter ? 1 : 2);
      // pair A: correct card 0. pair B reads 7 as card 2. Cross: B2 reads A1's 7 as card 2, A1 meant card 0.
      var aDone = t >= tA + 1.6, bDone = t >= tB + 1.6, xDone = t >= tX + 2, iDone = t >= tI + 1.6;
      pick(c.ca, aDone ? 0 : -1, 'box--hi');
      pick(c.cb, xDone ? 2 : bDone ? 2 : -1, xDone ? 'box--alert' : 'box--hi');
      U.setText(c.res.A, iDone ? 'same choice' : aDone ? 'works' : ''); c.res.A.style.fill = iDone ? 'var(--warm)' : 'var(--mint)';
      U.setText(c.res.B, xDone ? 'fails' : bDone ? 'works' : ''); c.res.B.style.fill = xDone ? 'var(--alert)' : 'var(--mint)';
      U.op(c.why, iDone ? U.ramp(t, tI + 1.8, 0.6) : 0);
      U.cls(c.lx, 'is-live', t >= tX && t < tX + 2);
      U.cls(c.la, 'is-live', (t >= tA && t < tA + 1.6) || (t >= tI && t < tI + 1.6));
      U.cls(c.lb, 'is-live', t >= tB && t < tB + 1.6);
      U.em(c.B2.g, 2); U.op(c.ta, 1); U.op(c.tb, 1);
      if (t >= p2) { U.em(c.B1.g, 1); U.em(c.B2.g, 1); U.em(c.lb, 1); U.em(c.lx, 1); U.em(c.tx, 1); c.cb.forEach(function (r) { U.em(r, 1); }); U.em(c.res.B, 1); U.em(c.tb, 1); }
      else { [c.B2.g, c.lx, c.tx, c.res.B, c.tb].forEach(function (e) { U.em(e, 2); }); c.cb.forEach(function (r) { U.em(r, 2); }); }
    } });

  // =============================================================== 6. losing an agent
  var STAR = T.starA1;
  var RM = { none: runFault({ edges: STAR, rounds: 2 }), a2: runFault({ edges: STAR, rounds: 2, removed: ['a2'] }), a5: runFault({ edges: STAR, rounds: 2, removed: ['a5'] }), a1: runFault({ edges: STAR, rounds: 2, removed: ['a1'] }) };
  function panel(svg, U, x) {
    return { head: U.text(svg, x, 150, '', 'word--lg', { 'text-anchor': 'middle' }), tal: U.text(svg, x, 300, '', 'big', { 'text-anchor': 'middle' }), ro: U.text(svg, x, 370, '', 'cap', { 'text-anchor': 'middle' }) };
  }
  function showPanel(U, P, head, H, rc) {
    var tl = tally(H[rc]), ro = readout(H[rc]);
    U.setText(P.head, head); U.setText(P.tal, 'A ' + tl.A + '  ·  B ' + tl.B);
    U.setText(P.ro, ro === 'tie' ? 'the count is tied: no decision' : 'the count says ' + ro);
    U.cls(P.tal, 'big--hi', ro === 'A'); U.cls(P.tal, 'big--warm', ro !== 'A');
  }
  NCMA.scene({ id: 'lose-agent', note: ILL, desc: 'The six clue-holding agents joined as a star around the top agent, exchanging evidence for two rounds; all reach A. One agent is then removed at a time and the exchange rerun. Removing a weak leaf leaves five agents at A. Removing a strong leaf leaves five agents at B. Removing the hub leaves no channels: three weak agents stay at B, two strong agents at A, and the count says B. A summary names lost content and lost paths.',
    build: function (svg, U) {
      var c = six(svg, U, { cx: 470, cy: 400, R: 250, r: 40 }); c.id = 'lose';
      c.P = panel(svg, U, 1300);
      c.rem = U.text(svg, 0, 0, 'removed', 'lab lab--alert', { 'text-anchor': 'middle' });
      c.was = [U.text(svg, 1300, 450, 'before: weak leaf removed, all five at A', 'cap', { 'text-anchor': 'middle' }), U.text(svg, 1300, 500, 'before: strong leaf removed, all five at B', 'cap', { 'text-anchor': 'middle' })];
      c.was.forEach(function (e) { e.style.opacity = '0'; e.style.fill = 'var(--t2)'; });
      c.sum = U.lines(svg, 1000, 500, ['weak leaf removed: answer unchanged', 'strong leaf removed: content lost, B', 'hub removed: paths lost, no exchange'], 'cap', 54);
      return c;
    },
    draw: function (c, t, U) {
      var s1 = U.say(1, 'Remove a leaf that holds'), s2 = U.say(1, 'Remove instead'), s3 = U.say(2, 'Remove the hub'), p3 = U.cue(3);
      var key = t < s1 ? 'none' : t < s2 ? 'a2' : t < s3 ? 'a5' : 'a1', H = RM[key];
      var t0 = key === 'none' ? U.say(0, 'Intact') : (key === 'a2' ? s1 : key === 'a5' ? s2 : s3) + 1.4;
      hideAll(c, U);
      var removed = key === 'none' ? [] : [key];
      edges(c, U, STAR.filter(function (e) { return removed.indexOf(e[0]) < 0 && removed.indexOf(e[1]) < 0; }), STAR.filter(function (e) { return removed.indexOf(e[0]) >= 0 || removed.indexOf(e[1]) >= 0; }));
      var rc = play(c, U, H, t, [t0, t0 + 2.4], 1.8);
      apply(c, U, H, rc, removed);
      if (key !== 'none') { var p = c.pos[key]; if (key === 'a1') U.place(c.rem, p[0] + 130, p[1] - 20); else U.place(c.rem, p[0], p[1] + 76); U.op(c.rem, t < p3 ? 1 : 0.6); } else U.op(c.rem, 0);
      showPanel(U, c.P, { none: 'intact', a2: 'a weak leaf removed', a5: 'a strong leaf removed', a1: 'the hub removed' }[key], H, rc);
      var pOp = t < p3 ? 1 : 1 - U.ramp(t, p3, 0.6);
      [c.P.head, c.P.tal, c.P.ro].forEach(function (e) { U.op(e, pOp); });
      U.op(c.was[0], key === 'a5' || key === 'a1' ? pOp : 0); U.op(c.was[1], key === 'a1' ? pOp : 0);
      U.op(c.sum, U.ramp(t, p3 + 0.4, 0.8));
    } });

  // =============================================================== 7. cutting a link
  var CL = T.clusters;
  var CU = { none: runFault({ edges: CL, rounds: 3 }), red: runFault({ edges: CL, rounds: 3, cutLinks: [['a4', 'a1']] }), bridge: runFault({ edges: CL, rounds: 3, cutLinks: [['a2', 'a5']] }) };
  NCMA.scene({ id: 'cut-link', note: ILL, desc: 'The six agents in two clusters of three, an upper and a lower triangle, joined by one link on the right. With evidence exchange for three rounds all reach A. A link inside the upper cluster is cut and all still reach A. The joining link, the bridge, is cut instead: the upper cluster settles on B and the lower on A, and the count is tied three to three.',
    build: function (svg, U) {
      var c = six(svg, U, { cx: 470, cy: 400, R: 250, r: 40 }); c.id = 'cut';
      c.P = panel(svg, U, 1300);
      c.x = U.token(svg, 'lost', { r: 18 }); c.xl = U.text(svg, 0, 0, '', 'lab lab--warm', { 'text-anchor': 'middle' });
      c.br = U.text(svg, 0, 0, 'bridge', 'lab lab--hi', { 'text-anchor': 'start' });
      c.was = U.text(svg, 1300, 450, 'before: redundant link cut, all six at A', 'cap', { 'text-anchor': 'middle' }); c.was.style.fill = 'var(--t2)';
      c.lesson = U.lines(svg, 1000, 520, ['a bridge is the only path', 'between two parts of a network'], 'cap', 44);
      return c;
    },
    draw: function (c, t, U) {
      var s1 = U.say(1, 'Cut a link inside'), s2 = U.say(1, 'Now cut the link between'), p2 = U.cue(2);
      var key = t < s1 ? 'none' : t < s2 ? 'red' : 'bridge', H = CU[key];
      var t0 = key === 'none' ? U.say(0, 'Intact') : (key === 'red' ? s1 : s2) + 1.4;
      var cut = key === 'red' ? [['a4', 'a1']] : key === 'bridge' ? [['a2', 'a5']] : [];
      hideAll(c, U);
      edges(c, U, CL.filter(function (e) { return !cut.some(function (k) { return (k[0] === e[0] && k[1] === e[1]) || (k[0] === e[1] && k[1] === e[0]); }); }), cut);
      var rc = play(c, U, H, t, [t0, t0 + 2, t0 + 4], 1.5);
      apply(c, U, H, rc, []);
      if (cut.length) { var A = c.pos[cut[0][0]], B = c.pos[cut[0][1]], mx = (A[0] + B[0]) / 2, my = (A[1] + B[1]) / 2; U.place(c.x, mx, my); U.op(c.x, 1); U.place(c.xl, key === 'red' ? 250 : mx + 140, key === 'red' ? 168 : my + 8); U.setText(c.xl, key === 'red' ? 'redundant link cut' : 'bridge cut'); U.op(c.xl, 1); }
      else { U.op(c.x, 0); U.op(c.xl, 0); }
      var a2 = c.pos.a2, a5 = c.pos.a5; U.place(c.br, (a2[0] + a5[0]) / 2 + 30, (a2[1] + a5[1]) / 2 + 8); U.op(c.br, key === 'none' ? U.ramp(t, 2, 0.8) : 0);
      showPanel(U, c.P, { none: 'intact', red: 'a redundant link cut', bridge: 'the bridge cut' }[key], H, rc);
      U.op(c.was, key === 'bridge' && t < p2 ? 1 : 0);
      U.op(c.lesson, U.ramp(t, p2 + 0.5, 0.8));
    } });

  // =============================================================== 8. an inconsistent relay
  var FAULT = { agent: 'a1', strip: ['a5', 'a6'], to: ['a4', 'a5', 'a6'] };
  var BZ = { star: runFault({ edges: STAR, rounds: 2, faulty: FAULT }), full: runFault({ edges: T.complete, rounds: 2, faulty: FAULT }) };
  NCMA.scene({ id: 'two-faced-relay', note: ILL, source: 'Lamport, Shostak & Pease, 1982', desc: 'The star with its hub outlined in red as faulty. In the second round the hub sends full sets of clues to two leaves and altered sets, marked with a bar, to the other three, including both strong agents. The group ends three at A and three at B. In a fully connected network with the same faulty hub, every agent reaches A after one round. Two labeled lines then state the conditions of the Byzantine result: under oral-message assumptions, where the sender controls the content, more than two-thirds must be loyal, and under signed-message assumptions, with signatures a relay cannot forge, any number may be faulty. A third line notes that this relay only omits evidence and runs no agreement protocol.',
    build: function (svg, U) {
      var c = six(svg, U, { cx: 470, cy: 400, R: 250, r: 40 }); c.id = 'bz';
      var p = c.pos.a1; c.ring = ringBad(c.nodes, U, p[0], p[1], 54);
      c.fl = U.text(svg, p[0] + 70, p[1] - 30, 'faulty relay', 'lab lab--alert');
      c.P = panel(svg, U, 1300);
      c.lam = U.g(svg);
      U.text(c.lam, 990, 480, 'oral messages: the sender controls the content', 'lab');
      U.text(c.lam, 990, 526, 'agreement needs more than two-thirds loyal', 'cap');
      U.text(c.lam, 990, 610, 'signed messages: signatures cannot be forged', 'lab');
      U.text(c.lam, 990, 656, 'agreement with any number faulty', 'cap');
      U.text(c.lam, 990, 740, 'this relay only omits: no agreement protocol is run', 'lab lab--warm');
      return c;
    },
    draw: function (c, t, U) {
      var tf = U.say(2, 'Put the same faulty hub'), full = t >= tf, H = full ? BZ.full : BZ.star;
      hideAll(c, U);
      edges(c, U, full ? T.complete : STAR);
      var starts = full ? [tf + 1.2, tf + 3.6] : [U.say(0, 'Let the hub relay'), U.say(1, 'After two rounds') - 2];
      var rc = play(c, U, H, t, starts, 1.8);
      apply(c, U, H, rc, []);
      showPanel(U, c.P, full ? 'fully connected, same fault' : 'star, faulty hub', H, rc);
      var p3 = U.cue(3); [c.P.head, c.P.tal, c.P.ro].forEach(function (e) { U.op(e, 1); });
      U.op(c.lam, U.ramp(t, U.say(3, 'Under their communication assumptions'), 0.8));
    } });

  // =============================================================== 9. faulty agents, measured
  NCMA.scene({ id: 'faults-measured', note: 'Reported finding · values as reported in the abstract', source: 'Huang et al., 2025', desc: 'Three columns of three agents: a chain, a flat group with two-way links, and a hierarchy in which one agent directs two that talk to each other, each labeled two existing systems. An altered message travels in each. Under the hierarchy appears smallest drop, 5.5%, and under the chain and the flat group together, larger drops. Inspector agents then appear beside each structure with the line an added inspector recovered up to 96.4% of errors. A line notes that each structure arrives bundled with its systems’ roles, prompts and procedures.',
    build: function (svg, U) {
      var c = { cols: [] }, X = [300, 884, 1468];
      ['chain', 'flat', 'hierarchy'].forEach(function (name, i) {
        var g = U.g(svg), x = X[i], P;
        U.text(g, x, 70, name, 'word--lg', { 'text-anchor': 'middle' });
        P = i < 2 ? [[x - 150, 290], [x, 290], [x + 150, 290]] : [[x, 200], [x - 120, 360], [x + 120, 360]];
        var A = P.map(function (p) { return U.agent(g, { x: p[0], y: p[1], r: 34 }); });
        var L = i === 0 ? [U.link(g, A[0], A[1], { arrow: true }), U.link(g, A[1], A[2], { arrow: true })]
          : i === 1 ? [U.link(g, A[0], A[1], {}), U.link(g, A[1], A[2], {})]
          : [U.link(g, A[0], A[1], { arrow: true }), U.link(g, A[0], A[2], { arrow: true }), U.link(g, A[1], A[2], {})];
        U.text(g, x, 460, 'two existing systems', 'lab', { 'text-anchor': 'middle' });
        var bad = i === 2 ? 0 : 1, to = i === 2 ? 1 : 2;
        var tk = U.token(svg, 'altered', { r: 16 }), ins = U.agent(svg, { x: x + (i === 2 ? 190 : 0), y: i === 2 ? 200 : 170, r: 24, mark: 'i' });
        c.cols.push({ g: g, A: A, L: L, tk: tk, pts: U.seg(P[bad], P[to], 40, 40), bad: A[bad], ins: ins });
      });
      c.bundle = U.text(svg, 884, 520, 'each structure came bundled with its systems’ roles, prompts and procedures', 'lab lab--warm', { 'text-anchor': 'middle' });
      // the comparison in words on its referents; the two larger drops stay in the passage, unassigned as the source leaves them
      c.v1 = U.text(svg, 1468, 620, 'smallest drop, 5.5%', 'word--lg', { 'text-anchor': 'middle' }); c.v1.style.fill = 'var(--mint)';
      c.v2 = U.text(svg, 592, 620, 'larger drops', 'word--lg', { 'text-anchor': 'middle' }); c.v2.style.fill = 'var(--warm)';
      c.insl = U.text(svg, 884, 730, 'an added inspector recovered up to 96.4% of errors', 'word--lg', { 'text-anchor': 'middle' }); c.insl.style.fill = 'var(--mint)';
      return c;
    },
    draw: function (c, t, U) {
      var te = U.say(0, 'made some agents faulty'), ti = U.say(1, 'Adding an inspector'), p2 = U.cue(2);
      c.cols.forEach(function (k, i) {
        U.cls(k.bad.g, 'is-bad', t >= te);
        var per = 3.2, ph = t >= te ? ((t - te) % per) : -1;
        if (ph >= 0) U.fly(k.tk, k.pts, ph, 0.2 + i * 0.25, 1.4, false); else U.op(k.tk, 0);
        U.op(k.ins.g, U.ramp(t, ti + i * 0.3, 0.6));
      });
      U.op(c.v1, U.ramp(t, U.say(1, 'The hierarchical systems showed'), 0.6));
      U.op(c.v2, U.ramp(t, U.say(1, 'The other two structures'), 0.6));
      U.op(c.insl, U.ramp(t, ti + 0.6, 0.6));
      U.op(c.bundle, U.ramp(t, U.say(2, 'Each structure was represented'), 0.8));
    } });

  // =============================================================== 10. density both ways
  var FAB = { agent: 'a4', id: 'x', weight: -4 };
  var DN = { dense: runFault({ edges: T.complete, rounds: 1 }), ring: runFault({ edges: T.ring, rounds: 1 }), denseX: runFault({ edges: T.complete, rounds: 1, fabricate: FAB }), ringX: runFault({ edges: T.ring, rounds: 3, fabricate: FAB }) };
  NCMA.scene({ id: 'density-both-ways', note: ILL, source: 'Li et al., 2024 · Yu et al., 2025', desc: 'Two copies of the six agents: fully connected on the left, a ring on the right. Without an attacker, one round brings all six to A on the left and five of six on the right. One agent, outlined in red, then adds a fabricated clue drawn as a diamond. On the left it reaches everyone in one round and all switch to B. On the right only the attacker’s two neighbors hold it after one round and the count is tied; two more rounds carry it to everyone and all six judge B.',
    build: function (svg, U) {
      var c = { L: six(svg, U, { cx: 430, cy: 400, R: 200, r: 34 }), R: six(svg, U, { cx: 1330, cy: 400, R: 200, r: 34 }) };
      c.L.id = 'dL'; c.R.id = 'dR';
      [['L', 'fully connected'], ['R', 'ring']].forEach(function (s) {
        var k = c[s[0]], x = s[0] === 'L' ? 430 : 1330;
        k.title = U.text(svg, x, 40, s[1], 'word--lg', { 'text-anchor': 'middle' });
        k.tal = U.text(svg, x, 790, '', 'word--lg', { 'text-anchor': 'middle' });
        var p = k.pos.a4; k.ring = ringBad(k.nodes, U, p[0], p[1], 47);
        k.fake = {}; M.SIX.agents.forEach(function (a) { var q = k.pos[a], tk = U.token(k.nodes, 'introduced', { r: 10 }); U.place(tk, q[0] - q[2] * 62, q[1] - q[3] * 62); k.fake[a] = tk; });
      });
      c.cap = U.text(svg, 884, 400, '', 'cap', { 'text-anchor': 'middle' });
      return c;
    },
    draw: function (c, t, U) {
      var tN = U.say(1, 'Without an attacker'), tNr = U.say(1, 'In a ring'), tX = U.say(2, 'Now let one agent'), tXd = U.say(2, 'In the fully connected network the fake'), tXr = U.say(2, 'In the ring, after one round'), tR = U.say(3, 'Run the ring');
      var att = t >= tX;
      [['L', att ? DN.denseX : DN.dense, T.complete, att ? [tXd] : [tN]], ['R', att ? DN.ringX : DN.ring, T.ring, att ? [tXr, tR + 0.4, tR + 2.6] : [tNr]]].forEach(function (s) {
        var k = c[s[0]], H = s[1];
        hideAll(k, U); edges(k, U, s[2]);
        var rc = play(k, U, H, t, s[3], 1.6);
        apply(k, U, H, rc, []);
        var tl = tally(H[rc]), ro = readout(H[rc]);
        U.setText(k.tal, 'A ' + tl.A + '  ·  B ' + tl.B + (ro === 'tie' ? '  ·  tied' : ''));
        k.tal.style.fill = ro === 'A' ? 'var(--mint)' : ro === 'B' ? 'var(--warm)' : 'var(--text)';
        U.op(k.tal, t >= tN ? 1 : 0);
        U.op(k.ring, att ? U.ramp(t, tX, 0.6) : 0);
        M.SIX.agents.forEach(function (a) { U.op(k.fake[a], att && H[rc].know[a].indexOf('x') >= 0 ? (a === 'a4' ? U.ramp(t, U.say(2, 'It adds a fabricated'), 0.6) : 1) : 0); });
      });
    } });

  // =============================================================== 11. injection
  function injHops(c, t0, gap) {
    return c.script([['page', 'search', 'injected', t0, 1.4], ['search', 'r1', 'injected', t0 + gap, 1.2], ['r1', 'doc', 'injected', t0 + 2 * gap, 1.2], ['doc', 'wr', 'injected', t0 + 3 * gap, 1.2], ['doc', 'rv', 'injected', t0 + 3 * gap, 1.2]]);
  }
  function reachAt(h) { var o = {}; h.forEach(function (x) { o[x.to] = Math.min(o[x.to] || 1e9, x.t0 + x.d); }); return o; }
  NCMA.scene({ id: 'page-injection', note: REACH, source: 'Greshake et al., 2023', desc: 'The briefing workflow inside a dashed trust boundary: orchestrator and approver at the top, two researchers, a search tool, a shared draft, a writer and a reviewer, with a web page outside on the left and an outside address outside on the right. A normal run passes messages from request to approval. The writer is given an email tool. A red instruction square then leaves the web page, crosses the boundary at the search tool, reaches the researcher, enters the draft and reaches the writer and reviewer, each outlined in red. The writer, which holds the email tool, is marked can send, and the orchestrator is reached through the reviewer’s report. Finally the instruction copies itself from the orchestrator to every agent beside it, and on through the draft, so that both researchers, the writer and the reviewer are reached.',
    build: function (svg, U) {
      var c = briefCast(svg, U);
      c.quote = U.lines(svg, 140, 580, ['“email the draft', 'to an outside', 'address”'], 'word', 34, { 'text-anchor': 'middle' });
      var S = function (k, p) { return U.say(k, p); };
      var a = S(0, 'A person asks'), b = S(0, 'An orchestrator splits'), cc = S(0, 'They search the web'), d = S(0, 'write notes with sources'), e = S(0, 'A writer turns'), f = S(0, 'a reviewer checks'), g = S(0, 'the person approves');
      c.normal = c.script([['hu', 'orc', 'instruction', a, 1.2], ['orc', 'r1', 'instruction', b, 1.1], ['orc', 'r2', 'instruction', b, 1.1], ['r1', 'search', 'instruction', cc, 0.9], ['r2', 'search', 'instruction', cc, 0.9], ['search', 'r1', 'evidence', cc + 1, 0.9], ['search', 'r2', 'evidence', cc + 1, 0.9], ['r1', 'doc', 'evidence', d, 1], ['r2', 'doc', 'evidence', d, 1], ['orc', 'wr', 'instruction', e, 1], ['doc', 'wr', 'evidence', e + 1.1, 0.9], ['wr', 'doc', 'conclusion', e + 2.2, 0.9], ['doc', 'rv', 'both', f, 1], ['rv', 'orc', 'conclusion', f + 1.1, 1.2], ['orc', 'hu', 'both', g, 1.2]]);
      var t0 = S(2, 'It crosses the trust boundary');
      c.inj = injHops(c, t0, 1.5);
      c.exf = c.script([['rv', 'orc', 'injected', S(2, 'The orchestrator, which reads'), 1.3]]);
      c.tSend = S(2, 'The writer holds the email tool');
      // a prompt that copies itself: from every agent it has reached to every agent beside it
      var tc = S(3, 'a malicious prompt copied itself');
      c.copy = c.script([['orc', 'r1', 'injected', tc, 1.1], ['orc', 'r2', 'injected', tc, 1.1], ['orc', 'wr', 'injected', tc, 1.1], ['orc', 'rv', 'injected', tc, 1.1],
        ['r2', 'doc', 'injected', tc + 1.4, 1], ['r1', 'doc', 'injected', tc + 1.4, 1], ['doc', 'wr', 'injected', tc + 2.5, 1], ['doc', 'rv', 'injected', tc + 2.5, 1]]);
      c.tc = tc;
      c.reach = reachAt(c.inj.concat(c.exf, c.copy));
      c.cross = U.text(svg, 290, 390, 'crosses here', 'lab lab--alert', { 'text-anchor': 'middle' });
      c.sent = U.text(svg, 1120, 424, 'can send', 'lab lab--alert', { 'text-anchor': 'middle' });
      c.rep = U.text(svg, 880, 735, 'a prompt that copies itself to every agent it reaches', 'lab lab--alert', { 'text-anchor': 'middle' });
      return c;
    },
    draw: function (c, t, U) {
      c.reset();
      U.op(c.L.husend, 0);
      U.op(c.A.send.g, U.ramp(t, U.say(0, 'In this version'), 0.8)); U.op(c.L.wrsend, U.ramp(t, U.say(0, 'In this version'), 0.8) * 0.5);
      U.op(c.zone, U.ramp(t, U.cue(1), 0.8)); U.op(c.zoneLab, U.ramp(t, U.cue(1), 0.8));
      ['page', 'out'].forEach(function (id) { U.op(c.A[id].g, U.ramp(t, U.cue(1), 0.8)); });
      U.op(c.L.pagesearch, 0.35 * U.ramp(t, U.cue(1), 0.8)); U.op(c.L.sendout, 0.35 * U.ramp(t, U.cue(1), 0.8));
      c.toks.forEach(function (tk) { U.op(tk, 0); });
      c.run(U, t, c.normal, false);
      U.op(c.quote, U.ramp(t, U.say(1, 'email the draft'), 0.8));
      // tokens vanish on landing: the red outline is the mark of an agent the instruction has reached
      c.run(U, t, c.inj, false); c.run(U, t, c.exf, false); c.run(U, t, c.copy, false);
      Object.keys(c.reach).forEach(function (id) { if (t >= c.reach[id]) U.cls(c.A[id].g, 'is-bad', true); });
      U.cls(c.A.search.g, 'is-bad', false);
      U.op(c.cross, t >= c.inj[0].t0 + 0.6 ? 1 : 0);
      var canSend = t >= c.tSend && t >= c.reach.wr; U.cls(c.L.wrsend, 'is-bad', canSend); if (canSend) U.op(c.L.wrsend, 1);
      U.op(c.sent, canSend ? U.ramp(t, c.tSend, 0.6) : 0);
      U.op(c.rep, U.ramp(t, c.tc + 0.4, 0.6));
    } });

  // =============================================================== 12. privilege boundary
  NCMA.scene({ id: 'privilege-boundary', note: REACH, desc: 'The same workflow. The writer’s link to the email tool turns dashed and the tool is linked through the approver to the orchestrator. The reviewer’s link to the orchestrator is marked typed fields. The red instruction square again crosses the boundary and reaches the researcher, the draft, the writer and the reviewer. The writer’s request to use the email tool stops halfway, marked refused. A plain verdict disc travels from reviewer to orchestrator, which stays unmarked. Finally the typed-fields link is marked as the assumption and an altered message flows from writer to draft, marked content can still be distorted.',
    build: function (svg, U) {
      var c = briefCast(svg, U);
      var S = function (k, p) { return U.say(k, p); };
      c.inj = injHops(c, S(1, 'Replay the attack') + 0.6, 1.2);
      var tw = S(1, 'When the writer asks');
      c.ask = U.token(c.tg, 'injected', { r: 16 }); c.askPts = [c.seg('wr', 'send')[0], [(BP.wr[0] + BP.send[0]) / 2 + 10, (BP.wr[1] + BP.send[1]) / 2]]; c.tw = tw;
      c.deny = U.text(svg, 1240, 340, 'refused', 'lab lab--alert', { 'text-anchor': 'middle' });
      c.verdict = c.script([['rv', 'orc', 'conclusion', S(1, 'The only agent that can send'), 1.3]]);
      c.fields = U.text(svg, 970, 360, 'typed fields', 'lab lab--hi', { 'text-anchor': 'end' });
      c.dist = c.script([['wr', 'doc', 'altered', S(2, 'The writer also remains exposed') + 0.4, 1.2]]);
      c.assum = U.text(svg, 884, 706, 'assumption: typed fields carry no instruction', 'lab lab--warm', { 'text-anchor': 'middle' });
      c.distL = U.text(svg, 884, 742, 'what the briefing says can still be distorted', 'lab lab--warm', { 'text-anchor': 'middle' });
      c.reach = reachAt(c.inj);
      return c;
    },
    draw: function (c, t, U) {
      c.reset(); c.toks.forEach(function (tk) { U.op(tk, 0); });
      var tm = U.say(0, 'Permission to use the email tool moves');
      var moved = U.ramp(t, tm, 0.8);
      U.op(c.L.wrsend, 0.35 + 0.35 * moved); U.cls(c.L.wrsend, 'is-cut', t >= tm);
      U.op(c.L.husend, 0.35 + 0.65 * moved); U.op(c.L.orchu, 0.35 + 0.65 * moved);
      U.cls(c.L.husend, 'is-live', t >= tm && t < U.cue(1)); U.cls(c.L.orchu, 'is-live', t >= tm && t < U.cue(1));
      var tf = U.say(0, 'only as typed fields');
      U.op(c.fields, U.ramp(t, tf, 0.6)); c.L.rvorc.style.strokeDasharray = t >= tf ? '3 7' : '';
      c.run(U, t, c.inj, false);
      Object.keys(c.reach).forEach(function (id) { if (t >= c.reach[id]) U.cls(c.A[id].g, 'is-bad', true); });
      U.cls(c.A.search.g, 'is-bad', false);
      U.fly(c.ask, c.askPts, t, c.tw + 0.6, 1, true); U.op(c.deny, t >= c.tw + 1.6 ? 1 : 0);
      if (t >= c.tw + 1.6) U.cls(c.L.wrsend, 'is-bad', true);
      c.run(U, t, c.verdict, true);
      U.cls(c.A.orc.g, 'is-on', t >= c.verdict[0].t0 + c.verdict[0].d && t < U.cue(2));
      var p2 = U.cue(2);
      U.op(c.assum, U.ramp(t, U.say(2, 'It assumes that typed fields'), 0.6));
      if (t >= U.say(2, 'It assumes that typed fields')) { c.L.rvorc.style.stroke = 'var(--warm)'; U.op(c.L.rvorc, 1); } else { c.L.rvorc.style.stroke = ''; U.op(c.L.rvorc, 0.35); }
      c.run(U, t, c.dist, true); U.op(c.distL, U.ramp(t, c.dist[0].t0 + 1.2, 0.6));
      if (t < p2) U.op(c.assum, 0);
    } });

  // =============================================================== 13. out of order
  NCMA.scene({ id: 'out-of-order', note: ILL, source: 'Lamport, 1978', desc: 'Researcher 1 on the left, the shared draft as a large box on the right. A note, numbered 1, says since 2019; a correction, numbered 2, says 2021. The note stalls in transit and the correction overtakes it. The draft drops the correction and then stores 2019. Labels read sent 1 then 2, arrived 2 then 1. Replayed with the correction linked to the note, the draft holds the correction until the note arrives and ends at 2021. Researcher 2 then sends an unrelated note at the same moment, marked concurrent.',
    build: function (svg0, U) {
      var c = {}, svg = U.g(svg0, null, { transform: 'translate(0,50)' });
      c.r1 = U.agent(svg, { x: 240, y: 330, r: 56, label: 'researcher 1' });
      c.r2 = U.agent(svg, { x: 240, y: 640, r: 50, label: 'researcher 2', ly: 90 });
      c.box = U.el('rect', { x: 1100, y: 140, width: 600, height: 420, rx: 10, 'class': 'box' }, svg);
      U.text(svg, 1130, 190, 'shared draft', 'lab');
      c.val = U.text(svg, 1400, 320, '', 'word--lg', { 'text-anchor': 'middle' });
      c.stat = U.text(svg, 1400, 400, '', 'lab', { 'text-anchor': 'middle' });
      c.drop = U.text(svg, 1400, 470, 'correction 2 came first: dropped', 'lab lab--warm', { 'text-anchor': 'middle' });
      c.ch = U.el('line', { x1: 300, y1: 330, x2: 1096, y2: 330, 'class': 'ln' }, svg);
      c.ch2 = U.el('line', { x1: 294, y1: 640, x2: 1096, y2: 500, 'class': 'ln' }, svg);
      function msg(kind, lab, sub) { var g = U.token(svg, kind, { r: 22, label: lab }); U.text(g, 0, 56, sub, 'lab', { 'text-anchor': 'middle' }); return g; }
      c.n1 = msg('evidence', '1', 'note: since 2019'); c.n2 = msg('instruction', '2', 'correction: 2021');
      c.m1 = msg('evidence', '1', 'note: since 2019'); c.m2 = msg('instruction', '2', 'after 1: 2021');
      c.n3 = msg('evidence', '3', '');
      c.sent = U.text(svg, 680, 220, 'sent: 1, then 2', 'lab', { 'text-anchor': 'middle' });
      c.arr = U.text(svg, 680, 460, 'arrived: 2, then 1', 'lab lab--warm', { 'text-anchor': 'middle' });
      c.conc = U.text(svg, 680, 690, 'no link to 1 or 2: concurrent', 'lab lab--warm', { 'text-anchor': 'middle' });
      return c;
    },
    draw: function (c, t, U) {
      var s1 = U.say(0, 'Researcher 1 writes a note'), s2 = U.say(0, 'sends a correction'), rp = U.say(2, 'Give each message a link');
      var a2 = U.say(1, 'The correction comes first'), a1 = U.say(1, 'Then the note arrives');
      var replay = t >= rp;
      // a message that leaves at t0, reaches xs by t0+1.2, waits, and resumes so as to land at tl
      function move(tok, t0, xs, tl, fadeAt) {
        if (t < t0 || t > fadeAt + 0.6) { U.op(tok, 0); return; }
        var x = t < t0 + 1.2 ? 300 + (xs - 300) * U.ramp(t, t0, 1.2) : t < tl - 1.2 ? xs : xs + (1078 - xs) * U.ramp(t, tl - 1.2, 1.2);
        U.place(tok, x, 330); U.op(tok, t > fadeAt ? 1 - (t - fadeAt) / 0.6 : 1);
      }
      if (!replay) {
        move(c.n1, s1, 620, a1, a1 + 0.4);
        move(c.n2, s2, 960, a2, a2 + 0.4);
        U.op(c.m1, 0); U.op(c.m2, 0);
        U.setText(c.val, t >= a1 ? 'District 4: since 2019' : ''); c.val.style.fill = 'var(--warm)';
        U.setText(c.stat, t >= a1 ? 'stored note 1' : t >= a2 ? 'nothing to correct' : '');
        U.op(c.drop, U.ramp(t, a2, 0.4));
      } else {
        U.op(c.n1, 0); U.op(c.n2, 0); U.op(c.drop, 0);
        var r0 = rp + 0.4, b2 = r0 + 2.2, b1 = r0 + 4.6;
        move(c.m1, r0, 620, b1, b1 + 0.4);
        move(c.m2, r0 + 0.6, 960, b2, b1 + 0.4);
        U.setText(c.val, t >= b1 ? 'District 4: since 2021' : ''); c.val.style.fill = 'var(--mint)';
        U.setText(c.stat, t >= b1 ? 'applied 1, then 2' : t >= b2 ? 'holding 2 until 1 arrives' : '');
      }
      U.op(c.sent, U.ramp(t, s2, 0.6) * (replay ? 0.4 : 1));
      U.op(c.arr, !replay && t >= a1 ? 1 : 0);
      var t3 = U.say(3, 'Researcher 2 sends a note'); U.op(c.r2.g, U.ramp(t, t3 - 1, 0.6)); U.op(c.ch2, U.ramp(t, t3 - 1, 0.6) * 0.8);
      U.fly(c.n3, [[294, 640], [1078, 504]], t, t3, 2.2, true); U.op(c.conc, U.ramp(t, U.say(3, 'The two are concurrent'), 0.6));
    } });

  // =============================================================== 14. slow worker
  function noteBars(svg, U, c) {
    var g = U.g(svg), d = BP.doc, bars = [];
    for (var i = 0; i < 7; i++) bars.push(U.el('rect', { x: d[0] - 30, y: d[1] - 44 + i * 13, width: 56, height: 8, rx: 2, 'class': i < 4 ? 'bar--hi' : 'bar--warm' }, g));
    return bars;
  }
  NCMA.scene({ id: 'slow-worker', note: ILL, desc: 'The briefing workflow, with a step counter below the draft. Researcher 2’s search gets no response, a lost-message cross appears, and the call is sent again at step 5. Researcher 1’s four notes appear in the draft as bars. At step 6 the orchestrator dispatches the writer. At step 7 Researcher 2’s three notes arrive as the writer reads, and the writer is marked sees 4 of 7 notes. The run ends at step 11 with sub-task 2 missing. A replay with a barrier shows both researchers reporting done, dispatch at step 8, and the writer seeing all 7 notes; the run ends at step 13.',
    build: function (svg, U) {
      var c = briefCast(svg, U);
      ['page', 'out', 'send'].forEach(function (id) { U.op(c.A[id].g, 0); });
      ['pagesearch', 'sendout', 'wrsend', 'husend'].forEach(function (k) { U.op(c.L[k], 0); });
      U.op(c.zone, 0); U.op(c.zoneLab, 0);
      c.bars = noteBars(svg, U, c);
      c.lost = U.token(svg, 'lost', { r: 16 }); var s = c.seg('r2', 'search'); U.place(c.lost, (s[0][0] + s[1][0]) / 2, (s[0][1] + s[1][1]) / 2);
      c.to1 = U.text(svg, 380, 560, 'no response: timeout', 'lab lab--warm', { 'text-anchor': 'middle' });
      c.to2 = U.text(svg, 380, 600, 'call sent again at step 5', 'lab lab--warm', { 'text-anchor': 'middle' });
      c.step = U.text(svg, 884, 730, '', 'big', { 'text-anchor': 'middle' });
      c.endL = U.text(svg, 884, 785, '', 'lab lab--warm', { 'text-anchor': 'middle' });
      c.sees = U.text(svg, 1186, 318, '', 'lab', { 'text-anchor': 'start' });
      c.bar = U.text(svg, 820, 198, 'waits for both reports', 'lab lab--hi', { 'text-anchor': 'end' });
      c.slow = U.text(svg, 820, 198, 'inherits the slowest worker’s delay', 'lab lab--warm', { 'text-anchor': 'end' });
      var S = function (k, p) { return U.say(k, p); };
      // run without a barrier (passages 0 and 1)
      var A = { 1: U.cue(0) + 0.6, 2: U.cue(0) + 2, 3: S(0, 'search call gets no response') - 0.4, 4: S(0, 'records a timeout'), 5: S(0, 'sends the same call again'), w1: S(0, 'Meanwhile Researcher 1'), 6: S(1, 'The orchestrator dispatches'), 7: S(1, 'At step 7') };
      A[8] = S(1, 'The reviewer finds'); A[9] = A[8] + 1.1; A[10] = A[8] + 2.2; A[11] = A[8] + 3.3;
      c.A1 = A;
      c.runA = c.script([['hu', 'orc', 'instruction', A[1], 1], ['orc', 'r1', 'instruction', A[2], 1], ['orc', 'r2', 'instruction', A[2], 1],
        ['r1', 'search', 'instruction', A[3], 0.9], ['r2', 'search', 'instruction', A[3], 0.9], ['search', 'r1', 'evidence', A[4], 0.9],
        ['r1', 'doc', 'evidence', A.w1, 1, '4'], ['r2', 'search', 'instruction', A[5], 0.9], ['search', 'r2', 'evidence', A[6], 0.9],
        ['orc', 'wr', 'instruction', A[6], 1.1], ['r2', 'doc', 'evidence', A[7], 1, '3'], ['doc', 'wr', 'evidence', A[7], 1, '4'],
        ['wr', 'doc', 'conclusion', A[8], 0.9], ['doc', 'rv', 'both', A[9], 0.9], ['rv', 'orc', 'conclusion', A[10], 1], ['orc', 'hu', 'both', A[11], 1.1]]);
      // replay with a barrier (passage 2), from step 5
      var b = S(2, 'Each researcher reports'), B = {}; for (var k = 5; k <= 9; k++) B[k] = b + 0.3 + (k - 5) * 1.8;
      c.B = B; c.b0 = S(2, 'A barrier removes the race') + 0.5;
      c.runB = c.script([['r1', 'doc', 'evidence', B[5], 0.9, '4'], ['r1', 'orc', 'conclusion', B[5] + 0.5, 1.1], ['r2', 'search', 'instruction', B[5], 0.9], ['search', 'r2', 'evidence', B[6], 0.9],
        ['r2', 'doc', 'evidence', B[7], 0.9, '3'], ['r2', 'orc', 'conclusion', B[7] + 0.5, 1.1], ['orc', 'wr', 'instruction', B[8], 1.1], ['doc', 'wr', 'evidence', B[9], 1, '7']]);
      return c;
    },
    draw: function (c, t, U) {
      c.reset(); c.toks.forEach(function (tk) { U.op(tk, 0); });
      var A = c.A1, B = c.B, rb = t >= c.b0, step = 0, r1n = false, r2n = false, sees = '';
      if (!rb) {
        c.run(U, t, c.runA, false);
        [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].forEach(function (k) { if (t >= A[k]) step = k; });
        r1n = t >= A.w1 + 1; r2n = t >= A[7] + 1;
        if (t >= A[7] + 1) sees = 'sees 4 of 7 notes';
        // the failed call stays marked until its answer arrives; the timeout and resend stay labeled through passage 1
        U.op(c.lost, t >= A[4] && t < A[6] + 0.9 ? 1 : 0);
        U.cls(c.A.r2.g, 'is-bad', t >= A[4] && t < A[5]);
        var lab = t < U.cue(2) ? 1 : 0; U.op(c.to1, t >= A[4] ? lab : 0); U.op(c.to2, t >= A[5] ? lab : 0);
      } else {
        c.run(U, t, c.runB, false);
        step = 4; [5, 6, 7, 8, 9].forEach(function (k) { if (t >= B[k]) step = k; });
        if (t >= B[9] + 2.4) step = 13;
        r1n = t >= B[5] + 0.9; r2n = t >= B[7] + 0.9;
        if (t >= B[9] + 1) sees = 'sees 7 of 7 notes';
        U.op(c.lost, 0); U.op(c.to1, 0); U.op(c.to2, 0);
      }
      c.bars.forEach(function (bar, i) { U.op(bar, i < 4 ? (r1n ? 1 : 0) : (r2n ? 1 : 0)); });
      U.setText(c.step, step ? 'step ' + step : ''); U.op(c.step, 1);
      U.setText(c.sees, sees); c.sees.style.fill = rb ? 'var(--mint)' : 'var(--warm)';
      var endA = !rb && t >= A[11] + 1.1, endB = rb && step === 13;
      U.setText(c.endL, endA ? 'ends on time · sub-task 2 missing' : endB ? 'ends at step 13 · both sub-tasks covered' : '');
      c.endL.style.fill = endB ? 'var(--mint)' : '';
      U.cls(c.A.wr.g, 'is-bad', !rb && t >= A[7] + 1);
      U.cls(c.A.wr.g, 'is-on', rb && t >= B[9] + 1);
      U.op(c.bar, rb && t < U.cue(3) ? U.ramp(t, c.b0, 0.6) : 0);
      U.op(c.slow, U.ramp(t, U.cue(3) + 0.5, 0.6));
    } });

  // =============================================================== 15. retry
  NCMA.scene({ id: 'retry-twice', note: ILL, source: 'Helland, 2012 · Saltzer, Reed & Clark, 1984', desc: 'Researcher 2 on the left, the shared draft as a box in the middle, the reviewer on the right. A write labeled 3 travels to the draft and three entries appear. The acknowledgement travels back and is lost midway. The write is sent again and three duplicate entries appear in red, and the reviewer reads six. In the replay both writes carry the key r2-notes, the draft ignores the second, three entries remain and the reviewer reads three. Two closing lines contrast resending a tool call with resending a prompt to a sampling model.',
    build: function (svg, U) {
      var c = {};
      c.r2 = U.agent(svg, { x: 220, y: 380, r: 56, label: 'researcher 2' });
      c.rv = U.agent(svg, { x: 1540, y: 380, r: 56, label: 'reviewer' });
      c.box = U.el('rect', { x: 640, y: 90, width: 540, height: 560, rx: 10, 'class': 'box' }, svg);
      U.text(svg, 668, 138, 'shared draft', 'lab');
      U.el('line', { x1: 280, y1: 350, x2: 636, y2: 350, 'class': 'ln' }, svg);
      U.el('line', { x1: 636, y1: 420, x2: 280, y2: 420, 'class': 'ln ln--dash' }, svg);
      U.el('line', { x1: 1184, y1: 380, x2: 1480, y2: 380, 'class': 'ln' }, svg);
      c.rows = [0, 1, 2, 3, 4, 5].map(function (i) { var g = U.g(svg), y = 210 + i * 62; g.mk = U.el('rect', { x: 668, y: y - 20, width: 12, height: 26, rx: 2, 'class': i < 3 ? 'bar--hi' : 'bar--alert' }, g); U.text(g, 700, y, 'failure report, source ' + (5 + i % 3), 'cap'); U.op(g, 0); return g; });
      function w(label, key) { var g = U.token(svg, 'evidence', { r: 22, label: label }); if (key) U.text(g, 0, 58, 'key r2-notes', 'lab lab--hi', { 'text-anchor': 'middle' }); return g; }
      c.w1 = w('3'); c.w2 = w('3'); c.k1 = w('3', 1); c.k2 = w('3', 1);
      c.ack = U.token(svg, 'conclusion', { r: 13 }); c.ack2 = U.token(svg, 'conclusion', { r: 13 });
      c.lost = U.token(svg, 'lost', { r: 18 }); U.place(c.lost, 458, 420);
      c.lostL = U.text(svg, 458, 530, 'acknowledgement lost', 'lab lab--alert', { 'text-anchor': 'middle' });
      c.rd = U.token(svg, 'both', { r: 18, label: '' }); c.rdLab = c.rd.querySelector('text');
      c.count = U.text(svg, 1540, 270, '', 'word--lg', { 'text-anchor': 'middle' });
      c.ign = U.text(svg, 910, 616, 'key already applied: ignored', 'lab lab--hi', { 'text-anchor': 'middle' });
      c.keys = U.text(svg, 1150, 138, 'applied: r2-notes', 'lab lab--hi', { 'text-anchor': 'end' });
      c.sent = U.text(svg, 220, 600, '', 'lab', { 'text-anchor': 'middle' });
      c.here = U.text(svg, 910, 616, 'the check lives in the draft', 'lab lab--hi', { 'text-anchor': 'middle' });
      c.tail = U.lines(svg, 884, 716, ['same tool call resent: the same operation', 'same prompt resent to a sampling model: possibly a new answer'], 'cap', 44, { 'text-anchor': 'middle' });
      return c;
    },
    draw: function (c, t, U) {
      var tw = U.say(0, 'sends a write'), ta = U.say(0, 'sends back an acknowledgement'), tr = U.say(1, 'sends the write again'), tread = U.say(1, 'A reviewer that counts');
      var p2 = U.cue(2), kw = U.say(2, 'The write carries a key'), kr = U.say(2, 'the retry carries the same key'), kd = U.say(2, 'finds it already applied'), kread = U.say(2, 'Two writes were sent'), p3 = U.cue(3);
      var replay = t >= p2;
      var W = [[280, 350], [636, 350]], ACK = [[636, 420], [458, 420]], RD = [[1184, 380], [1480, 380]];
      [c.w1, c.w2, c.k1, c.k2, c.ack, c.ack2, c.rd].forEach(function (e) { U.op(e, 0); });
      var nRows = 0, dup = 0, lostOn = false, cnt = '';
      if (!replay) {
        U.fly(c.w1, W, t, tw, 1.4, false); if (t >= tw + 1.4) nRows = 3;
        U.fly(c.ack, ACK, t, ta, 1.1, false); lostOn = t >= ta + 1.1;
        U.fly(c.w2, W, t, tr, 1.4, false); if (t >= tr + 1.4) dup = 3;
        U.setText(c.rdLab, '6'); U.fly(c.rd, RD, t, tread, 1.3, false); if (t >= tread + 1.3) cnt = '6 reports';
        U.setText(c.sent, t >= tr ? 'writes sent: 2' : t >= tw ? 'writes sent: 1' : '');
      } else {
        nRows = 3; U.fly(c.k1, W, t, kw, 1.4, false);
        U.fly(c.ack2, ACK, t, kw + 1.8, 1.1, false); lostOn = t >= kw + 2.9 && t < kr + 1.6;
        U.fly(c.k2, [[280, 350], [612, 350]], t, kr, 1.3, true); if (t >= kd + 0.8) U.op(c.k2, Math.max(0, 1 - (t - kd - 0.8) / 0.6));
        U.setText(c.rdLab, '3'); U.fly(c.rd, RD, t, kread, 1.3, false); if (t >= kread + 1.3) cnt = '3 reports';
        U.setText(c.sent, t >= kr ? 'writes sent: 2' : 'writes sent: 1');
      }
      c.rows.forEach(function (g, i) { U.op(g, i < 3 ? (i < nRows ? 1 : 0) : (i - 3 < dup ? 1 : 0)); });
      U.op(c.lost, lostOn ? 1 : 0); U.op(c.lostL, lostOn ? 1 : 0);
      U.setText(c.count, cnt); c.count.style.fill = replay ? 'var(--mint)' : 'var(--warm)';
      U.op(c.ign, replay && t >= kd && t < p3 ? 1 : 0); U.op(c.keys, replay && t >= kw + 1.4 ? 1 : 0);
      c.box.setAttribute('class', t >= p3 ? 'box box--hi' : 'box');
      U.op(c.here, U.ramp(t, U.say(3, 'The check has to live'), 0.6)); U.op(c.tail, U.ramp(t, U.say(3, 'Resending an identical tool call'), 0.6));
      U.cls(c.r2.g, 'is-on', !replay && t >= tr - 0.6 && t < tr + 1.4);
    } });

  // =============================================================== 16. trace
  var SP = [ // label, start step, end step, parent index, kind
    ['request', 1, 11, -1, ''], ['orchestrator · assign', 2, 2, 0, ''], ['researcher 1 · search', 3, 4, 1, ''], ['researcher 1 · write', 5, 5, 2, ''],
    ['researcher 2 · search', 3, 4, 1, 'err'], ['researcher 2 · search again', 5, 6, 1, 'r2'], ['researcher 2 · write', 7, 7, 5, 'r2'],
    ['orchestrator · dispatch', 6, 6, 1, 'anc'], ['writer · read draft', 7, 7, 7, 'anc'], ['writer · draft', 8, 8, 8, ''], ['reviewer · check', 9, 10, 9, '']];
  NCMA.scene({ id: 'trace-back', note: ILL, desc: 'A trace of the run without a barrier: eleven rows of operations, from the request to the reviewer’s check, laid on a time axis of steps 1 to 11 as a cursor sweeps across. Researcher 2’s first search is red. A dashed line marks step 7, where Researcher 2’s write and the writer’s read coincide. Parent links then trace the writer’s read back through the dispatch and the assignment to the request, while Researcher 2’s branch is marked not an ancestor. The chart then fades and three rows of marks compare the clean run, the failed run and the repaired run: ten model calls in each, two or three tool calls, zero, two or four scaffold events, and 11, 11 or 13 steps.',
    build: function (svg, U) {
      var c = { rows: [] }, X = function (s) { return 560 + (s - 1) * 110; };
      c.X = X; c.chart = U.g(svg); c.links = U.g(c.chart);
      SP.forEach(function (s, i) {
        var g = U.g(c.chart), y = 36 + i * 56;
        U.text(g, 0, y + 8, s[0], 'lab');
        var r = U.el('rect', { x: X(s[1]) - 46, y: y - 14, width: X(s[2]) - X(s[1]) + 92, height: 28, rx: 4, 'class': s[4] === 'err' ? 'bar--alert' : 'bar' }, g);
        c.rows.push({ g: g, r: r, s: s, y: y });
      });
      SP.forEach(function (s, i) { if (s[3] < 0) return; var p = c.rows[s[3]], ch = c.rows[i], x0 = X(s[1]) - 46, px = X(p.s[1]) - 46 + 18; var path = U.el('path', { d: 'M' + x0 + ',' + ch.y + ' H' + px + ' V' + (p.y + 14), 'class': 'ln' }, c.links); ch.pl = path; U.op(path, 0); });
      for (var s = 1; s <= 11; s++) U.text(c.chart, X(s), 666, String(s), 'lab', { 'text-anchor': 'middle' });
      U.text(c.chart, 0, 666, 'step', 'lab');
      c.cursor = U.el('line', { x1: 0, y1: 10, x2: 0, y2: 640, 'class': 'rule' }, c.chart);
      c.same = U.el('line', { x1: X(7), y1: 10, x2: X(7), y2: 640, 'class': 'ln ln--dash' }, c.chart); c.same.style.stroke = 'var(--warm)';
      c.sameL = U.text(c.chart, X(7), 706, 'same step', 'lab lab--warm', { 'text-anchor': 'middle' });
      c.notA = U.text(c.chart, X(7) + 60, 36 + 6 * 56 + 8, 'not an ancestor of the read', 'lab lab--warm', { 'text-anchor': 'start' });
      c.keep = U.text(c.chart, 884, 740, 'each record keeps its input, the model and version, and tool arguments and results', 'lab lab--hi', { 'text-anchor': 'middle' });
      // budget glyphs
      c.bud = U.g(svg);
      var cols = [['model calls', 420], ['tool calls', 830], ['scaffold events', 1040], ['steps', 1330]];
      cols.forEach(function (h) { U.text(c.bud, h[1], 150, h[0], 'lab'); });
      [['no fault', 2, 0, 11, ''], ['failed search', 3, 2, 11, 'sub-task 2 missing'], ['failed search, barrier', 3, 4, 13, '']].forEach(function (r, i) {
        var y = 260 + i * 170; U.text(c.bud, 0, y + 8, r[0], 'lab');
        for (var k = 0; k < 10; k++) U.el('rect', { x: 420 + k * 34, y: y - 13, width: 26, height: 26, rx: 4, 'class': 'nd' }, c.bud);
        for (k = 0; k < r[1]; k++) U.el('rect', { x: 830 + k * 50, y: y - 16, width: 38, height: 32, rx: 6, 'class': 'nd nd--tool' }, c.bud);
        for (k = 0; k < r[2]; k++) U.el('circle', { cx: 1052 + k * 40, cy: y, r: 12, 'class': 'bar--warm' }, c.bud);
        U.el('rect', { x: 1330, y: y - 10, width: r[3] * 30, height: 20, rx: 3, 'class': 'bar' }, c.bud); U.text(c.bud, 1330 + r[3] * 30 + 14, y + 8, String(r[3]), 'lab', { 'text-anchor': 'start' });
        if (r[4]) U.text(c.bud, 1330, y + 56, r[4], 'lab lab--warm');
      });
      return c;
    },
    draw: function (c, t, U) {
      var ts = U.say(0, 'Laid out in time'), sw = 7, p1 = U.cue(1), p2 = U.cue(2);
      var cur = 1 + 10.99 * U.lin(t, ts, sw), cx = c.X(1) - 46 + (c.X(11) + 92 - c.X(1)) * U.lin(t, ts, sw);
      c.cursor.setAttribute('x1', cx.toFixed(1)); c.cursor.setAttribute('x2', cx.toFixed(1)); U.op(c.cursor, t >= ts && t < ts + sw + 0.5 ? 1 : 0);
      c.rows.forEach(function (row) {
        var s = row.s, vis = t >= ts && cur >= s[1] - 0.5, frac = U.clamp((cur - (s[1] - 0.5)) / (s[2] - s[1] + 1), 0, 1);
        if (t >= ts + sw) frac = 1;
        row.r.setAttribute('width', ((c.X(s[2]) - c.X(s[1]) + 92) * frac).toFixed(1));
        U.op(row.g, t < U.say(0, 'A trace records') ? 0 : vis ? 1 : 0.35);
        var cls = s[4] === 'err' ? 'bar--alert' : 'bar';
        if (t >= U.say(0, 'the step at which')) { if (s[0] === 'researcher 2 · write' || s[0] === 'writer · read draft') cls = 'bar--warm'; }
        if (t >= p1) { if (s[4] === 'anc' || s[0] === 'orchestrator · assign' || s[0] === 'request') cls = 'bar--hi'; if (s[4] === 'r2' || s[4] === 'err') cls = s[4] === 'err' ? 'bar--alert' : 'bar--warm'; }
        if (row.r.getAttribute('class') !== cls) row.r.setAttribute('class', cls);
        if (row.pl) { var anc = s[4] === 'anc' || s[0] === 'orchestrator · assign'; U.op(row.pl, t >= p1 ? (anc ? U.ramp(t, U.say(1, "The writer's read descends") , 0.8) : 0.25) : 0); U.cls(row.pl, 'is-live', anc && t >= p1); }
      });
      var same = U.say(0, 'the step at which'); U.op(c.same, U.ramp(t, same, 0.6)); U.op(c.sameL, U.ramp(t, same, 0.6) * (t >= p1 ? 0 : 1));
      U.op(c.notA, U.ramp(t, U.say(1, 'Nothing in Researcher 2'), 0.6));
      U.op(c.keep, U.ramp(t, U.say(1, 'A reconstruction like this'), 0.6));
      var fadeChart = U.ramp(t, p2, 0.8); U.op(c.chart, 1 - fadeChart); U.op(c.bud, fadeChart);
    } });

  // =============================================================== 17. approval
  NCMA.scene({ id: 'approval-gate', note: 'Illustrative · the gate as specified, not a measured behavior', source: 'Model Context Protocol specification, 2026', desc: 'The orchestrator on the left, the approver in the middle, the email tool and a regional planning list on the right. A request travels from the orchestrator and stops at the approver, marked waiting, while a card above lists the action, the recipient and that it cannot be recalled. The card then adds the draft, source links and the reviewer’s record, the approver approves, and the request continues through the email tool to the list. A red diverted request then stops at the same gate. Finally several requests queue at the approver.',
    build: function (svg, U) {
      var c = {};
      c.orc = U.agent(svg, { x: 220, y: 470, r: 52, role: 'hub', label: 'orchestrator' });
      c.hu = U.agent(svg, { x: 884, y: 470, r: 56, role: 'human', label: 'approver' });
      c.tool = U.agent(svg, { x: 1300, y: 470, r: 46, role: 'tool', label: 'email tool' });
      c.out = U.agent(svg, { x: 1620, y: 470, r: 44, role: 'doc', label: 'planning list' });
      c.l1 = U.link(svg, c.orc, c.hu, {}); c.l2 = U.link(svg, c.hu, c.tool, {}); c.l3 = U.link(svg, c.tool, c.out, {});
      c.card = U.g(svg); U.el('rect', { x: 584, y: 20, width: 600, height: 340, rx: 10, 'class': 'box' }, c.card);
      U.text(c.card, 612, 66, 'request for approval', 'lab');
      U.lines(c.card, 612, 116, ['action: send the briefing', 'to: regional planning list'], 'cap', 42);
      U.text(c.card, 612, 204, 'cannot be recalled once sent', 'lab lab--warm');
      c.att = U.lines(svg, 612, 262, ['attached: draft, source links,', 'reviewer’s record of 2 claims fixed'], 'cap', 42);
      c.req = U.token(svg, 'instruction', { r: 18 }); c.go = U.token(svg, 'instruction', { r: 18 });
      c.div = U.token(svg, 'injected', { r: 18 });
      c.state = U.text(svg, 884, 600, '', 'lab', { 'text-anchor': 'middle' });
      c.divL = U.text(svg, 560, 640, 'a diverted request waits here too', 'lab lab--alert', { 'text-anchor': 'middle' });
      c.q = [0, 1, 2, 3, 4].map(function () { return U.token(svg, 'instruction', { r: 14 }); });
      c.qL = U.text(svg, 560, 640, 'many requests, each with a long record', 'lab lab--warm', { 'text-anchor': 'middle' });
      return c;
    },
    draw: function (c, t, U) {
      var tr = U.say(0, 'The request names the action'), p1 = U.cue(1), ta = U.say(1, 'lets the person check'), td = U.say(1, 'a request diverted'), p2 = U.cue(2);
      U.fly(c.req, [[278, 470], [822, 470]], t, U.say(0, 'The orchestrator may use') , 1.6, true);
      if (t >= ta + 0.8) U.op(c.req, 0);
      U.op(c.card, U.ramp(t, tr, 0.8)); U.op(c.att, U.ramp(t, U.say(1, 'A request carrying the draft'), 0.8));
      U.fly(c.go, [[946, 470], [1250, 470], [1350, 470], [1572, 470]], t, ta + 0.8, 2, false);
      var appr = t >= ta + 0.8, divWait = t >= td;
      // once the diverted request starts, the gate's status describes that request: it waits
      var ok = appr && !divWait;
      U.setText(c.state, t < U.say(0, 'The orchestrator may use') + 1.6 ? '' : ok ? 'approved' : 'waiting for approval');
      c.state.style.fill = ok ? 'var(--mint)' : 'var(--warm)';
      U.cls(c.l2, 'is-live', appr && t < ta + 2.8); U.cls(c.l3, 'is-live', appr && t < ta + 2.8);
      U.cls(c.hu.g, 'is-on', appr && t < ta + 2.8);
      U.fly(c.div, [[278, 520], [818, 500]], t, td, 1.6, true); if (t >= p2) U.op(c.div, 0);
      U.op(c.divL, t >= td + 1.6 && t < p2 ? 1 : 0);
      c.q.forEach(function (q, i) { U.fly(q, [[278, 470], [800 - i * 40, 470]], t, p2 + 0.6 + i * 0.5, 1.2, true); });
      U.op(c.qL, U.ramp(t, p2 + 2, 0.6));
      if (t >= p2) U.setText(c.state, 'informed or habitual: indistinguishable');
      if (t >= p2) c.state.style.fill = 'var(--warm)';
    } });
})();
