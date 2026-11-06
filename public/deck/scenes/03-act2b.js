/* Act II, second part: topology and integration with the six-clue cast, the readout,
   task allocation, search, human precursors, measured agent studies, debate and
   scripted majorities, chosen graphs, and coordination in the briefing workflow.
   Every draw() is a pure function of t. Toy outcomes are computed here from the
   rules in models.js (six-clue exchange) and from the rules stated beside each
   toy below (search, handoff). */
(function () {
  'use strict';
  var NCMA = window.NCMA, M = NCMA.models, A6 = M.SIX.agents;
  var ILL = 'Illustrative model · outcomes follow from stated rules';
  var WF = 'Illustrative workflow · authored events, outcomes follow from stated rules';
  var clear = function (g) { while (g.firstChild) g.removeChild(g.firstChild); };

  // ------------------------------------------------------------ shared helpers
  // six-clue evidence/conclusion exchange with an explicit clue allocation and messages
  function runAlloc(clue, edges, directed, rounds, mode) {
    var nb = M.neighbors(edges, directed), know = {}, judge = {};
    A6.forEach(function (a) { know[a] = [a]; judge[a] = clue[a] > 0 ? 'A' : 'B'; });
    var sum = function (ids) { return ids.reduce(function (s, id) { return s + clue[id]; }, 0); };
    var hist = [{ round: 0, know: cp(know), judge: Object.assign({}, judge), msgs: [] }];
    for (var r = 1; r <= rounds; r++) {
      var nk = {}, nj = {}, msgs = [];
      A6.forEach(function (a) {
        nb[a].forEach(function (s) { msgs.push({ from: s, to: a, ev: know[s].slice(), cc: judge[s] }); });
        if (mode === 'conclusion') {
          var v = [judge[a]].concat(nb[a].map(function (s) { return judge[s]; })), nA = v.filter(function (x) { return x === 'A'; }).length, nB = v.length - nA;
          nk[a] = know[a].slice(); nj[a] = nA > nB ? 'A' : nB > nA ? 'B' : judge[a];
        } else {
          var u = know[a].slice();
          nb[a].forEach(function (s) { know[s].forEach(function (id) { if (u.indexOf(id) < 0) u.push(id); }); });
          nk[a] = u; var s2 = sum(u); nj[a] = s2 > 0 ? 'A' : s2 < 0 ? 'B' : judge[a];
        }
      });
      know = nk; judge = nj; hist.push({ round: r, know: cp(know), judge: Object.assign({}, judge), msgs: msgs });
    }
    return hist;
  }
  function cp(k) { var o = {}; for (var a in k) o[a] = k[a].slice(); return o; }
  // rounds landed by time t, given start times S[1..n] and flight duration d
  function landed(t, S, d) { var n = 0; for (var r = 1; r < S.length; r++) if (t >= S[r] + d) n = r; return n; }
  function inFlight(t, S, d) { for (var r = 1; r < S.length; r++) if (t >= S[r] && t < S[r] + d) return r; return 0; }
  function liveEdges(c, edges, on) { edges.forEach(function (e) { U_.cls(c.links[e[0] + e[1]], 'is-live', on); }); }
  var U_ = null; // set in each draw for helpers that need it
  // set link opacities for a mix of two topologies (p: 0 = from, 1 = to)
  function topoMix(c, U, from, to, p) {
    var f = {}, g = {};
    (from ? M.SIX.topologies[from] : []).forEach(function (e) { f[e[0] + e[1]] = f[e[1] + e[0]] = 1; });
    (to ? M.SIX.topologies[to] : []).forEach(function (e) { g[e[0] + e[1]] = g[e[1] + e[0]] = 1; });
    Object.keys(c.links).forEach(function (k) { U.op(c.links[k], 0.8 * ((f[k] ? 1 - p : 0) + (g[k] ? p : 0))); });
  }
  function tally(h) { var n = M.count(h, 'A'); return 'A ' + n + '  ·  B ' + (6 - n); }
  function halo(svg, U, c, a, r) { var p = c.pos[a]; var e = U.el('circle', { cx: p[0], cy: p[1], r: r, fill: 'none', stroke: '#6FD8BE', 'stroke-width': 3, 'stroke-dasharray': '2 5' }, c.nodes); U.op(e, 0); return e; }

  // ------------------------------------------------------------ 1. chain
  var CH = M.runSix({ topology: 'chain', mode: 'evidence', rounds: 5 });
  NCMA.scene({ id: 'chain-relay', note: ILL, desc: 'The six agents joined as a chain around five sides of the hexagon. Evidence rings labeled with clue counts travel along the chain each round. After round 1 five agents show A and the agent at the top end shows B; from round 2 all six show A. A dotted halo marks each agent once it holds all six clues: the middle two after round 3, the next two after round 4, the two ends after round 5.',
    build: function (svg, U) {
      var c = NCMA.six(svg, U, { cx: 540, cy: 400, R: 260 });
      c.halo = {}; A6.forEach(function (a) { c.halo[a] = halo(svg, U, c, a, 54); });
      c.rd = U.text(svg, 1340, 200, '', 'big', { 'text-anchor': 'middle' });
      c.ta = U.text(svg, 1340, 290, '', 'word--lg', { 'text-anchor': 'middle' });
      c.k1 = U.text(svg, 1340, 470, 'all six agree: round 2', 'cap', { 'text-anchor': 'middle' });
      c.k2 = U.text(svg, 1340, 530, 'all six fully informed: round 5', 'cap', { 'text-anchor': 'middle' });
      c.hk = U.text(svg, 540, 560, 'holds all six clues', 'lab lab--hi', { 'text-anchor': 'middle' });
      return c;
    },
    draw: function (c, t, U) {
      U_ = U; c.clues(1);
      var tl = U.say(0, 'connect them as a chain');
      c.topo('chain', t, tl);
      if (t < tl) c.topo(null);
      var t3 = U.say(2, 'The two agents nearest') - 2.2, t5 = U.say(2, 'only after the fifth') - 2;
      var S = [0, U.cue(1) + 0.2, U.say(1, 'From the second round') - 2.4, t3, (t3 + t5) / 2, t5], d = 2;
      for (var r = 1; r <= 5; r++) c.round(CH, r, 'evidence', t, S[r], d, 'chain');
      var n = landed(t, S, d), h = CH[n];
      A6.forEach(function (a) { c.judge(a, h.judge[a]); U.op(c.halo[a], h.know[a].length === 6 ? 1 : 0); });
      liveEdges(c, M.SIX.topologies.chain, inFlight(t, S, d) > 0);
      U.setText(c.rd, n ? 'round ' + n : 'before exchange'); U.op(c.rd, U.ramp(t, tl, 0.6));
      U.setText(c.ta, tally(h)); U.op(c.ta, U.ramp(t, tl, 0.6));
      U.op(c.k1, U.ramp(t, U.say(2, 'The group was right'), 0.6)); U.op(c.k2, U.ramp(t, U.say(2, 'The group was right') + 0.6, 0.6));
      U.op(c.hk, U.ramp(t, S[3] + d, 0.6));
    } });

  // ------------------------------------------------------------ 2. star
  var ST = M.runSix({ topology: 'starA1', mode: 'evidence', rounds: 2 });
  NCMA.scene({ id: 'star-hub', note: ILL, desc: 'The chain’s channels fade and five channels from the top agent, now the hub, take their place. In round 1 evidence rings travel to and from the hub: the hub holds six clues and shows A, while the three agents with weak clues show B, three against three. In round 2 the hub forwards everything and all six show A. Captions read: read at the hub, right after round 1; read by majority, tied after round 1; 10 messages per round, fully connected 30.',
    build: function (svg, U) {
      var c = NCMA.six(svg, U, { cx: 540, cy: 400, R: 260 });
      var p = c.pos.a1; c.hub = U.el('circle', { cx: p[0], cy: p[1], r: 52, 'class': 'nd nd--ring' }, c.nodes); U.op(c.hub, 0);
      c.hubLab = U.text(svg, p[0] + 74, p[1] - 30, 'hub', 'lab lab--hi'); U.op(c.hubLab, 0);
      c.halo = {}; A6.forEach(function (a) { c.halo[a] = halo(svg, U, c, a, 64); });
      c.rd = U.text(svg, 1340, 180, '', 'big', { 'text-anchor': 'middle' });
      c.ta = U.text(svg, 1340, 270, '', 'word--lg', { 'text-anchor': 'middle' });
      c.r1 = U.text(svg, 1340, 420, 'read at the hub: right after round 1', 'cap', { 'text-anchor': 'middle' });
      c.r2 = U.text(svg, 1340, 480, 'read by majority: tied after round 1', 'cap', { 'text-anchor': 'middle' });
      c.r3 = U.text(svg, 1340, 580, '10 messages per round  ·  fully connected: 30', 'lab', { 'text-anchor': 'middle' });
      return c;
    },
    draw: function (c, t, U) {
      U_ = U; c.clues(1);
      var tr = U.say(0, 'Rearrange the same agents');
      topoMix(c, U, 'chain', 'starA1', U.ramp(t, tr, 1.6));
      U.op(c.hub, U.ramp(t, U.say(0, 'the hub'), 0.6)); U.op(c.hubLab, U.ramp(t, U.say(0, 'the hub'), 0.6));
      var S = [0, U.cue(1) + 0.3, U.cue(2) + 0.3], d = 2.2;
      for (var r = 1; r <= 2; r++) c.round(ST, r, 'evidence', t, S[r], d, 'starA1');
      var n = landed(t, S, d), h = ST[n];
      A6.forEach(function (a) { c.judge(a, h.judge[a]); U.op(c.halo[a], h.know[a].length === 6 ? 1 : 0); });
      liveEdges(c, M.SIX.topologies.starA1, inFlight(t, S, d) > 0);
      U.setText(c.rd, n ? 'round ' + n : 'before exchange'); U.op(c.rd, U.ramp(t, U.cue(1), 0.6));
      U.setText(c.ta, tally(h)); U.op(c.ta, U.ramp(t, U.cue(1), 0.6));
      U.op(c.r1, U.ramp(t, U.say(2, 'Read at the hub'), 0.6)); U.op(c.r2, U.ramp(t, U.say(2, 'Read by majority'), 0.6)); U.op(c.r3, U.ramp(t, U.say(2, 'with 10 messages'), 0.6));
    } });

  // ------------------------------------------------------------ 3. bridge
  var BE = M.runSix({ topology: 'clusters', mode: 'evidence', rounds: 3 });
  var BC = M.runSix({ topology: 'clusters', mode: 'conclusion', rounds: 3 });
  NCMA.scene({ id: 'bridge', note: ILL, desc: 'Two triangles of three agents, the upper three holding weak clues and the lower three including both strong clues, joined by one bridge on the right. Under evidence exchange, after round 1 the lower group shows A and the upper group B; after round 2 the upper bridge agent shows A; after round 3 all six show A. Then the same network exchanges only answers, as solid discs: after round 1 the lower group is all A, the upper group all B, and nothing changes in rounds 2 and 3.',
    build: function (svg, U) {
      var c = NCMA.six(svg, U, { cx: 540, cy: 400, R: 260 });
      var a = c.pos.a2, b = c.pos.a5; c.bLab = U.text(svg, (a[0] + b[0]) / 2 + 40, (a[1] + b[1]) / 2 + 8, 'bridge', 'lab lab--hi'); U.op(c.bLab, 0);
      c.gU = U.text(svg, 1360, 640, 'upper group: weak clues only', 'lab', { 'text-anchor': 'middle' }); U.op(c.gU, 0);
      c.gL = U.text(svg, 1360, 690, 'lower group: both strong clues', 'lab', { 'text-anchor': 'middle' }); U.op(c.gL, 0);
      c.halo = {}; A6.forEach(function (x) { c.halo[x] = halo(svg, U, c, x, 54); });
      c.head = U.text(svg, 1360, 160, '', 'word--lg', { 'text-anchor': 'middle' });
      c.rd = U.text(svg, 1360, 280, '', 'big', { 'text-anchor': 'middle' });
      c.ta = U.text(svg, 1360, 370, '', 'word--lg', { 'text-anchor': 'middle' });
      c.k = U.text(svg, 1360, 520, '', 'cap', { 'text-anchor': 'middle' });
      return c;
    },
    draw: function (c, t, U) {
      U_ = U; c.clues(1);
      var t0 = U.say(0, 'Now divide the six'), cc = t >= U.cue(2);
      c.topo('clusters', t, t0); if (t < t0) c.topo(null);
      U.op(c.bLab, U.ramp(t, U.say(0, 'a single channel'), 0.6));
      U.op(c.gU, U.ramp(t, U.say(0, 'The lower group holds'), 0.6)); U.op(c.gL, U.ramp(t, U.say(0, 'The lower group holds'), 0.6));
      var d = 2.2, H, S;
      if (!cc) { H = BE; S = [0, U.say(0, 'After one round of evidence') - 1.4, U.cue(1) + 0.3, U.say(1, 'Only in the third round') - 1.0]; for (var r = 1; r <= 3; r++) c.round(BE, r, 'evidence', t, S[r], d, 'clusters'); }
      else { H = BC; S = [0, U.say(2, 'After one round the lower') - 2.4, U.say(2, 'From then on') - 2.6, U.say(2, 'From then on') + 0.2]; for (var q = 1; q <= 3; q++) c.round(BC, q, 'conclusion', t, S[q], d, 'clusters'); }
      if (!cc) for (var q2 = 1; q2 <= 3; q2++) c.round(BC, q2, 'conclusion', t, 1e9, d, 'clusters'); else for (var r2 = 1; r2 <= 3; r2++) c.round(BE, r2, 'evidence', t, -100, d, 'clusters');
      // hide the other mode's tokens
      var n = landed(t, S, d), h = H[n];
      A6.forEach(function (a) { c.judge(a, h.judge[a]); U.op(c.halo[a], !cc && h.know[a].length === 6 ? 1 : 0); });
      liveEdges(c, M.SIX.topologies.clusters, inFlight(t, S, d) > 0);
      U.cls(c.links.a2a5, 'is-live', inFlight(t, S, d) > 0 || (t >= U.say(0, 'a single channel') && t < U.say(0, 'a single channel') + 3));
      U.setText(c.head, cc ? 'messages carry only answers' : 'messages carry evidence'); U.op(c.head, U.ramp(t, t0, 0.6));
      U.setText(c.rd, n ? 'round ' + n : 'before exchange'); U.op(c.rd, U.ramp(t, t0, 0.6));
      U.setText(c.ta, tally(h)); U.op(c.ta, U.ramp(t, t0, 0.6));
      var k = cc ? (t >= U.say(2, 'From then on') ? 'deadlocked: three against three' : '') : (t >= U.say(1, 'Every clue that passes') ? 'every clue between groups crosses one channel' : '');
      U.setText(c.k, k); U.op(c.k, k ? 1 : 0);
    } });

  // ------------------------------------------------------------ 4. readout
  var CCx = M.runSix({ topology: 'complete', mode: 'conclusion', rounds: 3 });
  NCMA.scene({ id: 'where-read', note: ILL, desc: 'The divided network frozen after conclusion exchange: the upper three agents at B, the lower three at A. A readout selector moves: a dashed frame around all six reads majority, no decision; a circle on the lower bridge agent reads A; a circle on the top agent reads B. Then a fully connected network, all six at B, appears on the right, and the same three readouts give B, B and B. At the end all three readouts are shown on both networks at once.',
    build: function (svg, U) {
      var c = { L: NCMA.six(svg, U, { cx: 470, cy: 390, R: 230 }) };
      c.R = NCMA.six(svg, U, { cx: 1340, cy: 390, R: 200, r: 34 });
      c.Rg = U.g(svg); c.Rg.appendChild(c.R.edges); c.Rg.appendChild(c.R.nodes); c.Rg.appendChild(c.R.tk);
      c.rule = U.text(svg, 884, 40, '', 'word--lg', { 'text-anchor': 'middle' });
      c.frameL = U.el('rect', { x: 200, y: 100, width: 540, height: 580, rx: 24, 'class': 'zone' }, svg);
      c.frameR = U.el('rect', { x: 1100, y: 150, width: 480, height: 480, rx: 24, 'class': 'zone' }, svg);
      c.selL = U.el('circle', { r: 54, fill: 'none', stroke: '#6FD8BE', 'stroke-width': 4 }, svg);
      c.selR = U.el('circle', { r: 58, fill: 'none', stroke: '#6FD8BE', 'stroke-width': 4 }, svg);
      c.resL = U.text(svg, 470, 790, '', 'big', { 'text-anchor': 'middle' });
      c.resR = U.text(svg, 1340, 790, '', 'big', { 'text-anchor': 'middle' });
      c.labL = U.text(svg, 470, 720, '', 'lab', { 'text-anchor': 'middle' });
      c.labR = U.text(svg, 1340, 720, 'fully connected, answers only', 'lab', { 'text-anchor': 'middle' });
      // all three readouts at once, from the same frozen runs
      c.all = U.g(svg); c.allR = U.g(c.all);
      [[c.L, c.all], [c.R, c.allR]].forEach(function (q) {
        var net = q[0], g = q[1], h = net === c.L ? BC[3] : CCx[3];
        ['a5', 'a1'].forEach(function (a) {
          var p = net.pos[a], v = M.readout(h, 'node:' + a);
          U.el('circle', { cx: p[0], cy: p[1], r: net === c.L ? 54 : 52, fill: 'none', stroke: '#6FD8BE', 'stroke-width': 4 }, g);
          var below = net === c.L && a === 'a5';
          U.text(g, below ? p[0] : p[0] + (net === c.L ? 84 : 76), below ? p[1] + 105 : p[1] + 8, 'reads ' + v, 'lab ' + (v === 'A' ? 'lab--hi' : 'lab--warm'), below ? { 'text-anchor': 'middle' } : undefined);
        });
        var m = M.readout(h, 'majority');
        U.text(g, net === c.L ? 470 : 1340, 790, 'majority: ' + (m === 'tie' ? 'no decision' : m), 'cap', { 'text-anchor': 'middle' });
      });
      U.op(c.all, 0);
      return c;
    },
    draw: function (c, t, U) {
      var L = c.L, R = c.R, hL = BC[3], hR = CCx[3];
      L.clues(1); L.topo('clusters'); A6.forEach(function (a) { L.judge(a, hL.judge[a]); });
      R.clues(0); R.topo('complete'); A6.forEach(function (a) { R.judge(a, hR.judge[a]); });
      var p1 = U.cue(1), p2 = U.cue(2), both = t >= U.say(2, 'Set the divided network');
      U.op(c.Rg, both ? U.ramp(t, U.say(2, 'Set the divided network'), 0.8) : 0); U.op(c.labR, both ? 1 : 0);
      // which readout: 0 none, 1 majority, 2 node a5, 3 node a1
      var k = 0;
      if (t >= p1 && t < p2) k = t >= U.say(1, 'Read the agent at the top') ? 3 : t >= U.say(1, 'Read one designated') ? 2 : 1;
      if (t >= p2) { k = 0; if (t >= U.say(2, 'Read at the lower bridge')) k = 2; if (t >= U.say(2, 'Read by majority, it only')) k = 1; if (t >= U.say(2, 'Read at the top agent')) k = 3; if (t >= U.say(2, 'Every published comparison')) k = 0; }
      if (t >= U.say(2, 'If every agent')) k = 0;
      var rules = ['', 'readout: majority of six', 'readout: the lower bridge agent', 'readout: the top agent'];
      U.setText(c.rule, t < p1 ? 'the network has stopped changing' : rules[k] || 'one network, three readouts'); U.op(c.rule, U.ramp(t, 1, 0.6));
      U.op(c.frameL, k === 1 ? 1 : 0); U.op(c.frameR, k === 1 && both ? 1 : 0);
      var node = k === 2 ? 'a5' : k === 3 ? 'a1' : null;
      if (node) { U.place(c.selL, L.pos[node][0], L.pos[node][1]); U.place(c.selR, R.pos[node][0], R.pos[node][1]); }
      U.op(c.selL, node ? 1 : 0); U.op(c.selR, node && both ? 1 : 0);
      var rule = k === 1 ? 'majority' : node ? 'node:' + node : null;
      function res(h) { var v = M.readout(h, rule); return v === 'tie' ? 'no decision, 3 to 3' : v; }
      U.setText(c.resL, rule ? res(hL) : ''); U.setText(c.resR, rule && both ? res(hR) : '');
      [c.resL, c.resR].forEach(function (e) { U.cls(e, 'big--hi', e.textContent === 'A'); U.cls(e, 'big--warm', e.textContent === 'B'); });
      U.op(c.labL, 0);
      var tAll = U.say(2, 'If every agent'), all = t >= tAll;
      U.op(c.all, all ? U.ramp(t, tAll, 0.6) : 0); U.op(c.allR, 1);
      if (all) { U.op(c.frameL, U.ramp(t, tAll, 0.6)); U.op(c.frameR, U.ramp(t, tAll, 0.6)); }
    } });

  // ------------------------------------------------------------ 5. task change
  var HIER = [['a5', 'a2'], ['a3', 'a2'], ['a6', 'a4'], ['a2', 'a1'], ['a4', 'a1']];
  var MOVED = { a1: 3, a2: -1, a3: -1, a4: 3, a5: -1, a6: -1 };
  var T = {
    hh: runAlloc(M.SIX.clue, HIER, true, 2, 'evidence'), sh: runAlloc(M.SIX.clue, M.SIX.topologies.starA1, false, 2, 'evidence'),
    hm: runAlloc(MOVED, HIER, true, 2, 'evidence'), sm: runAlloc(MOVED, M.SIX.topologies.starA1, false, 2, 'evidence')
  };
  function firstRight(h) { for (var r = 0; r < h.length; r++) { var ok = true; for (var q = r; q < h.length; q++) if (M.readout(h[q]) !== 'A') ok = false; if (ok) return r; } return null; }
  var SWAP = { a5: 'a1', a1: 'a5', a6: 'a4', a4: 'a6' };
  NCMA.scene({ id: 'task-change', note: ILL, desc: 'Two copies of the six agents. Left, a hierarchy drawn with arrows pointing upward to the top agent. Right, the star with the top agent as hub. With the original clues, after round 1 the hierarchy’s majority is A and the star is tied; after round 2 both are A. The two large clue rings then move to the top agent and the upper-left agent in both networks. Now the star is all A after one round while the hierarchy stays four B to two A.',
    build: function (svg, U) {
      var c = { L: NCMA.six(svg, U, { cx: 430, cy: 360, R: 200, r: 36 }), R: NCMA.six(svg, U, { cx: 1340, cy: 360, R: 200, r: 36 }) };
      c.arrows = U.g(c.L.edges); c.harr = HIER.map(function (e) { var a = c.L.pos[e[0]], b = c.L.pos[e[1]]; return U.link(c.arrows, { x: a[0], y: a[1], r: 36 }, { x: b[0], y: b[1], r: 40 }, { arrow: true }); });
      c.tL = U.text(svg, 430, 40, 'hierarchy: reports flow up', 'word--lg', { 'text-anchor': 'middle' });
      c.tR = U.text(svg, 1340, 40, 'star', 'word--lg', { 'text-anchor': 'middle' });
      c.rL = U.text(svg, 430, 740, '', 'cap', { 'text-anchor': 'middle' }); c.rR = U.text(svg, 1340, 740, '', 'cap', { 'text-anchor': 'middle' });
      c.rd = U.text(svg, 884, 370, '', 'word--lg', { 'text-anchor': 'middle' });
      c.alloc = U.text(svg, 884, 790, '', 'lab', { 'text-anchor': 'middle' });
      return c;
    },
    draw: function (c, t, U) {
      U_ = U;
      var L = c.L, R = c.R, p2 = U.cue(2), moved = t >= p2, tm = U.say(2, 'Now move the two strong') + 0.6, pm = moved ? U.ramp(t, tm, 1.8) : 0;
      L.clues(1); R.clues(1); L.topo(null); R.topo('starA1', t, 0.4);
      U.op(c.arrows, U.ramp(t, 0.4, 0.8));
      // clue rings travel to their new holders
      [L, R].forEach(function (cc) { A6.forEach(function (a) { var o = cc.clue[a]._xy, b = SWAP[a] ? cc.clue[SWAP[a]]._xy : o; U.place(cc.clue[a], o[0] + (b[0] - o[0]) * pm, o[1] + (b[1] - o[1]) * pm); }); });
      var d = 2.2, S, HL, HR, kL, kR;
      if (!moved) { HL = T.hh; HR = T.sh; kL = 'hh'; kR = 'sh'; S = [0, U.cue(1) + 0.3, U.say(1, 'and right after two') - 2.4]; }
      else { HL = T.hm; HR = T.sm; kL = 'hm'; kR = 'sm'; S = [0, U.say(2, "The star's majority is now") - 2.4, U.say(2, "The hierarchy's majority is never") - 1.2]; }
      if (moved && t < tm + 1.8) S = [0, 1e9, 1e9];
      for (var r = 1; r <= 2; r++) { L.round(HL, r, 'evidence', t, S[r], d, kL); R.round(HR, r, 'evidence', t, S[r], d, kR); L.round(moved ? T.hh : T.hm, r, 'evidence', t, moved ? -100 : 1e9, d, moved ? 'hh' : 'hm'); R.round(moved ? T.sh : T.sm, r, 'evidence', t, moved ? -100 : 1e9, d, moved ? 'sh' : 'sm'); }
      var n = landed(t, S, d);
      A6.forEach(function (a) { L.judge(a, HL[n].judge[a]); R.judge(a, HR[n].judge[a]); });
      var fly = inFlight(t, S, d) > 0; c.harr.forEach(function (l) { U.cls(l, 'is-live', fly); }); liveEdges(R, M.SIX.topologies.starA1, fly);
      function verdict(h) { var m = M.readout(h[n]); return m === 'A' ? 'majority right' : m === 'tie' ? 'majority tied' : 'majority wrong'; }
      var shown = t >= S[1] + d;
      U.setText(c.rL, shown ? verdict(HL) + (moved && n === 2 && firstRight(HL) === null ? ', and stays wrong' : '') : ''); U.setText(c.rR, shown ? verdict(HR) : '');
      U.cls(c.rL, 'lab--hi', false);
      U.setText(c.rd, n ? 'round ' + n : ''); U.op(c.rd, 1);
      U.setText(c.alloc, moved && t >= tm ? 'strong clues moved: same weights, pooled answer still A' : 'original clues: pooled answer A'); U.op(c.alloc, U.ramp(t, 0.6, 0.6));
    } });

  // ------------------------------------------------------------ 6. search
  // A toy in the manner of Lazer and Friedman (2007). Positions 0..23; a low hill
  // (peak 60 at 5) and a high hill (peak 100 at 18). Each round an agent copies its
  // best neighbor's position if strictly better (ties to the earlier agent), else steps
  // to the better adjacent position if that improves its score.
  var LAND = { n: 24, peaks: [[5, 60, 8], [18, 100, 14]] };
  var score = function (x) { var v = 0; LAND.peaks.forEach(function (p) { v = Math.max(v, p[1] - p[2] * Math.abs(x - p[0])); }); return Math.max(v, 0); };
  var START = { a1: 7, a2: 10, a3: 12, a4: 0, a5: 2, a6: 13 };
  function search(topology, rounds) {
    var nb = M.neighbors(M.SIX.topologies[topology], false), x = Object.assign({}, START), hist = [{ pos: Object.assign({}, x), how: {} }];
    for (var r = 1; r <= rounds; r++) {
      var nx = {}, how = {};
      A6.forEach(function (a) {
        var best = a; A6.forEach(function (b) { if (nb[a].indexOf(b) >= 0 && score(x[b]) > score(x[best])) best = b; });
        if (best !== a) { nx[a] = x[best]; how[a] = 'copy'; return; }
        var cand = [x[a] - 1, x[a] + 1].filter(function (y) { return y >= 0 && y < LAND.n; }); cand.sort(function (p, q) { return score(q) - score(p) || p - q; });
        if (score(cand[0]) > score(x[a])) { nx[a] = cand[0]; how[a] = 'step'; } else { nx[a] = x[a]; how[a] = 'stay'; }
      });
      x = nx; hist.push({ pos: Object.assign({}, x), how: how });
    }
    return hist;
  }
  var SC = { complete: search('complete', 8), ring: search('ring', 8) };
  NCMA.scene({ id: 'search', note: ILL, source: 'after Lazer & Friedman, 2007', desc: 'Two landscapes, one above the other, each with a low hill and a high hill, and six numbered agents placed on them. Top, a fully connected network: in round 1 every agent jumps to the best starting solution on the low hill, and by round 3 all six sit at the low peak. Bottom, a ring: agent 6 climbs the high hill alone, the others copy it as it overtakes them, and by round 8 all six sit at the high peak.',
    build: function (svg, U) {
      var c = { strips: {} };
      var X = function (p) { return 330 + p * 60; };
      [['complete', 330], ['ring', 730]].forEach(function (s) {
        var g = U.g(svg), base = s[1], Y = function (v) { return base - v * 2.1; }, d = '';
        for (var i = 0; i <= 230; i++) { var p = i / 10; var v = 0; LAND.peaks.forEach(function (pk) { v = Math.max(v, pk[1] - pk[2] * Math.abs(p - pk[0])); }); d += (i ? ' L' : 'M') + X(p).toFixed(1) + ',' + Y(Math.max(v, 0)).toFixed(1); }
        U.el('path', { d: d, 'class': 'ln', 'stroke-width': 3 }, g);
        U.el('line', { x1: X(0), y1: base, x2: X(23), y2: base, 'class': 'rule' }, g);
        // a small drawing of the network
        var mini = U.g(g), P = A6.map(function (a, i) { var th = -Math.PI / 2 + M.SIX.order.indexOf(a) * Math.PI / 3; return [130 + 62 * Math.cos(th), base - 120 + 62 * Math.sin(th)]; });
        M.SIX.topologies[s[0]].forEach(function (e) { var a = P[A6.indexOf(e[0])], b = P[A6.indexOf(e[1])]; U.el('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], 'class': 'ln' }, mini); });
        P.forEach(function (p) { U.el('circle', { cx: p[0], cy: p[1], r: 9, 'class': 'nd' }, mini); });
        U.text(g, 130, base + 10, s[0] === 'complete' ? 'fully connected' : 'ring', 'lab', { 'text-anchor': 'middle' });
        var ag = {}; A6.forEach(function (a, i) { ag[a] = U.agent(g, { x: 0, y: 0, r: 17, mark: String(i + 1) }); ag[a].mark.style.fontSize = '18px'; });
        c.strips[s[0]] = { g: g, ag: ag, X: X, Y: Y, base: base };
      });
      c.lo = U.text(svg, X(5), 366, 'low hill · 60', 'lab', { 'text-anchor': 'middle' });
      c.hi = U.text(svg, X(18), 366, 'high hill · 100', 'lab lab--hi', { 'text-anchor': 'middle' });
      c.rdC = U.text(svg, 1730, 130, '', 'word--lg', { 'text-anchor': 'end' }); c.rdR = U.text(svg, 1730, 530, '', 'word--lg', { 'text-anchor': 'end' });
      return c;
    },
    draw: function (c, t, U) {
      function play(name, t0, step, last) {
        var s = c.strips[name], H = SC[name], k = t < t0 ? 0 : Math.min(last, Math.floor((t - t0) / step) + 1), f = t < t0 ? 1 : U.clamp(((t - t0) - (k - 1) * step) / (step * 0.6), 0, 1);
        var prev = H[Math.max(0, k - 1)].pos, cur = H[k].pos, p = k === 0 ? 1 : U.ease(f), X = {}, grp = {};
        A6.forEach(function (a) { X[a] = prev[a] + (cur[a] - prev[a]) * p; var key = Math.round(X[a] * 4); (grp[key] = grp[key] || []).push(a); });
        Object.keys(grp).forEach(function (key) {
          var g = grp[key];
          g.forEach(function (a, j) {
            var x = X[a], fl = Math.floor(x), v = score(fl) + (score(Math.min(23, fl + 1)) - score(fl)) * (x - fl);
            var lift = Math.abs(cur[a] - prev[a]) > 1.5 ? Math.sin(Math.PI * p) * 70 : 0;
            var dx = g.length > 1 ? (j % 2 ? 19 : -19) : 0;
            U.place(s.ag[a].g, s.X(x) + dx, s.Y(v) - 20 - Math.floor(j / 2) * 36 - lift);
          });
        });
        return k;
      }
      var tc = U.cue(1) + 0.5, tr = U.cue(2) + 0.5;
      // the fully connected network converges at round 3 and the counter stops there;
      // the ring's eighth round lands as the passage says so
      var stepR = Math.max(1.2, (U.say(2, 'By the eighth round') - tr) / 7.6);
      var kc = play('complete', tc, 1.6, 3), kr = play('ring', tr, stepR, 8);
      var ex = c.strips.ring.ag.a6.g; U.cls(ex, 'is-on', t >= U.cue(2) && t < U.cue(3));
      U.setText(c.rdC, t >= tc ? 'round ' + kc : 'start'); U.setText(c.rdR, t >= tr ? 'round ' + kr : 'start');
      U.em(c.strips.complete.g, t >= U.cue(2) && t < U.cue(3) ? 1 : 2); U.em(c.strips.ring.g, t >= U.cue(1) && t < U.cue(2) ? 1 : 2);
      U.op(c.lo, 1); U.op(c.hi, 1);
    } });

  // ------------------------------------------------------------ 7. human groups
  NCMA.scene({ id: 'human-groups', note: 'Reported findings · human studies, designs shown schematically, no values drawn', source: 'Bavelas, 1950 · Mason & Watts, 2012 · Becker et al., 2017', desc: 'Two five-person groups of people drawn as hexagons: a wheel with one central member and a circle. Each member holds a piece of information. Then two statements: the search toy, slower network found the higher hill; people in groups of 16, faster networks did better. Then in the wheel the central member’s error, in red, spreads along every spoke, while in the circle neighbors exchange estimates.',
    build: function (svg, U) {
      var c = { W: {}, C: {} };
      function grp(o, cx, cy, wheel) {
        o.g = U.g(svg); o.lg = U.g(o.g); o.ng = U.g(o.g); o.tk = U.g(o.g); o.P = []; o.E = []; o.ag = []; o.links = [];
        if (wheel) { o.P.push([cx, cy]); for (var i = 0; i < 4; i++) { var th = -Math.PI / 4 + i * Math.PI / 2; o.P.push([cx + 190 * Math.cos(th), cy + 190 * Math.sin(th)]); o.E.push([0, i + 1]); } }
        else { for (var j = 0; j < 5; j++) { var th2 = -Math.PI / 2 + j * 2 * Math.PI / 5; o.P.push([cx + 190 * Math.cos(th2), cy + 190 * Math.sin(th2)]); } for (var k = 0; k < 5; k++) o.E.push([k, (k + 1) % 5]); }
        o.E.forEach(function (e) { o.links.push(U.link(o.lg, { x: o.P[e[0]][0], y: o.P[e[0]][1], r: 36 }, { x: o.P[e[1]][0], y: o.P[e[1]][1], r: 36 })); });
        o.P.forEach(function (p) { o.ag.push(U.agent(o.ng, { x: p[0], y: p[1], r: 36, role: 'human' })); });
        o.clue = o.P.map(function (p) { var tk = U.token(o.tk, 'evidence', { r: 11 }); U.place(tk, p[0] + 44, p[1] - 34); return tk; });
        o.err = o.E.map(function () { return U.token(o.tk, 'evidence', { r: 12, cls: 'clue-B' }); });
        o.title = U.text(svg, cx, 80, wheel ? 'wheel: one central member' : 'circle: no center', 'word--lg', { 'text-anchor': 'middle' });
      }
      grp(c.W, 470, 400, true); grp(c.C, 1300, 400, false);
      c.people = U.text(svg, 884, 790, 'people in laboratory groups · the design, not its results', 'lab lab--warm', { 'text-anchor': 'middle' });
      c.s1 = U.lines(svg, 470, 330, ['the search toy:', 'the slower network', 'found the higher hill'], 'word--lg', 46, { 'text-anchor': 'middle' });
      c.s2 = U.lines(svg, 1300, 330, ['people, groups of 16:', 'faster networks', 'did better'], 'word--lg', 46, { 'text-anchor': 'middle' });
      c.s3 = U.text(svg, 884, 640, 'which wins depended on how members copy', 'cap', { 'text-anchor': 'middle' });
      c.b1 = U.text(svg, 470, 700, 'one person’s error can reach everyone', 'cap', { 'text-anchor': 'middle' });
      c.b2 = U.text(svg, 1300, 700, 'estimates became more accurate', 'cap', { 'text-anchor': 'middle' });
      c.b3 = U.text(svg, 884, 790, 'schematic · the estimation study used networks of 40 people', 'lab lab--warm', { 'text-anchor': 'middle' });
      c.div = U.el('line', { x1: 884, y1: 60, x2: 884, y2: 600, 'class': 'rule' }, svg);
      return c;
    },
    draw: function (c, t, U) {
      var p1 = U.cue(1), p2 = U.cue(2), mid = t >= p1 && t < p2;
      var nets = t < p2 ? 1 - U.ramp(t, p1, 0.6) : U.ramp(t, p2, 0.6);
      [c.W, c.C].forEach(function (o) { U.op(o.g, nets * U.ramp(t, 0.5, 0.8)); U.op(o.title, nets); U.op(o.lg, U.ramp(t, U.say(0, 'the experimenter fixed'), 0.8)); o.clue.forEach(function (k) { U.op(k, t < p2 ? U.ramp(t, U.say(0, 'held part of the information'), 0.6) : 0); }); });
      U.op(c.people, t < p2 ? U.ramp(t, 1, 0.6) * (1 - U.ramp(t, p1, 0.6)) : 0);
      U.op(c.s1, mid ? U.ramp(t, U.say(1, 'The search toy reproduces'), 0.6) : 0);
      U.op(c.s2, mid ? U.ramp(t, U.say(1, 'efficient networks did better'), 0.6) : 0);
      U.op(c.s3, mid ? U.ramp(t, U.say(1, 'A later simulation'), 0.6) : 0);
      // estimation: central error spreads along the wheel's spokes; circle neighbors exchange
      var te = U.say(2, 'In centralized ones'), ti = U.say(2, 'In decentralized networks');
      c.W.err.forEach(function (tk, i) { var e = c.W.E[i], a = c.W.P[e[0]], b = c.W.P[e[1]]; if (t >= p2) U.fly(tk, U.seg(a, b, 40, 40), t, te, 1.6, true); else U.op(tk, 0); });
      c.W.ag.forEach(function (ag, i) { U.cls(ag.g, 'is-bad', t >= p2 && (i === 0 ? t >= te - 0.5 : t >= te + 1.6)); });
      c.C.err.forEach(function (tk, i) { var e = c.C.E[i], a = c.C.P[e[0]], b = c.C.P[e[1]]; tk.firstChild.setAttribute('class', 'tk-ring'); if (t >= p2) { var ph = (t - ti) % 3; U.fly(tk, U.seg(i % 2 ? a : b, i % 2 ? b : a, 40, 40), ph, 0.2, 1.4, false); if (t < ti) U.op(tk, 0); } else U.op(tk, 0); });
      c.C.ag.forEach(function (ag) { U.cls(ag.g, 'is-on', t >= p2 && t >= ti + 2); });
      c.W.links.forEach(function (l) { U.cls(l, 'is-bad', t >= te && t < te + 2 && t >= p2); });
      U.op(c.b1, t >= p2 ? U.ramp(t, te + 1.6, 0.6) : 0); U.op(c.b2, t >= p2 ? U.ramp(t, ti + 2, 0.6) : 0); U.op(c.b3, t >= p2 ? U.ramp(t, p2 + 0.5, 0.6) : 0);
    } });

  // ------------------------------------------------------------ 8. agent studies
  NCMA.scene({ id: 'agent-studies', note: 'Reported findings · values as published, network drawings schematic', source: 'Kim et al., 2025 (preprint) · Gladstone & Brashears, 2026 (under review) · Li et al., 2024', desc: 'Three comparisons in turn. First, against one agent with matched compute: a hub with three workers on a task that splits into parts, plus 80.8 percent; three independent agents on a sequential planning task, minus 70.0 percent; a frame marks that both the architecture and the task differ. Second, a seven-agent tiered hierarchy with ten trial marks all filled, 10 of 10, and a fully connected network with one of ten filled, 1 of 10, its answer read from an agent chosen at random; synthesis tasks, differences not resolved. Third, a fully connected debate and a sparse one: accuracy matched or exceeded, with less text to read.',
    build: function (svg, U) {
      var c = { s: [U.g(svg), U.g(svg), U.g(svg)] };
      function mini(g, cx, cy, P, E, r, hub) { var ag = []; E.forEach(function (e) { U.link(g, { x: cx + P[e[0]][0], y: cy + P[e[0]][1], r: r }, { x: cx + P[e[1]][0], y: cy + P[e[1]][1], r: r }); }); P.forEach(function (p, i) { ag.push(U.agent(g, { x: cx + p[0], y: cy + p[1], r: r, role: hub === i ? 'hub' : null })); }); return ag; }
      // 1. Kim et al.
      var g = c.s[0];
      U.text(g, 884, 40, 'each compared with one agent at matched compute', 'cap', { 'text-anchor': 'middle' });
      U.agent(g, { x: 150, y: 400, r: 40, label: 'one agent', ly: 80 });
      mini(g, 520, 210, [[0, 0], [-110, 90], [0, 110], [110, 90]], [[0, 1], [0, 2], [0, 3]], 26, 0);
      U.text(g, 520, 380, 'centralized', 'lab', { 'text-anchor': 'middle' });
      mini(g, 520, 560, [[-110, 0], [0, 0], [110, 0]], [], 26);
      U.text(g, 520, 640, 'independent', 'lab', { 'text-anchor': 'middle' });
      U.lines(g, 960, 230, ['task that splits', 'into separable parts'], 'cap', 36, { 'text-anchor': 'middle' });
      U.lines(g, 960, 560, ['sequential', 'planning task'], 'cap', 36, { 'text-anchor': 'middle' });
      c.kA = U.text(g, 1460, 262, '+80.8%', 'big big--hi', { 'text-anchor': 'middle' });
      c.kB = U.text(g, 1460, 592, '−70.0%', 'big big--warm', { 'text-anchor': 'middle' });
      c.kF = U.g(g); U.el('rect', { x: 370, y: 110, width: 790, height: 590, rx: 16, 'class': 'box box--warm' }, c.kF); U.text(c.kF, 765, 760, 'both the architecture and the task differ', 'lab lab--warm', { 'text-anchor': 'middle' });
      // 2. Gladstone & Brashears
      g = c.s[1];
      U.text(g, 884, 40, 'puzzles with one clue per agent', 'cap', { 'text-anchor': 'middle' });
      mini(g, 420, 250, [[0, -130], [-120, -10], [120, -10], [-180, 110], [-60, 110], [60, 110], [180, 110]], [[1, 0], [2, 0], [3, 1], [4, 1], [5, 2], [6, 2]], 26);
      U.text(g, 420, 448, 'tiered hierarchy', 'lab', { 'text-anchor': 'middle' });
      var FP = []; for (var i = 0; i < 6; i++) { var th = -Math.PI / 2 + i * Math.PI / 3; FP.push([150 * Math.cos(th), 150 * Math.sin(th)]); }
      var FE = []; for (var a = 0; a < 6; a++) for (var b = a + 1; b < 6; b++) FE.push([a, b]);
      c.full = mini(g, 1340, 215, FP, FE, 26);
      U.text(g, 1340, 448, 'fully connected', 'lab', { 'text-anchor': 'middle' });
      function trials(x, k) { var tg = U.g(g); for (var j = 0; j < 10; j++) U.el('rect', { x: x - 245 + j * 50, y: 482, width: 36, height: 36, rx: 5, 'class': j < k ? 'bar bar--hi' : 'box' }, tg); return tg; }
      c.tH = trials(420, 10); c.tF = trials(1340, 1);
      c.nH = U.text(g, 420, 570, 'solved 10 of 10 sampled trials', 'cap', { 'text-anchor': 'middle' });
      c.nF = U.text(g, 1340, 570, 'solved 1 of 10', 'cap', { 'text-anchor': 'middle' });
      c.sel = U.el('circle', { r: 40, fill: 'none', stroke: '#6FD8BE', 'stroke-width': 4 }, g); U.place(c.sel, 1340 + FP[2][0], 215 + FP[2][1]);
      c.selLab = U.text(g, 1340, 630, 'answer read from one agent chosen at random', 'lab lab--hi', { 'text-anchor': 'middle' });
      c.syn = U.text(g, 884, 700, 'synthesis tasks: differences among architectures not resolved', 'cap', { 'text-anchor': 'middle' });
      // 3. Li et al.
      g = c.s[2];
      U.text(g, 884, 40, 'one debate protocol, only the channels varied', 'cap', { 'text-anchor': 'middle' });
      mini(g, 470, 300, FP, FE, 26);
      var SE = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0]]; mini(g, 1300, 300, FP, SE, 26);
      U.text(g, 470, 500, 'each reads five', 'lab', { 'text-anchor': 'middle' }); U.text(g, 1300, 500, 'each reads two', 'lab', { 'text-anchor': 'middle' });
      c.l1 = U.text(g, 1300, 580, 'accuracy matched or exceeded', 'cap', { 'text-anchor': 'middle' });
      c.l2 = U.text(g, 1300, 630, 'substantially less to read', 'cap', { 'text-anchor': 'middle' });
      c.l3 = U.text(g, 884, 740, 'each effect is defined by its task and its readout', 'word--lg', { 'text-anchor': 'middle' });
      return c;
    },
    draw: function (c, t, U) {
      var p1 = U.cue(1), p2 = U.cue(2), k = t < p1 ? 0 : t < p2 ? 1 : 2;
      c.s.forEach(function (g, i) { U.op(g, i === k ? U.ramp(t, i ? U.cue(i) : 0.3, 0.8) : 0); });
      U.op(c.kA, U.ramp(t, U.say(0, 'The largest gain'), 0.6)); U.op(c.kB, U.ramp(t, U.say(0, 'The largest loss'), 0.6)); U.op(c.kF, U.ramp(t, U.say(0, 'The two extremes'), 0.6));
      U.op(c.tH, U.ramp(t, U.say(1, 'A tiered hierarchy'), 0.6)); U.op(c.nH, U.ramp(t, U.say(1, 'A tiered hierarchy'), 0.6));
      U.op(c.tF, U.ramp(t, U.say(1, 'The fully connected network solved'), 0.6)); U.op(c.nF, U.ramp(t, U.say(1, 'The fully connected network solved'), 0.6));
      U.op(c.sel, U.ramp(t, U.say(1, 'the answer was read'), 0.6)); U.op(c.selLab, U.ramp(t, U.say(1, 'the answer was read'), 0.6));
      U.op(c.syn, U.ramp(t, U.say(1, 'On open-ended synthesis'), 0.6));
      U.op(c.l1, U.ramp(t, U.say(2, 'matched or exceeded'), 0.6)); U.op(c.l2, U.ramp(t, U.say(2, 'substantially reducing'), 0.6)); U.op(c.l3, U.ramp(t, U.say(2, 'Until one does'), 0.8));
    } });

  // ------------------------------------------------------------ 9. debate
  NCMA.scene({ id: 'debate-baseline', note: 'Reported findings · call counts show the designs, no results drawn', source: 'Du et al., 2024 · Wang et al., 2024 · Wynn et al., 2025', desc: 'Three model instances in a triangle. Each sends a first answer, a solid disc, to a vote: 3 calls. Then two rounds of debate in which messages carrying answers and reasoning pass between all three and each revises: 9 calls in all. A second vote then receives nine independent answers, labeled the matched comparison. Finally one instance’s mark changes from A to B after reading its peers, labeled schematic.',
    build: function (svg, U) {
      var c = { P: [[420, 170], [230, 520], [610, 520]] };
      c.lg = U.g(svg); c.ng = U.g(svg); c.tk = U.g(svg);
      c.ag = c.P.map(function (p, i) { return U.agent(c.ng, { x: p[0], y: p[1], r: 50, label: 'instance ' + (i + 1), ly: i ? 90 : -72 }); });
      c.ln = [[0, 1], [1, 2], [2, 0]].map(function (e) { return U.link(c.lg, c.ag[e[0]], c.ag[e[1]]); });
      c.vote = U.agent(svg, { x: 940, y: 260, r: 46, role: 'tool', label: 'vote over first answers', ly: 84 });
      c.vote2 = U.agent(svg, { x: 940, y: 560, r: 46, role: 'tool', label: 'vote over nine answers', ly: 84 });
      c.first = c.P.map(function () { return U.token(c.tk, 'conclusion', { r: 16 }); });
      c.nine = []; for (var q = 0; q < 9; q++) c.nine.push(U.token(c.tk, 'conclusion', { r: 14 }));
      c.msgs = []; for (var r = 0; r < 2; r++) for (var a = 0; a < 3; a++) for (var b = 0; b < 3; b++) if (a !== b) c.msgs.push({ r: r, a: a, b: b, tk: U.token(c.tk, 'both', { r: 13 }) });
      c.calls = U.text(svg, 1470, 230, '', 'big', { 'text-anchor': 'middle' });
      c.callsLab = U.text(svg, 1470, 290, 'debate: model calls', 'lab', { 'text-anchor': 'middle' });
      c.l3b = U.text(svg, 1470, 568, 'the matched comparison', 'cap', { 'text-anchor': 'middle', style: 'fill:#6FD8BE' });
      c.flip = U.text(svg, 1470, 650, 'schematic: a correct answer abandoned', 'lab lab--warm', { 'text-anchor': 'middle' });
      c.flip2 = U.text(svg, 1470, 690, 'after reading peers’ reasoning', 'lab lab--warm', { 'text-anchor': 'middle' });
      return c;
    },
    draw: function (c, t, U) {
      var p1 = U.cue(1), p2 = U.cue(2), tA = U.say(0, 'Several instances'), tR = U.say(0, 'revise, and after some rounds'), tD = U.say(0, 'reported that three');
      // first answers to the vote
      var V1 = [940, 260], V2 = [940, 560];
      c.first.forEach(function (tk, i) { U.fly(tk, U.seg(c.P[i], V1, 56, 58), t, tA + 0.6 + i * 0.3, 1.6, false); });
      var n1 = c.first.filter(function (tk, i) { return t >= tA + 0.6 + i * 0.3 + 1.6; }).length;
      U.setText(c.vote.mark, n1 ? String(n1) : '');
      var t9 = U.say(1, 'The first act showed');
      c.nine.forEach(function (tk, i) { U.fly(tk, U.seg(c.P[i % 3], V2, 56, 58), t, t9 + 0.3 + i * 0.22, 1.4, false); });
      var n9 = c.nine.filter(function (tk, i) { return t >= t9 + 0.3 + i * 0.22 + 1.4; }).length;
      U.setText(c.vote2.mark, n9 ? String(n9) : '');
      var R = [tR, tR + 3], calls = t >= tA + 0.6 ? 3 : 0;
      c.msgs.forEach(function (m) { var a = c.P[m.a], b = c.P[m.b]; U.fly(m.tk, U.seg(a, b, 56, 56), t, R[m.r] + (m.a * 0.15), 2, false); });
      R.forEach(function (r0) { if (t >= r0 + 2) calls += 3; });
      c.ln.forEach(function (l) { U.cls(l, 'is-live', (t >= R[0] && t < R[0] + 2.3) || (t >= R[1] && t < R[1] + 2.3)); });
      var flipT = U.say(2, 'as agents switched');
      c.ag.forEach(function (ag, i) { var v = t < tA + 0.3 ? '' : (i === 1 && t < R[0] + 2) ? 'B' : 'A'; if (i === 2 && t >= flipT) v = 'B'; U.setText(ag.mark, v); U.cls(ag.g, 'is-A', v === 'A'); U.cls(ag.g, 'is-B', v === 'B'); });
      U.setText(c.calls, calls ? String(calls) : ''); U.op(c.callsLab, calls ? 1 : 0);
      var dimP3 = 1 - 0.65 * U.ramp(t, p2, 0.8);
      U.op(c.vote2.g, U.ramp(t, t9 - 0.4, 0.5) * dimP3); U.op(c.l3b, U.ramp(t, t9 + 3.6, 0.6) * dimP3);
      U.cls(c.vote.g, 'is-on', t >= U.say(1, 'The vote combined') && t < t9); U.cls(c.vote2.g, 'is-on', t >= t9 + 2.5 && t < p2);
      U.op(c.flip, t >= p2 ? U.ramp(t, flipT, 0.6) : 0); U.op(c.flip2, t >= p2 ? U.ramp(t, flipT, 0.6) : 0);
      U.op(c.vote.g, dimP3); void tD; void p1;
    } });

  // ------------------------------------------------------------ 10. scripted majority
  NCMA.scene({ id: 'scripted-majority', note: 'Reported findings · design shown, no values drawn', source: 'Asch, 1951 · Zhu et al., 2025 · Weng et al., 2025', desc: 'One model under test at the bottom, with its own clue beside it, answers A alone. Four scripted peers above it, drawn as documents, each send a solid disc labeled B. The model shows a question mark, then B, with the caption: reported, models moved toward the presented majority. The clue beside the model is unchanged throughout and labeled held fixed.',
    build: function (svg, U) {
      var c = {};
      c.m = U.agent(svg, { x: 700, y: 600, r: 58, label: 'model under test', lx: 90, ly: 8, anchor: 'start' });
      c.clue = U.token(svg, 'evidence', { r: 20 }); U.place(c.clue, 580, 660); c.clueLab = U.text(svg, 560, 730, 'own information, held fixed', 'lab', { 'text-anchor': 'middle' });
      c.peers = [400, 600, 800, 1000].map(function (x) { return U.agent(svg, { x: x, y: 190, r: 44, role: 'doc', mark: '' }); });
      c.peerLab = U.text(svg, 700, 80, 'scripted peers: identical answers, no evidence', 'lab lab--warm', { 'text-anchor': 'middle' });
      c.ln = c.peers.map(function (p) { return U.link(svg, p, c.m, { arrow: true }); });
      c.tk = c.peers.map(function () { return U.token(svg, 'conclusion', { r: 18, label: 'B' }); });
      c.s0 = U.text(svg, 1400, 360, 'first answer, alone: A', 'word--lg', { 'text-anchor': 'middle' });
      c.s0b = U.text(svg, 1400, 430, '', 'word--lg', { 'text-anchor': 'middle' });
      c.s1 = U.lines(svg, 1400, 520, ['reported: models moved', 'toward the presented majority'], 'cap', 36, { 'text-anchor': 'middle' });
      c.s2 = U.lines(svg, 1400, 660, ['an effect of message exposure,', 'not a measured motive'], 'lab lab--hi', 32, { 'text-anchor': 'middle' });
      return c;
    },
    draw: function (c, t, U) {
      var tA = U.say(0, 'The model answers alone'), tS = U.say(0, 'It is then shown'), land = tS + 2;
      U.op(c.clue, 1); U.op(c.clueLab, U.ramp(t, U.say(1, 'own information is held'), 0.6));
      c.peers.forEach(function (p) { U.op(p.g, U.ramp(t, U.say(0, 'places one model among'), 0.6)); });
      U.op(c.peerLab, U.ramp(t, U.say(0, 'places one model among'), 0.6));
      c.ln.forEach(function (l) { U.op(l, U.ramp(t, tS - 0.4, 0.4) * 0.8); U.cls(l, 'is-live', t >= tS && t < land); });
      c.tk.forEach(function (tk, i) { U.fly(tk, [[c.peers[i].x, c.peers[i].y + 50], [700 + (i - 1.5) * 40, 530]], t, tS + i * 0.12, 1.8, true); });
      var tR = U.say(1, 'moved toward the presented majority'), v = t < tA ? '' : t < land ? 'A' : t < tR ? '?' : 'B';
      U.setText(c.m.mark, v); U.cls(c.m.g, 'is-A', v === 'A'); U.cls(c.m.g, 'is-B', v === 'B');
      U.op(c.s0, U.ramp(t, tA, 0.5)); U.setText(c.s0b, t >= land ? 'asked again: ' + (t < tR ? '?' : 'B') : '');
      U.op(c.s1, U.ramp(t, tR, 0.6)); U.op(c.s2, U.ramp(t, U.say(1, 'The manipulation is the message'), 0.6));
    } });

  // ------------------------------------------------------------ 11. chosen graphs
  var SA5 = M.runSix({ topology: 'starA5', mode: 'evidence', rounds: 1 });
  NCMA.scene({ id: 'chosen-graphs', note: ILL, source: 'Zhuge et al., 2024 · Zhang et al., 2025', desc: 'The six agents with all fifteen channels. Words on the right name three ways of choosing a graph: optimized with the prompts, generated for each task, pruned from a dense start. Ten channels turn dashed and vanish, leaving a star centered on one of the strong-clue agents. One round of evidence then brings a strong clue to every agent and all six show A.',
    build: function (svg, U) {
      var c = NCMA.six(svg, U, { cx: 540, cy: 400, R: 260 });
      c.w = [['fixed by a designer', 160], ['optimized with the prompts', 280], ['generated for each task', 360], ['pruned from a dense start', 440]].map(function (s, i) { return U.text(svg, 1340, s[1], s[0], i ? 'cap' : 'word--lg', { 'text-anchor': 'middle' }); });
      c.k = U.lines(svg, 1340, 600, ['the strong clues reach', 'every agent in one round'], 'cap', 36, { 'text-anchor': 'middle' });
      c.rule = U.el('line', { x1: 1140, y1: 210, x2: 1540, y2: 210, 'class': 'rule' }, svg);
      return c;
    },
    draw: function (c, t, U) {
      c.clues(1);
      var tp = U.say(0, 'A third starts dense'), keep = {}; M.SIX.topologies.starA5.forEach(function (e) { keep[e[0] + e[1]] = keep[e[1] + e[0]] = 1; });
      var pc = U.ramp(t, tp + 1, 2);
      Object.keys(c.links).forEach(function (k) { var on = keep[k]; U.op(c.links[k], 0.8 * (on ? 1 : 1 - pc)); U.cls(c.links[k], 'is-cut', !on && t >= tp); });
      U.op(c.w[0], 1); U.op(c.w[1], U.ramp(t, U.say(0, 'optimizes its connections'), 0.6)); U.op(c.w[2], U.ramp(t, U.say(0, 'Another generates'), 0.6)); U.op(c.w[3], U.ramp(t, tp, 0.6));
      U.em(c.w[0], t >= U.say(0, 'treats the graph itself') ? 1 : 2);
      var S = [0, U.say(1, 'In the six-clue case') - 0.4], d = 2.2; c.round(SA5, 1, 'evidence', t, S[1], d, 'starA5');
      var n = landed(t, S, d); A6.forEach(function (a) { c.judge(a, SA5[n].judge[a]); });
      U.op(c.k, U.ramp(t, S[1] + d, 0.6));
    } });

  // ------------------------------------------------------------ briefing workflow cast
  var BP = { hu: [100, 400], orc: [330, 400], r1: [600, 160], r2: [600, 640], web: [830, 400], doc: [1050, 400], wr: [1050, 130], rv: [1050, 670] };
  var BL = { hu: ['person', 0, 80, 'middle'], orc: ['orchestrator', 0, 86, 'middle'], r1: ['researcher 1', 0, -62, 'middle'], r2: ['researcher 2', 0, 80, 'middle'], web: ['search', 0, 76, 'middle'], doc: ['shared draft', 58, 8, 'start'], wr: ['writer', 62, 8, 'start'], rv: ['reviewer', 62, 8, 'start'] };
  var BEDGES = [['hu', 'orc'], ['orc', 'r1'], ['orc', 'r2'], ['r1', 'web'], ['r2', 'web'], ['r1', 'doc'], ['r2', 'doc'], ['orc', 'wr'], ['doc', 'wr'], ['doc', 'rv'], ['rv', 'orc']];
  function brief(svg, U) {
    var c = { a: {}, l: {}, lg: U.g(svg), ng: U.g(svg), tg: U.g(svg) };
    var role = {}; M.BRIEF.actors.forEach(function (x) { role[x.id] = x.role; });
    Object.keys(BP).forEach(function (id) {
      var r = role[id] === 'hub' ? 42 : role[id] === 'artifact' ? 44 : 38, L = BL[id];
      c.a[id] = U.agent(c.ng, { x: BP[id][0], y: BP[id][1], r: r, role: role[id] === 'artifact' ? 'doc' : role[id] === 'agent' ? null : role[id], label: L[0], lx: L[1], ly: L[2], anchor: L[3] });
    });
    BEDGES.forEach(function (e) { c.l[e[0] + e[1]] = c.l[e[1] + e[0]] = U.link(c.lg, c.a[e[0]], c.a[e[1]]); });
    c.l.r1r2 = c.l.r2r1 = U.link(c.lg, c.a.r1, c.a.r2, { cls: 'ln--dash' }); U.op(c.l.r1r2, 0);
    c.tk = {};
    // a token travelling from one actor to another
    c.send = function (key, kind, from, to, t, t0, d, hold, label) {
      if (!c.tk[key]) c.tk[key] = U.token(c.tg, kind, { r: 18, label: label });
      var A = c.a[from], B = c.a[to]; return U.fly(c.tk[key], U.seg([A.x, A.y], [B.x, B.y], A.r + 10, B.r + (hold ? 20 : 10)), t, t0, d == null ? 1.6 : d, hold);
    };
    c.live = function (pairs, on) { pairs.forEach(function (p) { U.cls(c.l[p[0] + p[1]], 'is-live', on); }); };
    c.hideAll = function (U2) { Object.keys(c.tk).forEach(function (k) { U2.op(c.tk[k], 0); }); };
    c.calm = function (U2) { Object.keys(c.l).forEach(function (k) { U2.cls(c.l[k], 'is-live', false); }); };
    c.dim = function (ids, lvl) { ids.forEach(function (id) { U.em(c.a[id].g, lvl); }); };
    return c;
  }
  var PX = 1510; // panel centre

  // ------------------------------------------------------------ 12. dividing work
  NCMA.scene({ id: 'divide-work', note: WF, source: 'Davis & Smith, 1983 · Cemri et al., 2025', desc: 'The briefing workflow: a person, an orchestrator, two researchers, a search tool, a shared draft, a writer and a reviewer. A request travels from the person to the orchestrator, which sends two instruction squares to the researchers; they search, receive evidence and write notes into the draft; the writer reads and writes; the reviewer reads and reports to the orchestrator, which reports to the person. A panel on the right names each activity as its channels light: decompose, distribute, solve, synthesize, decide that it is done.',
    build: function (svg, U) {
      var c = brief(svg, U);
      c.act = U.text(svg, PX, 300, '', 'big', { 'text-anchor': 'middle' });
      c.who = U.text(svg, PX, 370, '', 'lab', { 'text-anchor': 'middle' });
      c.fail = U.lines(svg, PX, 520, [], 'cap', 36, { 'text-anchor': 'middle' });
      return c;
    },
    draw: function (c, t, U) {
      c.calm(U); c.hideAll(U);
      var p1 = U.cue(1), p2 = U.cue(2);
      // passage 0: the whole flow once, quickly
      function flow(t0, sp) {
        var ev = [['q', 'instruction', 'hu', 'orc'], ['s1', 'instruction', 'orc', 'r1'], ['s2', 'instruction', 'orc', 'r2'], ['w1', 'instruction', 'r1', 'web'], ['w2', 'instruction', 'r2', 'web'], ['e1', 'evidence', 'web', 'r1'], ['e2', 'evidence', 'web', 'r2'], ['n1', 'evidence', 'r1', 'doc'], ['n2', 'evidence', 'r2', 'doc'], ['d', 'instruction', 'orc', 'wr'], ['rd', 'evidence', 'doc', 'wr'], ['wd', 'conclusion', 'wr', 'doc'], ['rv', 'both', 'doc', 'rv'], ['ro', 'conclusion', 'rv', 'orc'], ['oh', 'both', 'orc', 'hu']];
        var step = { q: 0, s1: 1, s2: 1, w1: 2, w2: 2, e1: 3, e2: 3, n1: 4, n2: 4, d: 5, rd: 6, wd: 7, rv: 8, ro: 9, oh: 10 };
        ev.forEach(function (e) { c.send('f' + e[0], e[1], e[2], e[3], t, t0 + step[e[0]] * sp, sp * 0.9, false); });
      }
      var groups = [
        ['decompose', 'orchestrator, on the request', [['hu', 'orc']], U.say(1, 'decomposing the problem')],
        ['distribute', 'orchestrator, to the researchers', [['orc', 'r1'], ['orc', 'r2']], U.say(1, 'distributing the pieces')],
        ['solve', 'researchers, separately', [['r1', 'web'], ['r2', 'web'], ['r1', 'doc'], ['r2', 'doc']], U.say(1, 'solving the pieces')],
        ['synthesize', 'writer, from the draft', [['doc', 'wr'], ['orc', 'wr']], U.say(1, 'and synthesizing a result')],
        ['decide it is done', 'reviewer, orchestrator, person', [['doc', 'rv'], ['rv', 'orc'], ['hu', 'orc']], U.say(2, 'A fifth activity')]
      ];
      if (t < p1) { flow(U.say(0, 'An orchestrator splits') - 0.5, 1.2); U.setText(c.act, ''); U.setText(c.who, ''); }
      else {
        var k = -1; groups.forEach(function (g, i) { if (t >= g[3]) k = i; });
        if (k >= 0) { c.live(groups[k][2], true); U.setText(c.act, groups[k][0]); U.setText(c.who, groups[k][1]); U.op(c.act, U.ramp(t, groups[k][3], 0.5)); U.op(c.who, U.ramp(t, groups[k][3], 0.5)); }
        Object.keys(c.tk).forEach(function (key) { U.op(c.tk[key], 0); });
        if (k === 4) { c.send('dn1', 'both', 'doc', 'rv', t, groups[4][3] + 0.3, 1.3, false); c.send('dn2', 'conclusion', 'rv', 'orc', t, groups[4][3] + 1.8, 1.6, false); c.send('dn3', 'both', 'orc', 'hu', t, groups[4][3] + 3.6, 1.3, true); }
      }
      clear(c.fail);
      if (t >= U.say(2, 'Each activity can fail')) ['each can fail on its own:', 'a question unassigned,', 'a synthesis of what arrived,', 'a stop too early or never'].forEach(function (s, i) { var ts = U.el('tspan', { x: PX, dy: i ? 36 : 0 }, c.fail); ts.textContent = s; });
      U.op(c.fail, U.ramp(t, U.say(2, 'Each activity can fail'), 0.6));
    } });

  // ------------------------------------------------------------ 13. contract net
  NCMA.scene({ id: 'contract-net', note: WF, source: 'Smith, 1980', desc: 'The briefing workflow with the orchestrator as manager. An announcement, as instruction squares, goes to both researchers, the writer and the reviewer; a panel shows sub-question 2, eligible if able to call search, bid states current load. The writer and reviewer dim: not eligible. The researchers send bids back labeled busy and idle. The orchestrator sends the award to researcher 2, which later returns its result.',
    build: function (svg, U) {
      var c = brief(svg, U);
      c.pan = U.g(svg);
      U.el('rect', { x: PX - 230, y: 120, width: 460, height: 250, rx: 10, 'class': 'box' }, c.pan);
      U.text(c.pan, PX, 170, 'announcement', 'lab lab--hi', { 'text-anchor': 'middle' });
      U.text(c.pan, PX, 225, 'task: sub-question 2', 'cap', { 'text-anchor': 'middle' });
      U.text(c.pan, PX, 275, 'eligible: can call search', 'cap', { 'text-anchor': 'middle' });
      U.text(c.pan, PX, 325, 'bid: current load', 'cap', { 'text-anchor': 'middle' });
      c.step = U.text(svg, PX, 470, '', 'big', { 'text-anchor': 'middle' });
      c.b1 = U.text(svg, 600, 52, 'bid: busy', 'lab lab--warm', { 'text-anchor': 'middle' });
      c.b2 = U.text(svg, 600, 766, 'bid: idle', 'lab lab--hi', { 'text-anchor': 'middle' });
      c.ne = U.text(svg, 1050, 40, 'not eligible', 'lab', { 'text-anchor': 'middle' });
      c.ne2 = U.text(svg, 1050, 760, 'not eligible', 'lab', { 'text-anchor': 'middle' });
      c.sb = U.lines(svg, PX, 600, ['a bid from a language model', 'describes itself in text'], 'cap', 36, { 'text-anchor': 'middle' });
      return c;
    },
    draw: function (c, t, U) {
      c.calm(U); c.hideAll(U);
      var p1 = U.cue(1), p2 = U.cue(2);
      var tA = t < p1 ? U.say(0, 'a manager announces') : U.say(1, 'Here the orchestrator announces');
      var tB = t < p1 ? U.say(0, 'send bids') : U.say(1, 'Both researchers bid');
      var tW = t < p1 ? U.say(0, 'awards the task') : U.say(1, 'The idle one');
      var tR = t < p1 ? U.say(0, 'later reports') : U.say(1, 'later returns its result');
      ['r1', 'r2', 'wr', 'rv'].forEach(function (id) { c.send('an' + id, 'instruction', 'orc', id, t, tA, 1.6, false); });
      c.live([['orc', 'r1'], ['orc', 'r2'], ['orc', 'wr'], ['rv', 'orc']], t >= tA && t < tA + 1.7);
      c.send('bd1', 'evidence', 'r1', 'orc', t, tB, 1.6, false); c.send('bd2', 'evidence', 'r2', 'orc', t, tB + 0.3, 1.6, false);
      c.send('aw', 'instruction', 'orc', 'r2', t, tW, 1.6, false); c.live([['orc', 'r2']], t >= tW && t < tW + 1.7);
      c.send('rs', 'both', 'r2', 'orc', t, tR, 1.6, true);
      var elig = t >= p1 && t >= U.say(1, 'The writer and the reviewer cannot');
      c.dim(['wr', 'rv', 'doc', 'web', 'hu'], elig ? 1 : 2); U.op(c.ne, elig ? 1 : 0); U.op(c.ne2, elig ? 1 : 0);
      U.op(c.pan, t >= p1 ? U.ramp(t, U.say(1, 'Here the orchestrator announces'), 0.6) : 0);
      U.op(c.b1, t >= p1 ? U.ramp(t, tB + 1.6, 0.4) : 0); U.op(c.b2, t >= p1 ? U.ramp(t, tB + 1.9, 0.4) : 0);
      var s = t >= tR + 1.6 ? 'report' : t >= tW ? 'award' : t >= tB ? 'bid' : t >= tA ? 'announce' : '';
      U.setText(c.step, s); U.op(c.step, s ? 1 : 0);
      U.cls(c.a.r2.g, 'is-on', t >= tW + 1.6);
      U.op(c.sb, t >= p2 ? U.ramp(t, U.say(2, 'A language-model agent asked'), 0.6) : 0);
    } });

  // ------------------------------------------------------------ 14. handoff
  // Rules (after the guide's chapter 7 model): researcher 1 wrote 4 notes and researcher 2
  // wrote 3, each linked to its document. The writer makes one claim per note handed over,
  // keeping the link only if links came with it, and adds 2 claims of its own with no source.
  // The reviewer flags every claim without a link. It does not check coverage.
  var NOTES = [1, 1, 1, 1, 2, 2, 2];
  function handoff(which, links) { var cl = []; NOTES.forEach(function (s) { if (which.indexOf(s) >= 0) cl.push({ sub: s, src: links }); }); cl.push({ sub: 1, src: false }, { sub: 2, src: false }); return { claims: cl, sourced: cl.filter(function (x) { return x.src; }).length, flagged: cl.filter(function (x) { return !x.src; }).length, covered: [1, 2].filter(function (s) { return which.indexOf(s) >= 0; }).length }; }
  var HV = [handoff([1, 2], true), handoff([1, 2], false), handoff([1], true)];
  NCMA.scene({ id: 'handoff', note: WF, desc: 'The briefing workflow with the channel from the orchestrator to the writer lit. A row of claim tokens appears in the panel: hollow rings for claims with a source link, solid discs for claims without. With notes and links, nine claims, seven rings and two discs, two flagged. With text and no links, nine discs, nine flagged. With only researcher 1’s notes, six claims, four rings and two discs, two flagged, and the line sub-question 2 missing, not reported. Then the revision loop from orchestrator to writer to draft to reviewer and back lights, with two failures named: stopped too early and never stops.',
    build: function (svg, U) {
      var c = brief(svg, U);
      c.var = U.text(svg, PX, 130, '', 'word--lg', { 'text-anchor': 'middle' });
      c.row = U.g(svg); c.cl = [];
      for (var i = 0; i < 9; i++) { var g = U.g(c.row); g._ring = U.token(g, 'evidence', { r: 17 }); g._disc = U.token(g, 'conclusion', { r: 17 }); g._flag = U.el('circle', { r: 25, fill: 'none', stroke: '#E58C7E', 'stroke-width': 3 }, g); U.place(g, PX - 200 + i * 50, 240); c.cl.push(g); }
      c.n1 = U.text(svg, PX, 340, '', 'cap', { 'text-anchor': 'middle' });
      c.n2 = U.text(svg, PX, 390, '', 'cap', { 'text-anchor': 'middle' });
      c.n3 = U.text(svg, PX, 450, '', 'lab lab--warm', { 'text-anchor': 'middle' });
      c.key = U.text(svg, PX, 300, 'ring: sourced  ·  disc: no source', 'lab', { 'text-anchor': 'middle' });
      c.loop = U.lines(svg, PX, 560, ['stop after one pass: flags go out', 'stop when nothing is flagged:', 'may never stop'], 'cap', 38, { 'text-anchor': 'middle' });
      c.rnd = U.text(svg, PX, 740, '', 'lab', { 'text-anchor': 'middle' });
      return c;
    },
    draw: function (c, t, U) {
      c.calm(U); c.hideAll(U);
      var p1 = U.cue(1), p2 = U.cue(2), p3 = U.cue(3);
      var v = t < p1 ? -1 : t < U.say(1, 'Paste the notes') ? 0 : t < p2 ? 1 : t < p3 ? 2 : 0;
      var tv = [U.cue(1), U.say(1, 'Paste the notes'), U.cue(2)][v] || 0;
      // the handoff message
      if (v >= 0 && t < p3) { c.send('ho' + v, 'both', 'orc', 'wr', t, tv + 0.2, 1.6, false); c.live([['orc', 'wr']], t >= tv && t < tv + 2); }
      if (t < p1) { c.send('n1', 'evidence', 'r1', 'doc', t, U.say(0, 'The researchers wrote'), 1.4, false); c.send('n2', 'evidence', 'r2', 'doc', t, U.say(0, 'The researchers wrote') + 0.3, 1.4, false); c.live([['r1', 'doc'], ['r2', 'doc']], t >= U.say(0, 'The researchers wrote') && t < U.say(0, 'The researchers wrote') + 2); }
      c.dim(['r2'], v === 2 ? 1 : 2); U.cls(c.l.r2doc, 'is-cut', v === 2);
      var shown = v >= 0 && t < p3 && t >= tv + 1.8, H = HV[Math.max(v, 0)];
      U.setText(c.var, v < 0 || t >= p3 ? (t >= p3 ? 'when to stop' : 'what the handoff carries') : ['notes with their links', 'notes as text, no links', 'researcher 1’s notes only'][v]);
      c.cl.forEach(function (g, i) {
        var x = H.claims[i], on = shown && !!x;
        U.op(g, on ? U.ramp(t, tv + 1.8 + i * 0.12, 0.3) : 0);
        if (x) { U.op(g._ring, x.src ? 1 : 0); U.op(g._disc, x.src ? 0 : 1); U.op(g._flag, !x.src && t >= tv + 3.4 ? 1 : 0); }
      });
      U.op(c.key, shown ? 1 : 0);
      U.setText(c.n1, shown ? H.claims.length + ' claims, ' + H.sourced + ' sourced' : ''); U.setText(c.n2, shown && t >= tv + 3.4 ? 'reviewer flags ' + H.flagged + ', circled' : '');
      U.setText(c.n3, shown && v === 2 && t >= U.say(2, 'The check passes') ? 'sub-question 2 missing, not reported' : '');
      // the revision loop
      if (t >= p3) {
        var per = 6, ph = (t - p3 - 1) % per, k = Math.floor((t - p3 - 1) / per);
        if (t >= p3 + 1) { c.send('L1', 'instruction', 'orc', 'wr', ph, 0, 1.3, false); c.send('L2', 'conclusion', 'wr', 'doc', ph, 1.4, 1.2, false); c.send('L3', 'both', 'doc', 'rv', ph, 2.8, 1.2, false); c.send('L4', 'conclusion', 'rv', 'orc', ph, 4.2, 1.6, false); }
        c.live([['orc', 'wr'], ['doc', 'wr'], ['doc', 'rv'], ['rv', 'orc']], t >= p3 + 1);
        U.setText(c.rnd, t >= p3 + 1 ? 'revision round ' + (k + 1) : '');
      } else U.setText(c.rnd, '');
      ['L1', 'L2', 'L3', 'L4'].forEach(function (key) { if (c.tk[key] && t < p3 + 1) U.op(c.tk[key], 0); });
      U.op(c.loop, t >= p3 ? U.ramp(t, U.say(3, 'Stop after the reviewer'), 0.6) : 0);
    } });

  // ------------------------------------------------------------ 15. disagreement
  NCMA.scene({ id: 'disagreement', note: WF, source: 'Kaesberg et al., 2025', desc: 'The briefing workflow. Both researchers send evidence rings to the draft, and the panel shows two conflicting notes: since 2021, from document d3, and a failure in 2020, from document d6. Then the four working agents send solid discs to the orchestrator as votes, with the caption: the tie is broken by two agents that read neither document. Then a dashed channel opens between the researchers and tokens pass until they agree. Finally both notes with links travel to the reviewer, and two document icons appear beside it: read both sources.',
    build: function (svg, U) {
      var c = brief(svg, U);
      c.note = U.g(svg);
      U.text(c.note, PX, 140, 'district 4: sensors since 2021', 'cap', { 'text-anchor': 'middle' }); U.text(c.note, PX, 180, 'from document d3', 'lab', { 'text-anchor': 'middle' });
      U.text(c.note, PX, 250, 'district 4: a sensor failed in 2020', 'cap', { 'text-anchor': 'middle' }); U.text(c.note, PX, 290, 'from document d6', 'lab', { 'text-anchor': 'middle' });
      c.cf = U.text(svg, PX, 350, 'cannot both be right as written', 'lab lab--warm', { 'text-anchor': 'middle' });
      c.proc = U.text(svg, PX, 450, '', 'big', { 'text-anchor': 'middle' });
      c.pk = U.lines(svg, PX, 530, [], 'cap', 36, { 'text-anchor': 'middle' });
      c.d3 = U.agent(svg, { x: 1160, y: 560, r: 30, role: 'doc', label: 'd3', ly: 62 }); c.d6 = U.agent(svg, { x: 1250, y: 560, r: 30, role: 'doc', label: 'd6', ly: 62 });
      return c;
    },
    draw: function (c, t, U) {
      c.calm(U); c.hideAll(U);
      var p1 = U.cue(1), p2 = U.cue(2), tC = U.say(1, 'A consensus procedure');
      c.send('c1', 'evidence', 'r1', 'doc', t, U.say(0, 'One reports'), 1.4, false); c.send('c2', 'evidence', 'r2', 'doc', t, U.say(0, 'The other reports'), 1.4, false);
      U.op(c.note, U.ramp(t, U.say(0, 'One reports') + 1.2, 0.6)); U.op(c.cf, U.ramp(t, U.say(0, 'Both cannot be right'), 0.6));
      var proc = '', lines = [];
      if (t >= p1 && t < tC) {
        proc = 'vote'; var tv = U.say(1, 'A vote asks');
        ['r1', 'r2', 'wr', 'rv'].forEach(function (id, i) {
          var A = c.a[id], O = c.a.orc, ang = [-1.05, 0.5, -0.5, 0][i], end = [O.x + 74 * Math.cos(ang), O.y + 74 * Math.sin(ang)];
          if (!c.tk['v' + id]) c.tk['v' + id] = U.token(c.tg, 'conclusion', { r: 16 });
          U.fly(c.tk['v' + id], [U.seg([A.x, A.y], end, A.r + 10, 0)[0], end], t, tv + 0.3 + i * 0.25, 1.8, true);
        });
        c.live([['orc', 'r1'], ['orc', 'r2'], ['orc', 'wr'], ['rv', 'orc']], t >= tv && t < tv + 2.4);
        if (t >= U.say(1, 'The researchers split')) lines = ['researchers split one to one', 'two agents that read neither', 'document break the tie'];
        c.dim(['wr', 'rv'], 2);
      } else ['r1', 'r2', 'wr', 'rv'].forEach(function (id) { if (c.tk['v' + id]) U.op(c.tk['v' + id], 0); });
      if (t >= tC && t < p2) {
        proc = 'consensus'; U.op(c.l.r1r2, 0.9); U.cls(c.l.r1r2, 'is-live', true);
        var ph = (t - tC - 0.5) % 2.4; c.send('x1', 'both', 'r1', 'r2', ph, 0, 1.1, false); c.send('x2', 'both', 'r2', 'r1', ph, 1.2, 1.1, false);
        if (t < tC + 0.5) { U.op(c.tk.x1, 0); U.op(c.tk.x2, 0); }
        if (t >= U.say(1, 'Agreement, however')) lines = ['agreement reached, but', 'by persuasion or deference', 'as easily as by the documents'];
      } else { U.op(c.l.r1r2, 0); if (c.tk.x1) { U.op(c.tk.x1, 0); U.op(c.tk.x2, 0); } }
      var tS = U.say(2, 'The third procedure');
      if (t >= p2) { proc = 'read the sources'; c.send('s', 'both', 'doc', 'rv', t, tS + 0.3, 1.6, true); c.live([['doc', 'rv']], t >= tS && t < tS + 2); if (t >= U.say(2, 'It may find')) lines = ['one document wrong,', 'two different sensors,', 'or a discrepancy to report']; }
      U.op(c.d3.g, t >= p2 ? U.ramp(t, tS + 2, 0.6) : 0); U.op(c.d6.g, t >= p2 ? U.ramp(t, tS + 2, 0.6) : 0);
      U.setText(c.proc, proc); U.op(c.proc, proc ? 1 : 0);
      clear(c.pk); lines.forEach(function (s, i) { var ts = U.el('tspan', { x: PX, dy: i ? 36 : 0 }, c.pk); ts.textContent = s; });
    } });

  // ------------------------------------------------------------ 16. commitment
  NCMA.scene({ id: 'commitment', note: WF, source: 'Jennings, 1993', desc: 'The briefing workflow. The orchestrator sends researcher 2 its sub-question and receives an acceptance. The link from researcher 2 to the search tool fails, marked with an x. In the first run nothing is sent, the writer is dispatched on schedule and only researcher 1’s notes reach the draft; the panel reads: no message, sub-question 2 silently missing. In the second run researcher 2 sends a disc to the orchestrator saying it cannot finish. Then a task record appears in the panel with owner, status and deadline, its status changing from accepted to failed, reported.',
    build: function (svg, U) {
      var c = brief(svg, U);
      c.x = U.token(svg, 'lost', { r: 20 }); U.place(c.x, 715, 520);
      c.run = U.text(svg, PX, 130, '', 'word--lg', { 'text-anchor': 'middle' });
      c.res = U.lines(svg, PX, 230, [], 'cap', 38, { 'text-anchor': 'middle' });
      c.rec = U.g(svg);
      U.el('rect', { x: PX - 230, y: 420, width: 460, height: 300, rx: 10, 'class': 'box box--hi' }, c.rec);
      U.text(c.rec, PX, 470, 'task record', 'lab lab--hi', { 'text-anchor': 'middle' });
      U.text(c.rec, PX - 200, 530, 'task: sub-question 2', 'cap'); U.text(c.rec, PX - 200, 580, 'owner: researcher 2', 'cap');
      c.stat = U.text(c.rec, PX - 200, 630, '', 'cap'); U.text(c.rec, PX - 200, 680, 'deadline: before drafting', 'cap');
      return c;
    },
    draw: function (c, t, U) {
      c.calm(U); c.hideAll(U);
      var p1 = U.cue(1), p2 = U.cue(2), second = t >= p1;
      var base = second ? p1 + 0.3 : U.say(0, 'When the second researcher accepts');
      c.send('as' + (second ? 2 : 1), 'instruction', 'orc', 'r2', t, base, 1.4, false); c.send('ok' + (second ? 2 : 1), 'conclusion', 'r2', 'orc', t, base + 1.6, 1.4, false, 'ok');
      var tf = second ? base + 3.2 : U.say(0, 'Suppose the search tool fails');
      U.op(c.x, U.ramp(t, tf, 0.4)); U.cls(c.l.r2web, 'is-cut', t >= tf);
      c.send('n1' + (second ? 2 : 1), 'evidence', 'r1', 'doc', t, tf + 0.4, 1.4, false);
      var lines = [];
      if (!second) {
        var td = U.say(0, 'the writer drafts on schedule');
        c.send('dw', 'instruction', 'orc', 'wr', t, td, 1.6, false); c.live([['orc', 'wr']], t >= td && t < td + 1.8);
        U.cls(c.a.wr.g, 'is-on', t >= td + 1.6);
        if (t >= tf + 1) lines.push('no message from researcher 2');
        if (t >= U.say(0, 'nothing in the log records')) lines.push('sub-question 2 silently missing');
      } else {
        ['dw'].forEach(function (k) { if (c.tk[k]) U.op(c.tk[k], 0); }); U.cls(c.a.wr.g, 'is-on', false);
        var tm = U.say(1, 'tells the orchestrator');
        c.send('cant', 'conclusion', 'r2', 'orc', t, tm, 1.6, true, '!'); c.live([['orc', 'r2']], t >= tm && t < tm + 1.8);
        if (t >= tm + 1.6) lines.push('reported: cannot finish');
        if (t >= U.say(1, 'can reassign the work')) lines.push('reassign, wait, or tell the person');
      }
      ['as1', 'ok1', 'n11'].forEach(function (k) { if (second && c.tk[k]) U.op(c.tk[k], 0); });
      U.setText(c.run, second ? 'run 2: one message added' : 'run 1: silence'); U.op(c.run, U.ramp(t, base, 0.5));
      clear(c.res); lines.forEach(function (s, i) { var ts = U.el('tspan', { x: PX, dy: i ? 38 : 0 }, c.res); ts.textContent = s; });
      U.cls(c.res, 'lab--warm', false);
      var tr = U.say(2, 'as a task record');
      U.op(c.rec, t >= p2 ? U.ramp(t, tr, 0.6) : 0);
      U.setText(c.stat, t >= U.say(2, 'a rule for what happens on failure') ? 'status: failed, reported' : 'status: accepted');
    } });
})();
