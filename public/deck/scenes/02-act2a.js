// @scenes evidence-exchange conclusion-exchange
/* Act II, first part: topology, reading load, the evidence/conclusion counterfactual,
   and the measured result. Pure functions of t. */
(function () {
  'use strict';
  var NCMA = window.NCMA, M = NCMA.models;
  var ILL = 'Illustrative model · outcomes follow from stated rules';

  // three small networks of six agents in a row; a message starts at the same agent
  function net(svg, U, ox, name) {
    var c = { ag: [], links: [], ox: ox }, P = [];
    var nRim = name === 'star' ? 5 : 6;
    for (var i = 0; i < nRim; i++) { var th = -Math.PI / 2 + i * 2 * Math.PI / nRim; P.push([ox + 175 * Math.cos(th), 360 + 175 * Math.sin(th)]); }
    var E = name === 'chain' ? [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5]] : name === 'star' ? [[5, 0], [5, 1], [5, 2], [5, 3], [5, 4]] : (function () { var e = []; for (var a = 0; a < 6; a++) for (var b = a + 1; b < 6; b++) e.push([a, b]); return e; })();
    if (name === 'star') P.push([ox, 360]);
    c.P = P; c.E = E;
    c.lg = U.g(svg); c.ng = U.g(svg); c.tg = U.g(svg);
    E.forEach(function (e) { c.links.push(U.link(c.lg, { x: P[e[0]][0], y: P[e[0]][1], r: 26 }, { x: P[e[1]][0], y: P[e[1]][1], r: 26 }, {})); });
    P.forEach(function (p, i) { c.ag.push(U.agent(c.ng, { x: p[0], y: p[1], r: name === 'star' && i === 5 ? 32 : 26, role: name === 'star' && i === 5 ? 'hub' : null })); });
    // breadth-first hops from agent 0
    var hop = P.map(function () { return Infinity; }); hop[0] = 0; var frontier = [0];
    while (frontier.length) { var nx = []; frontier.forEach(function (u) { E.forEach(function (e) { var v = e[0] === u ? e[1] : e[1] === u ? e[0] : -1; if (v >= 0 && hop[v] === Infinity) { hop[v] = hop[u] + 1; nx.push(v); } }); }); frontier = nx; }
    c.hop = hop; c.maxHop = Math.max.apply(null, hop);
    c.tk = E.map(function () { return U.token(c.tg, 'evidence', { r: 12 }); });
    c.title = U.text(svg, ox, 675, name === 'chain' ? 'chain' : name === 'star' ? 'star' : 'fully connected', 'word--lg', { 'text-anchor': 'middle' });
    c.sub = U.text(svg, ox, 720, '', 'lab', { 'text-anchor': 'middle' });
    return c;
  }
  function spread(c, U, t, t0, step) {
    c.ag.forEach(function (a, i) { var got = t >= t0 + c.hop[i] * step; U.cls(a.g, 'is-on', got && t >= t0); });
    c.E.forEach(function (e, j) {
      var u = c.hop[e[0]] <= c.hop[e[1]] ? e[0] : e[1], v = u === e[0] ? e[1] : e[0];
      if (c.hop[v] === c.hop[u] + 1) { var s = [[c.P[u][0], c.P[u][1]], [c.P[v][0], c.P[v][1]]]; U.fly(c.tk[j], s, t, t0 + c.hop[u] * step, step * 0.85, false); U.cls(c.links[j], 'is-live', t >= t0 + c.hop[u] * step && t < t0 + c.hop[v] * step); }
      else { U.op(c.tk[j], 0); U.cls(c.links[j], 'is-live', false); }
    });
  }

  NCMA.scene({ id: 'one-message', note: '', desc: 'Three networks of six agents side by side: a chain, a star and a fully connected network. A message starts at the top agent in each and spreads: five relays in the chain, two steps through the hub in the star, one step in the fully connected network.',
    build: function (svg, U) { return { n: [net(svg, U, 260, 'chain'), net(svg, U, 884, 'star'), net(svg, U, 1508, 'complete')] }; },
    draw: function (c, t, U) {
      var t0 = U.say(0, 'Watch one message'), p1 = U.cue(1), p2 = U.cue(2), per = 9;
      var focus = t < p1 ? -1 : t < U.say(1, 'In a star') ? 0 : t < U.say(1, 'In a fully') ? 1 : t < p2 ? 2 : -1;
      c.n.forEach(function (n, i) {
        var start = focus === -1 ? t0 : [p1 + 0.5, U.say(1, 'In a star') + 0.3, U.say(1, 'In a fully') + 0.3][i];
        var tt = t >= p2 ? p2 + ((t - p2) % per) : t;
        spread(n, U, tt, t >= p2 ? p2 : start, 1.2);
        U.em(n.lg, focus === -1 || focus === i ? 2 : 1); U.em(n.ng, focus === -1 || focus === i ? 2 : 1);
        var subs = ['5 relays to reach the far end', '2 steps, all through the hub', '1 step, 15 channels'];
        U.setText(n.sub, t >= p1 ? subs[i] : ''); U.op(n.sub, U.ramp(t, p1, 0.6));
      });
    } });

  NCMA.scene({ id: 'reading-load', note: '', desc: 'Left: a fully connected network of six agents, each marked with the number 5, the messages it receives in a round. Right: a star of six, the hub marked 5 and each other agent 1. Then both networks fade and two agents are compared: one receives five rings that are copies of the same clue and holds one clue; the other receives a single message carrying five clues and holds five.',
    build: function (svg, U) {
      var c = { L: net(svg, U, 420, 'complete'), R: net(svg, U, 1340, 'star') };
      function badges(n, k) { return n.P.map(function (p, i) {
        var dx = p[0] - n.ox, dy = p[1] - 360, d = Math.hypot(dx, dy), x, y;
        if (d < 1) { var th = 18 * Math.PI / 180; x = p[0] + 62 * Math.cos(th); y = p[1] + 62 * Math.sin(th); } else { x = p[0] + dx / d * 62; y = p[1] + dy / d * 62; }
        return U.text(svg, x, y + 9, String(k(i)), 'word', { 'text-anchor': 'middle', style: 'fill:var(--warm);font-weight:600' }); }); }
      c.bL = badges(c.L, function () { return 5; }); c.bR = badges(c.R, function (i) { return i === 5 ? 5 : 1; });
      c.big = U.text(svg, 884, 790, '', 'cap', { 'text-anchor': 'middle' });
      // the comparison: five copies of one clue against one message carrying five clues
      c.cmp = U.g(svg);
      c.x1 = U.agent(c.cmp, { x: 560, y: 420, r: 54, label: 'reads 5 · holds 1 clue', ly: 104 });
      c.x2 = U.agent(c.cmp, { x: 1300, y: 420, r: 54, label: 'reads 1 · holds 5 clues', ly: 104 });
      U.text(c.cmp, 560, 230, 'five copies of the same clue', 'cap', { 'text-anchor': 'middle' });
      U.text(c.cmp, 1300, 230, 'one message carrying five clues', 'cap', { 'text-anchor': 'middle' });
      c.copies = [0, 1, 2, 3, 4].map(function () { return U.token(c.cmp, 'evidence', { r: 14 }); });
      c.pack = U.g(c.cmp); U.el('circle', { r: 30, 'class': 'tk-ring' }, c.pack); [0, 1, 2, 3, 4].forEach(function (k) { var a = -Math.PI / 2 + k * 2 * Math.PI / 5; U.el('circle', { cx: 13 * Math.cos(a), cy: 13 * Math.sin(a), r: 5, 'class': 'tk-core' }, c.pack); });
      return c;
    },
    draw: function (c, t, U) {
      var tL = U.say(0, 'In the fully connected'), tR = U.say(0, 'At the hub'), p1 = U.cue(1), cmp = U.ramp(t, p1 + 0.3, 0.8);
      c.bL.forEach(function (b) { U.op(b, U.ramp(t, tL + 0.6, 0.6) * (1 - cmp)); });
      c.bR.forEach(function (b) { U.op(b, U.ramp(t, tR + 0.6, 0.6) * (1 - cmp)); });
      [c.L, c.R].forEach(function (n) { [n.lg, n.ng, n.title, n.sub].forEach(function (e) { U.op(e, 1 - cmp); }); n.tk.forEach(function (k) { U.op(k, 0); }); });
      U.setText(c.L.sub, '5 messages to each agent'); U.setText(c.R.sub, 'hub 5, others 1');
      if (t < p1) { U.op(c.L.sub, U.ramp(t, tL, 0.6)); U.op(c.R.sub, U.ramp(t, tR, 0.6)); }
      U.op(c.cmp, cmp);
      var tc = U.say(1, 'An agent can receive five'), ts = U.say(1, 'or one message');
      c.copies.forEach(function (k, i) { if (t >= p1) U.fly(k, [[160, 300], [460 + i * 50, 300]], t, tc + i * 0.35, 1.2, true); else U.op(k, 0); });
      if (t >= p1) U.fly(c.pack, [[1660, 300], [1300, 300]], t, ts, 1.6, true); else U.op(c.pack, 0);
      U.op(c.x1.label, U.ramp(t, tc + 3, 0.6)); U.op(c.x2.label, U.ramp(t, ts + 2, 0.6));
      U.setText(c.big, t >= p1 ? 'fan-in counts what an agent must read, not what it learns' : '');
      U.op(c.big, U.ramp(t, U.say(1, 'Fan-in measures') , 0.8));
    } });

  // ---------------------------------------------- the counterfactual pair
  var EV = M.runSix({ topology: 'complete', mode: 'evidence', rounds: 1 });
  var CC = M.runSix({ topology: 'complete', mode: 'conclusion', rounds: 1 });
  function pairScene(id, mode, H) {
    var EVM = mode === 'evidence', focus = EVM ? 'a1' : 'a5';
    NCMA.scene({ id: id, note: '', desc: EVM
      ? 'Six agents joined by all fifteen channels. Each sends its own clue, drawn with its color and size, to all five others. A panel follows the top agent: its own weak clue for B, then five received clues, four weak for B and two strong for A in all. A balance tips toward A and the top agent moves to A. Then every agent, applying the same rule to the same six clues, moves to A.'
      : 'The same six agents and channels. Each now sends only its answer, a solid disc marked A or B. A panel follows an agent holding a strong clue for A: it counts its own answer with the five it hears, two A against four B, and moves to B, while its strong clue stays unchanged and unseen by the others. Then the other strong agent moves to B as well, and the group ends at B.',
      build: function (svg, U) {
        var c = NCMA.six(svg, U, { cx: 520, cy: 400, R: 260 });
        c.head = U.text(svg, 1300, 60, EVM ? 'messages carry evidence' : 'messages carry only answers', 'word--lg', { 'text-anchor': 'middle' });
        c.pan = U.g(svg);
        U.text(c.pan, 1300, 150, EVM ? 'the top agent receives' : 'an agent with a strong clue for A hears', 'lab', { 'text-anchor': 'middle' });
        if (EVM) {
          var row = ['a1', 'a2', 'a3', 'a4', 'a5', 'a6'];
          c.row = row.map(function (a, i) { var w = M.SIX.clue[a], tk = U.token(c.pan, 'evidence', { r: Math.abs(w) > 1 ? 24 : 14, cls: w > 0 ? 'clue-A' : 'clue-B' }); U.place(tk, 1075 + i * 90, 230); return tk; });
          c.ownLab = U.text(c.pan, 1075, 290, 'own', 'lab', { 'text-anchor': 'middle' });
          c.inLab = U.text(c.pan, 1345, 290, 'received', 'lab', { 'text-anchor': 'middle' });
          c.bal = NCMA.balance(c.pan, U, 1300, 270);
          c.dec = U.text(c.pan, 1300, 640, 'the top agent moves to A', 'word--lg', { 'text-anchor': 'middle' });
        } else {
          var votes = ['A', 'B', 'B', 'B', 'B', 'A'];
          c.row = votes.map(function (v, i) { var tk = U.token(c.pan, 'conclusion', { r: 22, label: v }); U.place(tk, 1075 + i * 90, 230); return tk; });
          c.ownLab = U.text(c.pan, 1075, 290, 'own', 'lab', { 'text-anchor': 'middle' });
          c.inLab = U.text(c.pan, 1345, 290, 'heard', 'lab', { 'text-anchor': 'middle' });
          c.cnt = U.text(c.pan, 1300, 380, 'A 2  ·  B 4', 'big', { 'text-anchor': 'middle' });
          c.cntLab = U.text(c.pan, 1300, 430, 'the majority of answers counted', 'lab', { 'text-anchor': 'middle' });
          c.own = U.token(c.pan, 'evidence', { r: 24, cls: 'clue-A' }); U.place(c.own, 1300, 510);
          c.ownClue = U.text(c.pan, 1300, 570, 'its strong clue: unchanged, never sent', 'lab', { 'text-anchor': 'middle' });
          c.dec = U.text(c.pan, 1300, 640, 'it moves to B', 'word--lg', { 'text-anchor': 'middle' });
        }
        c.k3 = U.text(svg, 1300, 740, EVM ? 'the group reaches A' : 'the group ends at B', 'big ' + (EVM ? 'big--hi' : 'big--warm'), { 'text-anchor': 'middle' });
        return c;
      },
      draw: function (c, t, U) {
        c.clues(1); c.topo('complete', t, 0.3);
        var send = U.say(0, EVM ? 'each agent sends its clue' : 'Each agent now sends its current answer'), land = send + 2.2;
        c.round(H, 1, mode, t, send, 2);
        Object.keys(c.links).forEach(function (k) { U.cls(c.links[k], 'is-live', t >= send && t < land); });
        var tf = U.say(1, EVM ? 'Follow the top agent' : 'Follow the agent at lower right'), t0 = Math.max(tf, land);
        U.op(c.pan, U.ramp(t, t0, 0.6));
        c.row.forEach(function (tk, i) { U.op(tk, U.ramp(t, t0 + (i ? 0.6 + i * 0.35 : 0), 0.4)); });
        U.op(c.ownLab, U.ramp(t, t0, 0.4)); U.op(c.inLab, U.ramp(t, t0 + 0.9, 0.4));
        var tw = U.say(1, EVM ? 'Weighed together' : 'it counts its own answer'), td;
        if (EVM) { U.op(c.bal.g, U.ramp(t, tw, 0.8)); c.bal.tilt(6 * U.ramp(t, tw + 1, 2)); td = Math.max(tw + 3, U.say(1, 'so the top agent moves to A')); }
        else { U.op(c.cnt, U.ramp(t, tw, 0.6)); U.op(c.cntLab, U.ramp(t, tw, 0.6)); U.op(c.own, U.ramp(t, tw + 1, 0.6) * 0.45); U.op(c.ownClue, U.ramp(t, tw + 1, 0.6)); td = Math.max(tw + 2, U.say(1, 'so it moves to B')); }
        U.op(c.dec, U.ramp(t, td, 0.6));
        var tall = U.say(EVM ? 1 : 2, EVM ? 'Every other agent receives' : 'The other strong agent');
        M.SIX.agents.forEach(function (a) { c.judge(a, (a === focus ? t >= td : t >= tall) ? H[1].judge[a] : H[0].judge[a]); });
        U.op(c.k3, U.ramp(t, tall + 1.5, 0.8));
        c.ag[focus].shape.style.filter = t >= t0 && t < tall ? 'drop-shadow(0 0 12px rgba(111,216,190,.7))' : '';
      } });
  }
  var P = { clear: function (g) { while (g.firstChild) g.removeChild(g.firstChild); } };
  pairScene('evidence-exchange', 'evidence', EV);
  pairScene('conclusion-exchange', 'conclusion', CC);

  // ---------------------------------------------- the measured result
  NCMA.scene({ id: 'measured-agents', note: 'Reported finding · study design and findings, no values drawn', source: 'Gladstone, 2026 (under revision)', desc: 'Left panel, what the illustrative rule predicts: a network in which every agent ends at the majority answer B, in every run. Right panel, what measured language-model agents did under conclusion sharing: three statements: with evidence shared, initial accuracy largely kept; with answers shared, less accurate in two of three model families; why, final answers varied widely from run to run. Then a label reads that at the highest exposure tested, sharing evidence was less accurate than sharing conclusions.',
    build: function (svg, U) {
      var c = {};
      c.L = U.g(svg); c.R = U.g(svg);
      U.text(c.L, 420, 80, 'the illustrative rule, answers shared', 'word--lg', { 'text-anchor': 'middle' });
      U.text(c.R, 1320, 80, 'what measured agents did', 'word--lg', { 'text-anchor': 'middle' });
      U.el('line', { x1: 884, y1: 60, x2: 884, y2: 620, 'class': 'rule' }, svg);
      // runs as rows of six dots: prediction = all B in every run; measured = schematic spread (labelled)
      var pred = ['BBBBBB', 'BBBBBB', 'BBBBBB', 'BBBBBB', 'BBBBBB'];

      function rows(g, ox, R) { return R.map(function (row, i) { var rg = U.g(g); U.text(rg, ox - 200, 190 + i * 80, 'run ' + (i + 1), 'lab', { 'text-anchor': 'end' }); row.split('').forEach(function (v, j) { var a = U.agent(rg, { x: ox - 150 + j * 60, y: 182 + i * 80, r: 20, mark: v }); U.cls(a.g, 'is-' + v, true); a.mark.style.fontSize = '18px'; }); return rg; }); }
      c.pr = rows(c.L, 560, pred);
      var stm = [['evidence shared', 'initial accuracy largely kept', 'lab--hi'], ['answers shared', 'less accurate in 2 of 3 model families', 'lab--warm'], ['why', 'final answers varied widely from run to run', 'lab--warm']];
      c.mr = stm.map(function (r, i) { var g = U.g(c.R), y = 200 + i * 130; U.text(g, 960, y, r[0], 'lab ' + r[2]); U.text(g, 960, y + 46, r[1], 'cap'); return g; });
      c.schem = U.text(c.R, 1320, 600, 'reported qualitatively · no values drawn', 'lab', { 'text-anchor': 'middle' });
      c.f1 = U.text(svg, 884, 680, '', 'cap', { 'text-anchor': 'middle' });
      c.f2 = U.text(svg, 884, 740, '', 'cap', { 'text-anchor': 'middle' });
      return c;
    },
    draw: function (c, t, U) {
      U.op(c.L, U.ramp(t, 0.5, 0.8));
      c.pr.forEach(function (g, i) { U.op(g, U.ramp(t, 1 + i * 0.4, 0.5)); });
      var tm = U.say(2, 'Sharing only conclusions'), tv = U.say(2, 'different runs');
      U.op(c.R, U.ramp(t, U.cue(1), 0.8));
      var tE = U.say(2, 'sharing evidence largely'); [tE, tm, tv].forEach(function (t0, i) { U.op(c.mr[i], U.ramp(t, t0, 0.6)); });
      U.op(c.schem, U.ramp(t, tv + 2.6, 0.6));
      U.op(c.f1, 0);
      U.setText(c.f2, t >= U.cue(3) ? 'with more peers heard, sharing evidence fell below sharing answers' : ''); U.op(c.f2, U.ramp(t, U.say(3, 'At the highest level'), 0.6));
    } });
})();

/* From record to drawing: the briefing log plays, the traffic graph is drawn from it,
   then the drawn route reviewer -> orchestrator -> writer is shown to be impossible in time. */
(function () {
  'use strict';
  var NCMA = window.NCMA, M = NCMA.models;
  NCMA.scene({ id: 'from-record', note: 'Illustrative run · authored briefing log', source: 'Holme & Saramäki, 2012', desc: 'A briefing workflow: an approver, an orchestrator, two researchers, a search tool, a shared draft, a writer and a reviewer. Fifteen messages play in order and each adds a numbered line to a log on the right. The network is then drawn from the log, lines thickening with repeated traffic. Finally the route from the reviewer through the orchestrator to the writer is highlighted: the orchestrator-to-writer message is labeled step 6 and the reviewer-to-orchestrator message step 10, and the writer is marked as never reached by the objection.',
    build: function (svg, U) {
      var c = { A: {} };
      var P = { hu: [70, 400, 'human', 'approver', 'h'], orc: [300, 400, 'hub', 'orchestrator', 'h'], r1: [560, 170, null, 'researcher 1'], r2: [560, 630, null, 'researcher 2'], web: [760, 400, 'tool', 'search'], doc: [930, 230, 'doc', 'shared draft'], wr: [1180, 120, null, 'writer'], rv: [1180, 560, null, 'reviewer'] };
      c.lg = U.g(svg); c.ng = U.g(svg); c.tg = U.g(svg);
      Object.keys(P).forEach(function (k) { var p = P[k]; c.A[k] = U.agent(c.ng, { x: p[0], y: p[1], r: p[2] === 'tool' ? 40 : 38, role: p[2], label: p[3] }); });
      var pair = {}; c.links = []; c.msgs = [];
      M.BRIEF.log.forEach(function (e, i) {
        var key = [e.from, e.to].sort().join('|');
        if (!pair[key]) { pair[key] = { n: 0, first: i, ln: U.link(c.lg, c.A[e.from], c.A[e.to], {}) }; c.links.push(pair[key]); }
        pair[key].n++;
        c.msgs.push({ e: e, tk: U.token(c.tg, e.kind === 'both' ? 'both' : e.kind, { r: 13 }), pts: U.seg([c.A[e.from].x, c.A[e.from].y], [c.A[e.to].x, c.A[e.to].y], 44, 44), pair: pair[key] });
      });
      c.pair = pair;
      var SH = { hu: 'approver', orc: 'orch.', r1: 'res. 1', r2: 'res. 2', web: 'search', doc: 'draft', wr: 'writer', rv: 'reviewer' };
      U.text(svg, 1400, 40, 'LOG', 'lab lab--hi');
      c.rows = M.BRIEF.log.map(function (e, i) { return U.text(svg, 1400, 84 + i * 47, e.t + '   ' + SH[e.from] + ' → ' + SH[e.to], 'lab'); });
      c.hiA = U.link(svg, c.A.rv, c.A.orc, { arrow: true, cls: 'is-bad' }); c.hiB = U.link(svg, c.A.orc, c.A.wr, { arrow: true, cls: 'is-bad' });
      c.s10 = U.text(svg, 900, 560, 'step 10', 'word', { 'text-anchor': 'middle' }); c.s6 = U.text(svg, 820, 200, 'step 6', 'word', { 'text-anchor': 'middle' });
      c.never = U.text(svg, 1180, 230, 'objection never reached', 'lab lab--alert', { 'text-anchor': 'middle' });
      return c;
    },
    draw: function (c, t, U) {
      var t0 = U.say(0, 'An orchestrator splits'), t1 = U.cue(1) - 1, n = c.msgs.length, per = (t1 - t0) / n;
      var p1 = U.cue(1), p2 = U.cue(2), graph = U.ramp(t, U.say(1, 'Every pair'), 1.2);
      c.msgs.forEach(function (m, i) {
        var ts = t0 + i * per;
        if (t < p1) U.fly(m.tk, m.pts, t, ts, per * 0.85, false); else U.op(m.tk, 0);
        U.op(c.rows[i], t >= ts + per * 0.85 ? (t >= p1 ? 0.45 : 1) : 0);
      });
      c.links.forEach(function (L) {
        var seen = t >= t0 + L.first * per + per * 0.85;
        U.op(L.ln, t < p1 ? (seen ? 0.35 : 0) : 0.35 + 0.65 * graph);
        L.ln.style.strokeWidth = (1.6 + (L.n - 1) * 2.4 * graph).toFixed(2);
      });
      var hA = U.ramp(t, U.say(2, 'It shows a route'), 0.8), hT = U.ramp(t, U.say(2, 'In the log it could not'), 0.6);
      [9, 13].forEach(function (i) { U.cls(c.rows[i], 'lab--alert', hT > 0); if (hT > 0) U.op(c.rows[i], 0.45 + 0.55 * hT); });
      U.op(c.hiA, hA); U.op(c.hiB, hA); U.op(c.s10, hT); U.op(c.s6, hT); U.op(c.never, U.ramp(t, U.say(2, 'and the reviewer reported'), 0.6));
      U.cls(c.A.wr.g, 'is-bad', t >= U.say(2, 'and the reviewer reported') + 0.6);
      U.em(c.lg, t >= p2 ? 1 : 2); ['hu', 'r1', 'r2', 'web', 'doc'].forEach(function (k) { U.em(c.A[k].g, t >= p2 ? 1 : 2); });
    } });
})();
