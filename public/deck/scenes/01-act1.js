/* Act I scenes. Every draw() is a pure function of t (seconds into the scene).
   U.cue(k) is the start of passage k; U.say(k, phrase) is when the reader reaches
   the phrase at the timeline's reading pace. */
(function () {
  'use strict';
  var NCMA = window.NCMA, M = NCMA.models;
  var ILL = 'Illustrative model · outcomes follow from stated rules';

  // ------------------------------------------------------------------ cover
  NCMA.scene({ id: 'cover', noHeader: true, note: '', desc: 'Title card. On the left, the title Networks of communicating machine agents and a one-line description. On the right, six agents on a hexagon joined by faint channels, each holding one clue of a different size; once playback starts, a message travels between two of them.',
    build: function (svg, U) {
      var c = NCMA.six(svg, U, { cx: 1260, cy: 400, R: 250 });
      U.text(svg, 0, 150, 'AN ANIMATED TALK', 'lab lab--hi');
      U.lines(svg, 0, 250, ['Networks of', 'communicating', 'machine agents'], 'big', 72, { style: 'font-size:66px' });
      U.lines(svg, 0, 520, ['How communication changes what a group', 'of AI agents can do and conclude, how such', 'systems fail, and what the evidence supports'], 'cap', 40);
      U.el('line', { x1: 0, y1: 640, x2: 620, y2: 640, 'class': 'rule' }, svg);
      U.text(svg, 0, 690, 'press play to begin', 'lab');
      c.msg = U.token(c.tk, 'evidence', { r: 15 });
      return c;
    },
    draw: function (c, t, U) {
      M.SIX.agents.forEach(function (a) { c.judge(a, ''); });
      c.clues(1);
      Object.keys(c.links).forEach(function (k) { U.op(c.links[k], 0.2); });
      var A = c.pos.a5, B = c.pos.a1, per = 6, ph = t > 1 ? (t - 1) % per : -1;
      if (ph < 0) U.op(c.msg, 0); else U.fly(c.msg, U.seg([A[0], A[1]], [B[0], B[1]], 50, 50), ph, 0, 2.4, false);
    } });

  // ------------------------------------------------------------------ systems of agents
  NCMA.scene({ id: 'systems-of-agents', note: '', desc: 'A request enters from the left. Four components appear in a row, labeled search, read, draft and review, followed by a box labeled shown or carried out, and arrows join them. A token passes along the row, changing form at each component, under the caption each output becomes the next input. The row then gives way to the same four components and the output joined as a small network, with four lines of earlier research beside it: collective intelligence, distributed knowledge, influence and structure, and distributed computing. A line below the network says messages carry text: evidence, instructions, interpretations. Finally the four lines give way to four research problems, and each highlights a feature of the network: a link for whether exchange helps or only adds work, two links from one agent for dependence and propagated error, the links into the output for what reaches the decision, and a dashed record around the network for evidence about the exchanges.',
    build: function (svg, U) {
      var c = {};
      // passage 0: a pipeline of components
      c.row = U.g(svg);
      var RX = [330, 640, 950, 1260], RY = 380, names = ['search', 'read', 'draft', 'review'];
      c.req = U.text(c.row, 90, RY - 60, 'a request', 'lab', { 'text-anchor': 'middle' });
      c.reqTk = U.token(c.row, 'instruction', { r: 16 }); U.place(c.reqTk, 90, RY);
      c.comp = names.map(function (n, i) { return U.agent(c.row, { x: RX[i], y: RY, r: 54, role: i === 0 ? 'tool' : '', label: n, ly: 100 }); });
      c.out = U.g(c.row); U.el('rect', { x: 1490, y: RY - 50, width: 200, height: 100, rx: 10, 'class': 'box box--hi' }, c.out);
      U.lines(c.out, 1590, RY - 6, ['shown or', 'carried out'], 'lab', 30, { 'text-anchor': 'middle' });
      var stops = [[90, RY]].concat(RX.map(function (x) { return [x, RY]; })).concat([[1490, RY]]);
      c.arr = []; for (var i = 0; i < 5; i++) c.arr.push(U.link(c.row, { x: stops[i][0], y: RY, r: i === 0 ? 16 : 54 }, { x: stops[i + 1][0], y: RY, r: i === 4 ? 0 : 54 }, { arrow: true }));
      c.flow = ['instruction', 'evidence', 'both', 'conclusion', 'conclusion'].map(function (k) { return U.token(c.row, k, { r: 15 }); });
      c.stops = stops;
      c.rowCap = U.text(c.row, 884, 640, 'each output becomes the next input', 'cap', { 'text-anchor': 'middle' });
      // passages 1-2: the same parts as a network
      c.net = U.g(svg);
      var NP = [[300, 170, 'search'], [640, 170, 'read'], [300, 430, 'draft'], [640, 430, 'review']];
      c.nodes = NP.map(function (q, i) { return { x: q[0], y: q[1], r: 44 }; });
      c.el = {}; var E = [[0, 1], [0, 2], [1, 3], [2, 3], [1, 2], [0, 3]];
      E.forEach(function (e) { c.el[e.join('')] = U.link(c.net, c.nodes[e[0]], c.nodes[e[1]], {}); });
      c.into = [2, 3].map(function (k) { return U.link(c.net, c.nodes[k], { x: 470, y: 580, r: 0 }, { arrow: true }); });
      NP.forEach(function (q, i) { U.agent(c.net, { x: q[0], y: q[1], r: 44, role: i === 0 ? 'tool' : '', label: q[2], ly: i < 2 ? -66 : 82 }); });
      c.dec = U.g(c.net); c.decBox = U.el('rect', { x: 390, y: 586, width: 160, height: 64, rx: 10, 'class': 'box' }, c.dec); U.text(c.dec, 470, 626, 'output', 'lab', { 'text-anchor': 'middle' });
      c.rec = U.el('rect', { x: 170, y: 70, width: 600, height: 610, rx: 14, 'class': 'box ln--dash' }, svg);
      c.recLab = U.text(svg, 190, 56, 'record of the exchanges', 'lab lab--hi', { 'text-anchor': 'start' });
      c.txt = U.text(c.net, 470, 740, 'messages carry text: evidence, instructions, interpretations', 'lab lab--t2', { 'text-anchor': 'middle' });
      c.trad = U.g(svg); c.tl = [];
      [['collective intelligence', 'when a group outperforms its members'], ['distributed knowledge', 'using what no single member holds'], ['influence and structure', 'who learns what from whom'], ['distributed computing', 'guarantees when messages fail']].forEach(function (r, i) {
        var g = U.g(c.trad); U.text(g, 920, 150 + i * 150, r[0], 'word', { 'text-anchor': 'start' }); U.text(g, 920, 194 + i * 150, r[1], 'lab', { 'text-anchor': 'start' }); c.tl.push(g);
      });
      c.qs = U.g(svg); c.ql = [];
      ['does exchange help, or only add work', 'dependence and errors carried further', 'what reaches the decision', 'evidence about the exchanges'].forEach(function (q, i) {
        var g = U.g(c.qs); U.text(g, 920, 170 + i * 150, q, 'word', { 'text-anchor': 'start' }); c.ql.push(g);
      });
      return c;
    },
    draw: function (c, t, U) {
      var p1 = U.cue(1), p2 = U.cue(2);
      var ts = [U.say(0, 'One component searches'), U.say(0, 'another reads them'), U.say(0, 'a third drafts'), U.say(0, 'a fourth reviews')], te = U.say(0, 'Each component receives');
      U.op(c.row, 1 - U.ramp(t, p1, 0.8));
      U.op(c.req, U.ramp(t, 0.6, 0.6)); U.op(c.reqTk, U.ramp(t, 0.6, 0.6));
      c.comp.forEach(function (a, i) { U.op(a.g, U.ramp(t, ts[i], 0.6)); });
      U.op(c.out, U.ramp(t, ts[3] + 1.2, 0.6));
      c.arr.forEach(function (l, i) { U.op(l, U.ramp(t, i < 4 ? ts[i] : ts[3] + 1.2, 0.6)); });
      // a token passes along the row, changing form at each component; the pass repeats
      var per = 7, ph = t >= te ? (t - te) % per : -1, hop = 1.1;
      c.flow.forEach(function (tk, i) {
        if (ph < 0 || t >= p1) { U.op(tk, 0); return; }
        var a = c.stops[i], b = c.stops[i + 1];
        U.fly(tk, U.seg(a, b, i === 0 ? 18 : 58, i === 4 ? 4 : 58), ph, i * hop, hop, false);
        U.cls(c.arr[i], 'is-live', ph >= i * hop && ph < (i + 1) * hop);
      });
      U.op(c.rowCap, U.ramp(t, te + 0.6, 0.8));
      // passage 1: the network and the traditions
      var net = U.ramp(t, p1 + 0.4, 0.8);
      U.op(c.net, net);
      var tt = [U.say(1, 'collective intelligence'), U.say(1, 'distributed knowledge'), U.say(1, 'social influence'), U.say(1, 'Distributed computing specifies')];
      c.tl.forEach(function (g, i) { U.op(g, U.ramp(t, tt[i], 0.6) * (1 - U.ramp(t, p2, 0.6))); });
      U.op(c.txt, U.ramp(t, U.say(1, 'Each line of work') + 1.5, 0.8));
      // passage 2: four research problems, each tied to a feature of the network
      var tq = [U.say(2, 'Communication can improve'), U.say(2, 'dependent on one another'), U.say(2, 'Network structure constrains'), U.say(2, 'evaluating it requires')];
      c.ql.forEach(function (g, i) { U.op(g, U.ramp(t, tq[i], 0.6)); });
      var on = function (i) { return t >= tq[i] && (i === 3 || t < tq[i + 1]); };
      U.cls(c.el['01'], 'is-live', on(0));
      U.cls(c.el['02'], 'is-bad', on(1)); U.cls(c.el['03'], 'is-bad', on(1));
      c.into.forEach(function (l) { U.cls(l, 'is-live', on(2)); });
      U.cls(c.decBox, 'box--hi', on(2));
      U.op(c.rec, U.ramp(t, tq[3], 0.8)); U.op(c.recLab, U.ramp(t, tq[3] + 0.4, 0.6));
    } });

  // ------------------------------------------------------------------ why study networks
  var WEV = M.runSix({ topology: 'complete', mode: 'evidence', rounds: 1 }), WCC = M.runSix({ topology: 'complete', mode: 'conclusion', rounds: 1 });
  NCMA.scene({ id: 'why-study-networks', note: '', desc: 'One model box gives one answer. Four components appear around it, a second model, retrieval, tools and memory, joined to it by channels, and the channels light in turn as information moves among them. The components give way to two agents, each holding one piece of information. A path between them lights, is then cut with a red cross while agent 1 holds only its own piece, and is restored, after which agent 2’s piece crosses and agent 1 holds both. Then the two agents give way to two copies of the same six agents with the same clues, joined by all channels. On the left the messages carry evidence and the group reaches A; on the right they carry only answers and the group ends at B.',
    build: function (svg, U) {
      var c = {};
      c.sys = U.g(svg);
      c.model = U.g(c.sys); U.el('rect', { x: 784, y: 250, width: 200, height: 110, rx: 10, 'class': 'box box--hi' }, c.model);
      U.text(c.model, 884, 316, 'model', 'word--lg', { 'text-anchor': 'middle' });
      c.ans = U.text(c.sys, 884, 440, 'one model, one answer', 'cap', { 'text-anchor': 'middle' });
      c.parts = U.g(c.sys); c.links = [];
      [['second model', 470, 140, 'doc'], ['retrieval', 470, 470, 'doc'], ['tools', 1300, 140, 'tool'], ['memory', 1300, 470, 'doc']].forEach(function (p) {
        U.agent(c.parts, { x: p[1], y: p[2], r: 46, role: p[3], label: p[0] });
        c.links.push(U.link(c.parts, { x: p[1], y: p[2], r: 52 }, { x: 884, y: 305, r: 112 }, {}));
      });
      c.cap1 = U.text(c.sys, 884, 660, 'the result depends on the components and on how they are connected', 'cap', { 'text-anchor': 'middle' });
      // passage 1: one information dependency, shown by removing and restoring its path
      c.dep = U.g(svg);
      var D1 = { x: 560, y: 380, r: 60 }, D2 = { x: 1210, y: 380, r: 60 };
      U.agent(c.dep, { x: D1.x, y: D1.y, r: 60, label: 'agent 1', ly: -86 });
      U.agent(c.dep, { x: D2.x, y: D2.y, r: 60, label: 'agent 2', ly: -86 });
      c.k1 = U.token(c.dep, 'evidence', { r: 20, label: '1' }); U.place(c.k1, D1.x - 28, D1.y);
      c.k2 = U.token(c.dep, 'evidence', { r: 20, label: '2' }); U.place(c.k2, D2.x, D2.y);
      c.k2b = U.token(c.dep, 'evidence', { r: 20, label: '2' });
      c.path = U.link(c.dep, D2, D1, { arrow: true });
      c.cut = U.g(c.dep);
      [[-22, -22, 22, 22], [-22, 22, 22, -22]].forEach(function (d) { var l = U.el('line', { x1: 885 + d[0], y1: 380 + d[1], x2: 885 + d[2], y2: 380 + d[3], 'class': 'ln' }, c.cut); l.style.stroke = 'var(--alert)'; l.style.strokeWidth = '5'; });
      c.h1 = U.text(c.dep, D1.x, D1.y + 120, '', 'lab lab--hi', { 'text-anchor': 'middle' });
      U.text(c.dep, D2.x, D2.y + 120, 'holds piece 2', 'lab', { 'text-anchor': 'middle' });
      c.dcap = U.text(c.dep, 884, 640, '', 'cap', { 'text-anchor': 'middle' });
      c.D1 = D1; c.D2 = D2;
      c.pair = U.g(svg);
      c.L = NCMA.six(c.pair, U, { cx: 470, cy: 300, R: 170, r: 32 }); c.R = NCMA.six(c.pair, U, { cx: 1300, cy: 300, R: 170, r: 32 });
      U.text(c.pair, 470, 590, 'messages carry evidence', 'word--lg', { 'text-anchor': 'middle' });
      U.text(c.pair, 1300, 590, 'messages carry only answers', 'word--lg', { 'text-anchor': 'middle' });
      c.rL = U.text(c.pair, 470, 680, 'the group reaches A', 'big big--hi', { 'text-anchor': 'middle' });
      c.rR = U.text(c.pair, 1300, 680, 'the group ends at B', 'big big--warm', { 'text-anchor': 'middle' });
      c.same = U.text(c.pair, 884, 760, 'same agents, same clues, same channels', 'lab', { 'text-anchor': 'middle' });
      return c;
    },
    draw: function (c, t, U) {
      var tc = U.say(0, 'A second model can take'), p1 = U.cue(1), p2 = U.cue(2), tr = U.say(2, 'Comparing the resulting behavior');
      U.op(c.sys, 1 - U.ramp(t, p1, 0.8));
      U.op(c.parts, U.ramp(t, tc, 0.8)); U.op(c.ans, 1 - U.ramp(t, tc, 0.6));
      c.links.forEach(function (l, i) { U.cls(l, 'is-live', t >= tc + 1 && t < p1 && Math.floor((t - tc - 1) / 1.2) % 4 === i); });
      U.op(c.cap1, U.ramp(t, Math.max(tc + 1, p1 - 6), 0.8));
      // passage 1: path highlighted, removed, restored; the piece crosses only once it is restored
      var tj = U.say(1, 'Connecting them'), tx = U.say(1, 'whether the message arrives'), tr2 = U.say(1, 'how the receiving agent') + 2.2;
      U.op(c.dep, t >= p1 && t < p2 ? U.ramp(t, p1 + 0.4, 0.8) : t >= p2 ? 1 - U.ramp(t, p2, 0.6) : 0);
      var cutNow = t >= tx && t < tr2;
      U.op(c.path, t < tj ? 0.15 : cutNow ? 0.15 : 1); U.cls(c.path, 'is-live', t >= tj && !cutNow);
      U.op(c.cut, cutNow ? U.ramp(t, tx, 0.4) : 0);
      U.fly(c.k2b, U.seg([c.D2.x, c.D2.y], [c.D1.x, c.D1.y], 64, 64), t, tr2 + 0.2, 1.8, true);
      var got = t >= tr2 + 2;
      if (t < tr2 + 0.2) U.op(c.k2b, 0); else if (got) { U.place(c.k2b, c.D1.x + 26, c.D1.y); U.op(c.k2b, 1); }
      U.op(c.k1, 1); U.op(c.k2, 1);
      U.setText(c.h1, got ? 'holds pieces 1 and 2' : 'holds piece 1 only');
      U.setText(c.dcap, t < tj ? 'each agent holds part of the information' : t < tx ? 'a path lets agent 2 send what it holds' : cutNow ? 'path removed: agent 1 stays incomplete' : 'path restored: the message completes it');
      U.op(c.pair, U.ramp(t, p2 + 0.6, 0.8));
      [[c.L, WEV], [c.R, WCC]].forEach(function (x) {
        x[0].clues(1); x[0].topo('complete', t, p2 + 1);
        M.SIX.agents.forEach(function (a) { x[0].judge(a, (t >= tr ? x[1][1] : x[1][0]).judge[a]); });
      });
      U.op(c.rL, U.ramp(t, tr + 0.6, 0.6)); U.op(c.rR, U.ramp(t, tr + 0.6, 0.6)); U.op(c.same, U.ramp(t, p2 + 1.5, 0.6));
    } });

  // ------------------------------------------------------------------ one agent
  NCMA.scene({ id: 'one-agent', note: '', desc: 'A model box receives a request and returns text. A program boundary then appears around it with instructions, memory and tools; a tool call goes out and its result returns, and the cycle repeats.',
    build: function (svg, U) {
      var c = {};
      c.zone = U.el('rect', { x: 330, y: 110, width: 760, height: 580, rx: 10, 'class': 'zone' }, svg);
      c.zoneLab = U.text(svg, 352, 150, 'agent: the program around the model', 'lab');
      c.model = U.g(svg); U.el('rect', { x: 600, y: 330, width: 240, height: 140, rx: 10, 'class': 'box box--hi' }, c.model);
      U.text(c.model, 720, 408, 'model', 'word--lg', { 'text-anchor': 'middle' });
      c.ins = U.agent(svg, { x: 450, y: 250, r: 46, role: 'doc', label: 'instructions' });
      c.mem = U.agent(svg, { x: 450, y: 560, r: 46, role: 'doc', label: 'memory' });
      c.tool = U.agent(svg, { x: 990, y: 400, r: 50, role: 'tool', label: 'tools', ly: -66 });
      c.env = U.agent(svg, { x: 1420, y: 400, r: 70, role: 'tool', label: 'the world', ly: 116 });
      c.envTxt = U.lines(svg, 1420, 560, ['web pages, files,', 'other agents, people'], 'lab lab--t2', 30, { 'text-anchor': 'middle' });
      c.lIns = U.link(svg, { x: 450, y: 250, r: 50 }, { x: 640, y: 330, r: 4 }, { arrow: true });
      c.lMem = U.link(svg, { x: 450, y: 560, r: 50 }, { x: 640, y: 470, r: 4 }, { arrow: true });
      c.lAct = U.link(svg, { x: 840, y: 380, r: 4 }, { x: 990, y: 380, r: 52 }, { arrow: true });
      c.lOut = U.link(svg, { x: 990, y: 380, r: 52 }, { x: 1420, y: 380, r: 74 }, { arrow: true });
      c.lBack = U.link(svg, { x: 1420, y: 430, r: 74 }, { x: 840, y: 440, r: 4 }, { arrow: true, bend: -0.2 });
      c.req = U.token(svg, 'instruction', { r: 16 }); c.rep = U.token(svg, 'evidence', { r: 16 });
      c.call = U.token(svg, 'instruction', { r: 16 }); c.res = U.token(svg, 'evidence', { r: 16 });
      c.reqLab = U.text(svg, 120, 340, 'a question', 'lab', { 'text-anchor': 'middle' });
      c.repLab = U.text(svg, 1300, 340, 'an answer', 'lab', { 'text-anchor': 'middle' });
      c.cyc = ['read', 'decide', 'act', 'record'].map(function (w, i) { return U.text(svg, 720, 230 + 0 * i, '', 'lab lab--hi', { 'text-anchor': 'middle' }); });
      c.cycle = U.text(svg, 720, 640, '', 'word', { 'text-anchor': 'middle' });
      return c;
    },
    draw: function (c, t, U) {
      var p1 = U.cue(1), p2 = U.cue(2);
      // passage 0: model alone, question in, answer out
      var alone = t < p1;
      U.op(c.zone, U.ramp(t, p1, 1)); U.op(c.zoneLab, U.ramp(t, p1 + 0.4, 1));
      [c.ins.g, c.mem.g, c.lIns, c.lMem].forEach(function (e) { U.op(e, U.ramp(t, U.say(1, 'standing instructions'), 0.8)); });
      [c.tool.g, c.lAct].forEach(function (e) { U.op(e, U.ramp(t, U.say(1, 'a set of tools'), 0.8)); });
      [c.env.g, c.envTxt, c.lOut, c.lBack].forEach(function (e) { U.op(e, U.ramp(t, U.say(1, 'the search runs'), 0.8)); });
      U.op(c.reqLab, alone ? U.ramp(t, 1, 0.6) : 0); U.op(c.repLab, alone ? U.ramp(t, 6, 0.6) : 0);
      if (alone) {
        U.fly(c.req, [[120, 400], [600, 400]], t, 2, 2.2, false);
        U.fly(c.rep, [[840, 400], [1300, 400]], t, 5.5, 2.2, true);
        U.op(c.call, 0); U.op(c.res, 0);
      } else {
        U.op(c.req, 0); U.op(c.rep, 0);
        var tc = U.say(1, 'Here the model asks'), loop = t >= p2 ? ((t - p2) % 9) : null;
        if (loop == null) {
          U.fly(c.call, [[840, 380], [990, 380], [1350, 380]], t, tc, 2.6, false);
          U.fly(c.res, [[1350, 430], [1100, 500], [840, 440]], t, tc + 2.8, 2.4, true);
        } else {
          U.fly(c.call, [[840, 380], [990, 380], [1350, 380]], loop, 0.5, 2.4, false);
          U.fly(c.res, [[1350, 430], [1100, 500], [840, 440]], loop, 3.1, 2.2, false);
        }
      }
      var steps = ['read', 'decide', 'act', 'record'];
      if (t >= p2) { var k = Math.floor(((t - p2) % 9) / 2.25); U.setText(c.cycle, steps.map(function (s, i) { return i === k ? s.toUpperCase() : s; }).join('   ·   ')); U.op(c.cycle, U.ramp(t, p2, 0.8)); }
      else U.op(c.cycle, 0);
      U.cls(c.lAct, 'is-live', !alone); U.cls(c.lBack, 'is-live', t >= U.say(1, 'comes back') && !alone);
    } });

  // ------------------------------------------------------------------ who decides
  NCMA.scene({ id: 'who-decides', note: '', desc: 'Three columns with the same model box. One call and one answer; a fixed sequence of draft, check and revise chosen by code; and a model choosing among search, run code and write, then stopping.',
    build: function (svg, U) {
      var c = { cols: [] };
      function M_(g, x, y) { U.el('rect', { x: x - 60, y: y - 36, width: 120, height: 72, rx: 8, 'class': 'box' }, g); U.text(g, x, y + 9, 'model', 'cap', { 'text-anchor': 'middle' }); return { x: x, y: y, r: 62 }; }
      var heads = [['One call', 'next step chosen by: nobody'], ['Fixed workflow', 'next step chosen by: the code'], ['Agent', 'next step chosen by: the model']];
      heads.forEach(function (h, i) {
        var g = U.g(svg), x = 230 + i * 560; c.cols.push(g);
        U.text(g, x, 60, h[0], 'word--lg', { 'text-anchor': 'middle' }); U.text(g, x, 785, h[1], 'lab', { 'text-anchor': 'middle' });
        if (i) U.el('line', { x1: x - 280, y1: 40, x2: x - 280, y2: 760, 'class': 'rule' }, g);
      });
      var m1 = M_(c.cols[0], 230, 400); c.a1 = U.token(svg, 'instruction', { r: 15 }); c.b1 = U.token(svg, 'evidence', { r: 15 });
      var y = [210, 400, 590], w2 = [M_(c.cols[1], 790, y[0]), M_(c.cols[1], 790, y[1]), M_(c.cols[1], 790, y[2])];
      ['draft', 'check', 'revise'].forEach(function (s, i) { U.text(c.cols[1], 870, y[i] + 9, s, 'lab', { 'text-anchor': 'start' }); });
      U.link(c.cols[1], w2[0], w2[1], { arrow: true }); U.link(c.cols[1], w2[1], w2[2], { arrow: true });
      c.w2 = w2; c.a2 = U.token(svg, 'instruction', { r: 15 });
      var m3 = M_(c.cols[2], 1350, 400); c.m3 = m3;
      c.tools = [['search', 1350, 180], ['run code', 1580, 420], ['write', 1350, 620]].map(function (s) { var a = U.agent(c.cols[2], { x: s[1], y: s[2], r: 38, role: 'tool', label: s[0], ly: s[2] > 400 ? 72 : -56 }); a.l = U.link(c.cols[2], m3, a, {}); return a; });
      c.a3 = U.token(svg, 'instruction', { r: 14 }); c.b3 = U.token(svg, 'evidence', { r: 14 });
      c.stop = U.text(svg, 1270, 409, 'done', 'lab lab--hi', { 'text-anchor': 'end' });
      return c;
    },
    draw: function (c, t, U) {
      var p1 = U.cue(1), p2 = U.cue(2), focus = t < U.say(0, 'In the second') ? 0 : t < p1 ? 1 : 2;
      c.cols.forEach(function (g, i) { U.em(g, t >= p2 ? 2 : i === focus ? 2 : 1); });
      U.fly(c.a1, [[230, 250], [230, 360]], t, 1, 1.2, false); U.fly(c.b1, [[230, 440], [230, 560]], t, 2.4, 1.2, true);
      var t2 = U.say(0, 'In the second');
      U.fly(c.a2, [[790, 250], [790, 360], [790, 440], [790, 550]], t, t2 + 1, 4, true);
      // the agent column: three tool calls in an order the model chooses, then stop
      var t3 = p1 + 2, order = [0, 1, 2, 0], k = Math.floor(U.clamp((t - t3) / 2.2, 0, 4.99));
      c.tools.forEach(function (tl, i) { U.cls(tl.l, 'is-live', t >= t3 && t < t3 + 8.8 && order[Math.min(k, 3)] === i); });
      if (t >= t3 && t < t3 + 8.8) { var tl = c.tools[order[k]], ph = (t - t3) - k * 2.2; U.fly(c.a3, [[c.m3.x, c.m3.y], [tl.x, tl.y]], ph, 0, 1, false); U.fly(c.b3, [[tl.x, tl.y], [c.m3.x, c.m3.y]], ph, 1.1, 1, false); }
      else { U.op(c.a3, 0); U.op(c.b3, 0); }
      U.op(c.stop, U.ramp(t, t3 + 8.8, 0.6));
    } });

  // ------------------------------------------------------------------ permission
  NCMA.scene({ id: 'permission', note: '', source: 'Parasuraman, Sheridan & Wickens, 2000', desc: 'An agent sends requests to search and read, which pass, and drafts a reply. Its attempt to send outside the system stops at a gate held by a person. Below, four functions are marked automatic or manual.',
    build: function (svg, U) {
      var c = {};
      c.ag = U.agent(svg, { x: 330, y: 300, r: 52, label: 'agent' });
      c.acts = [['search', 760, 120], ['read', 760, 300], ['draft', 760, 480]].map(function (s) { var a = U.agent(svg, { x: s[1], y: s[2], r: 40, role: 'tool', label: s[0], lx: 60, ly: 8, anchor: 'start' }); a.l = U.link(svg, c.ag, a, {}); return a; });
      c.gate = U.agent(svg, { x: 1180, y: 300, r: 46, role: 'human', label: 'a person approves', ly: 84 });
      c.send = U.agent(svg, { x: 1560, y: 300, r: 46, role: 'tool', label: 'send', ly: 84 });
      c.lg = U.link(svg, c.ag, c.gate, { bend: -0.18 }); c.ls = U.link(svg, c.gate, c.send, {});
      c.tok = [0, 1, 2].map(function () { return U.token(svg, 'instruction', { r: 14 }); });
      c.out = U.token(svg, 'instruction', { r: 15 });
      c.wait = U.text(svg, 1180, 200, 'waiting', 'lab lab--warm', { 'text-anchor': 'middle' });
      var fn = [['gather information', 1], ['analyze it', 1], ['choose an action', 1], ['carry it out', 0]];
      c.fn = fn.map(function (f, i) { var g = U.g(svg), x = 140 + i * 390; U.el('rect', { x: x, y: 640, width: 350, height: 110, rx: 8, 'class': 'box' + (f[1] ? ' box--hi' : '') }, g); U.text(g, x + 175, 686, f[0], 'cap', { 'text-anchor': 'middle' }); U.text(g, x + 175, 728, f[1] ? 'automatic' : 'waits for a person', f[1] ? 'lab lab--hi' : 'lab lab--warm', { 'text-anchor': 'middle' }); return g; });
      return c;
    },
    draw: function (c, t, U) {
      c.acts.forEach(function (a, i) { U.fly(c.tok[i], [[382, 300], [a.x - 44, a.y]], t, 1.5 + i * 1.6, 1.3, false); U.cls(a.l, 'is-live', t >= 1.5 + i * 1.6 && t < 3 + i * 1.6); });
      var ts = U.say(0, 'When it tries to send');
      U.fly(c.out, [[382, 290], [1000, 190], [1128, 300]], t, ts, 2, true);
      U.op(c.wait, U.ramp(t, ts + 2, 0.5)); U.cls(c.lg, 'is-live', t >= ts && t < ts + 2.2);
      U.op(c.ls, 0.35);
      c.fn.forEach(function (g, i) { U.op(g, U.ramp(t, U.cue(1) + 1 + i * 0.6, 0.6)); });
    } });

  // ------------------------------------------------------------------ second agent
  NCMA.scene({ id: 'second-agent', note: '', desc: 'Two agents face one question: did a delivery miss its deadline. Agent 1 holds the delivery record, arrived May 14. Agent 2 holds the contract, deadline May 10. Both show a question mark. A channel opens and a message carries the deadline to agent 1, which compares the dates and concludes the delivery was four days late. Then a hypothetical wrong message carrying May 16 replaces it, and agent 1 concludes on time.',
    build: function (svg, U) {
      var c = {};
      c.qLab = U.text(svg, 884, 20, 'the question', 'lab', { 'text-anchor': 'middle' });
      c.q = U.text(svg, 884, 76, 'Did the delivery miss its deadline?', 'word--lg', { 'text-anchor': 'middle' });
      c.a = U.agent(svg, { x: 480, y: 290, r: 72, label: 'agent 1', ly: -104 });
      c.b = U.agent(svg, { x: 1290, y: 290, r: 72, label: 'agent 2', ly: -104 });
      c.l = U.link(svg, c.a, c.b, {});
      c.ra = U.g(svg); U.el('rect', { x: 290, y: 410, width: 380, height: 190, rx: 6, 'class': 'box' }, c.ra);
      U.text(c.ra, 316, 452, 'delivery record', 'lab'); U.text(c.ra, 316, 504, 'arrived May 14', 'word--lg');
      c.got = U.text(svg, 316, 562, 'deadline May 10', 'word--lg'); c.got.style.fill = 'var(--mint)';
      c.bad = U.text(svg, 316, 562, 'deadline May 16', 'word--lg'); c.bad.style.fill = 'var(--alert)';
      c.rb = U.g(svg); U.el('rect', { x: 1100, y: 410, width: 380, height: 190, rx: 6, 'class': 'box' }, c.rb);
      U.text(c.rb, 1126, 452, 'contract', 'lab'); U.text(c.rb, 1126, 504, 'deadline May 10', 'word--lg');
      c.msg = U.token(svg, 'evidence', { r: 22 });
      c.msgLab = U.text(svg, 885, 250, 'deadline May 10', 'lab lab--hi', { 'text-anchor': 'middle' });
      c.altLab = U.text(svg, 885, 250, 'if the message had said May 16', 'lab lab--alert', { 'text-anchor': 'middle' });
      c.res = U.text(svg, 480, 690, 'four days late', 'big', { 'text-anchor': 'middle' });
      c.res2 = U.text(svg, 480, 690, 'on time', 'big', { 'text-anchor': 'middle' }); c.res2.style.fill = 'var(--alert)';
      c.cap = U.text(svg, 884, 700, 'neither record answers the question alone', 'cap', { 'text-anchor': 'middle' });
      return c;
    },
    draw: function (c, t, U) {
      var tn = U.say(0, 'neither agent can answer');
      U.op(c.ra, U.ramp(t, U.say(0, 'Agent 1 holds'), 0.8)); U.op(c.rb, U.ramp(t, U.say(0, 'Agent 2 holds'), 0.8));
      U.op(c.cap, U.ramp(t, tn, 0.8) * (1 - U.ramp(t, U.cue(1), 0.6)));
      var open = U.say(1, 'A channel opens'), cross = U.say(1, 'a message carries'), land = cross + 2.4, ans = Math.max(land + 0.3, U.say(1, 'compares them'));
      var wrong = U.say(2, 'Had agent 2 misread'), swap = wrong + 1.2;
      U.op(c.l, U.ramp(t, open, 0.8)); U.cls(c.l, 'is-live', (t >= cross && t < land) || (t >= wrong && t < swap));
      U.fly(c.msg, [[1214, 290], [556, 290]], t, t >= wrong ? wrong : cross, t >= wrong ? 1.2 : 2.2, false);
      U.cls(c.msg, 'tk--alert', t >= wrong);
      U.op(c.msgLab, U.ramp(t, cross, 0.4) * (1 - U.ramp(t, land, 0.5)));
      U.op(c.altLab, U.ramp(t, wrong, 0.6));
      U.op(c.got, U.ramp(t, land - 0.2, 0.5) * (1 - U.ramp(t, swap, 0.4)));
      U.op(c.bad, U.ramp(t, swap, 0.4));
      U.op(c.res, U.ramp(t, ans, 0.8) * (1 - U.ramp(t, swap, 0.4)));
      U.op(c.res2, U.ramp(t, swap + 0.3, 0.6));
      U.setText(c.a.mark, t >= ans ? '' : t >= tn ? '?' : ''); U.setText(c.b.mark, t >= tn ? '?' : '');
      U.cls(c.a.g, 'is-A', t >= ans);
    } });

  // ------------------------------------------------------------------ six agents
  NCMA.scene({ id: 'six-agents', note: ILL, desc: 'Six agents on a hexagon. Four hold small blue clues pointing to B and show B; two hold large mint clues pointing to A and show A. A tally reads B 4, A 2. A balance then weighs four small clues against two large ones and tips toward A.',
    build: function (svg, U) {
      var c = NCMA.six(svg, U, { cx: 470, cy: 400, R: 250 });
      c.count = U.text(svg, 1300, 130, '', 'big', { 'text-anchor': 'middle' }); c.countLab = U.text(svg, 1300, 70, 'count the answers', 'lab', { 'text-anchor': 'middle' });
      c.bal = NCMA.balance(svg, U, 1300, 230); c.balLab = U.text(svg, 1300, 600, 'weigh the evidence', 'lab', { 'text-anchor': 'middle' });
      c.res = U.text(svg, 1300, 690, 'favors A', 'big big--hi', { 'text-anchor': 'middle' });
      return c;
    },
    draw: function (c, t, U) {
      c.clues(U.ramp(t, 1, 1)); c.topo(null);
      M.SIX.agents.forEach(function (a) { c.judge(a, t >= U.say(0, 'Four have found') ? (M.SIX.clue[a] > 0 ? 'A' : 'B') : ''); });
      var tc = U.say(1, 'If we simply ask'), tw = U.say(1, 'If we instead');
      U.setText(c.count, 'B 4  ·  A 2'); U.op(c.count, U.ramp(t, tc + 1, 0.6)); U.op(c.countLab, U.ramp(t, tc, 0.6));
      U.op(c.bal.g, U.ramp(t, tw, 0.8)); U.op(c.balLab, U.ramp(t, tw, 0.8));
      c.bal.tilt(6 * U.ramp(t, tw + 2, 2));
      U.op(c.res, U.ramp(t, tw + 4.2, 0.8));
    } });

  // ------------------------------------------------------------------ what a line means
  NCMA.scene({ id: 'what-a-line-means', note: '', desc: 'Two agents P and Q. Their connection is shown four ways in turn: a dashed line for permission, a solid line carrying three messages, a file one writes and the other reads, and a shared memory both use without messaging. A small diagram on the right draws all four the same way, as one line.',
    build: function (svg, U) {
      var c = {};
      c.p = U.agent(svg, { x: 300, y: 330, r: 54, mark: 'P' }); c.q = U.agent(svg, { x: 1020, y: 330, r: 54, mark: 'Q' });
      c.perm = U.link(svg, c.p, c.q, { cls: 'ln--dash' }); c.traffic = U.link(svg, c.p, c.q, { arrow: true });
      c.file = U.agent(svg, { x: 660, y: 120, r: 46, role: 'doc', label: 'a file Q wrote', ly: -66 });
      c.lf1 = U.link(svg, c.q, c.file, { arrow: true }); c.lf2 = U.link(svg, c.file, c.p, { arrow: true });
      c.memo = U.agent(svg, { x: 660, y: 600, r: 50, role: 'doc', label: 'shared memory', ly: 90 });
      c.lm1 = U.link(svg, c.p, c.memo, {}); c.lm2 = U.link(svg, c.q, c.memo, {});
      c.cap = U.text(svg, 660, 270, '', 'word--lg', { 'text-anchor': 'middle' });
      c.main = [c.p.g, c.q.g];
      c.minis = U.g(svg);
      [['permitted', 'perm'], ['messages sent', 'msg'], ['a file', 'file'], ['shared memory', 'mem']].forEach(function (m, i) {
        var cx = 150 + i * 300, P = U.agent(c.minis, { x: cx - 80, y: 400, r: 24, mark: 'P' }), Q = U.agent(c.minis, { x: cx + 80, y: 400, r: 24, mark: 'Q' });
        P.mark.style.fontSize = '18px'; Q.mark.style.fontSize = '18px';
        if (m[1] === 'perm') U.link(c.minis, P, Q, { cls: 'ln--dash' });
        if (m[1] === 'msg') { U.link(c.minis, P, Q, { arrow: true }); [-30, 0, 30].forEach(function (dx) { U.place(U.token(c.minis, 'evidence', { r: 7 }), cx + dx, 372); }); }
        if (m[1] === 'file') { var f = U.agent(c.minis, { x: cx, y: 290, r: 24, role: 'doc' }); U.link(c.minis, Q, f, { arrow: true }); U.link(c.minis, f, P, { arrow: true }); }
        if (m[1] === 'mem') { var d = U.agent(c.minis, { x: cx, y: 510, r: 26, role: 'doc' }); U.link(c.minis, P, d, {}); U.link(c.minis, Q, d, {}); }
        U.text(c.minis, cx, 620, m[0], 'lab lab--hi', { 'text-anchor': 'middle' });
      });
      c.tks = [0, 1, 2].map(function () { return U.token(svg, 'evidence', { r: 15 }); });
      U.el('line', { x1: 1280, y1: 80, x2: 1280, y2: 720, 'class': 'rule' }, svg);
      U.text(svg, 1520, 260, 'drawn in a diagram as', 'lab', { 'text-anchor': 'middle' });
      var gp = U.agent(svg, { x: 1420, y: 350, r: 30, mark: 'P' }), gq = U.agent(svg, { x: 1620, y: 350, r: 30, mark: 'Q' }); U.link(svg, gp, gq, {});
      return c;
    },
    draw: function (c, t, U) {
      var s1 = U.say(1, 'It can mean that messages'), s2 = U.say(1, 'It can also mean'), s3 = U.say(1, 'or both read');
      var mode = t < s1 ? 0 : t < s2 ? 1 : t < s3 ? 2 : 3;
      var sum = U.ramp(t, U.cue(2), 0.8);
      U.op(c.minis, sum); c.main.forEach(function (e) { U.op(e, 1 - sum); }); if (sum > 0.5) { U.op(c.memo.g, 0); U.op(c.lm1, 0); U.op(c.lm2, 0); }
      U.op(c.perm, mode === 0 ? 1 : 0); U.op(c.traffic, mode === 1 ? 1 : 0);
      [c.file.g, c.lf1, c.lf2].forEach(function (e) { U.op(e, mode === 2 ? 1 : 0); });
      [c.memo.g, c.lm1, c.lm2].forEach(function (e) { U.op(e, mode === 3 ? 1 - sum : 0); });
      U.setText(c.cap, ['may message each other', '3 messages this run', '', ''][mode]);
      U.op(c.cap, mode < 2 ? 1 : 0);
      c.tks.forEach(function (k, i) { if (mode === 1) U.fly(k, [[364, 330], [956, 330]], t, s1 + 0.6 + i * 0.9, 1.4, false); else U.op(k, 0); });
    } });

  // ------------------------------------------------------------------ inside a message
  NCMA.scene({ id: 'the-message', note: '', desc: 'One message card expands into fields: from the coordinator, to a researcher, act request, content the question, context two sources, reply expected notes with links. Later the context field is struck through and the receiver shows that it cannot check the claim.',
    build: function (svg, U) {
      var c = {};
      c.from = U.agent(svg, { x: 170, y: 400, r: 56, role: 'hub', label: 'coordinator' });
      c.to = U.agent(svg, { x: 1640, y: 400, r: 56, label: 'researcher' });
      c.card = U.g(svg); U.el('rect', { x: 400, y: 120, width: 1060, height: 560, rx: 10, 'class': 'box box--hi' }, c.card);
      var F = [['from', 'coordinator'], ['to', 'researcher 1'], ['act', 'request'], ['content', 'Which districts have flood sensors, and since when?'], ['context', 'two sources already found'], ['reply', 'notes with source links']];
      c.rows = F.map(function (f, i) { var g = U.g(c.card), y = 200 + i * 80; U.text(g, 440, y, f[0], 'lab'); U.text(g, 600, y, f[1], 'word'); return g; });
      c.strike = U.el('line', { x1: 590, y1: 512, x2: 960, y2: 512, 'class': 'ln is-bad' }, svg);
      c.cant = U.text(svg, 1640, 520, 'cannot check the claim', 'lab lab--alert', { 'text-anchor': 'middle' });
      c.tk = U.token(svg, 'instruction', { r: 18 });
      return c;
    },
    draw: function (c, t, U) {
      U.fly(c.tk, [[226, 400], [400, 400]], t, 0.5, 1.2, false);
      U.op(c.card, U.ramp(t, 1.6, 0.6));
      var keys = ['names a sender', 'It states what kind', 'It carries content', 'It may carry context', 'says what kind of reply'];
      var times = [U.say(0, keys[0]), U.say(0, keys[0]) + 1.2, U.say(0, keys[1]), U.say(0, keys[2]), U.say(0, keys[3]), U.say(0, keys[4])];
      c.rows.forEach(function (g, i) { U.op(g, U.ramp(t, times[i], 0.6)); });
      var ts = U.say(2, 'Without the sources');
      U.op(c.strike, U.ramp(t, ts, 0.5)); U.op(c.cant, U.ramp(t, ts + 0.6, 0.5)); U.cls(c.to.g, 'is-bad', t >= ts + 0.6);
    } });

  // ------------------------------------------------------------------ kinds of message
  NCMA.scene({ id: 'message-kinds', note: '', desc: 'The same sentence, Route 9 bridge is closed, travels three times: as evidence the receiver weighs, as a suggestion it may accept, and as an instruction it carries out on a tool. Then a retrieved web page containing a command arrives and is kept as evidence, not executed.',
    build: function (svg, U) {
      var c = {};
      c.s = U.agent(svg, { x: 200, y: 330, r: 52, label: 'sender' }); c.r = U.agent(svg, { x: 1120, y: 330, r: 52, label: 'receiver' });
      c.tool = U.agent(svg, { x: 1560, y: 330, r: 46, role: 'tool', label: 'routing system', ly: 84 });
      c.l = U.link(svg, c.s, c.r, {}); c.lt = U.link(svg, c.r, c.tool, { arrow: true });
      c.words = U.text(svg, 660, 250, '“Route 9 bridge is closed”', 'word--lg', { 'text-anchor': 'middle' });
      c.kinds = [U.token(svg, 'evidence', { r: 20 }), U.token(svg, 'both', { r: 18 }), U.token(svg, 'instruction', { r: 20 })];
      c.kl = U.text(svg, 660, 440, '', 'lab lab--hi', { 'text-anchor': 'middle' });
      c.react = U.text(svg, 1120, 450, '', 'cap', { 'text-anchor': 'middle' });
      c.act = U.token(svg, 'instruction', { r: 16 });
      c.page = U.agent(svg, { x: 200, y: 630, r: 50, role: 'doc', label: 'retrieved web page', lx: 80, ly: 10, anchor: 'start' });
      c.pageTxt = U.text(svg, 760, 700, '… reroute every delivery now …', 'word', { 'text-anchor': 'middle' });
      c.keep = U.text(svg, 1120, 700, 'kept as evidence', 'lab lab--hi', { 'text-anchor': 'middle' });
      c.pk = U.token(svg, 'evidence', { r: 18 });
      return c;
    },
    draw: function (c, t, U) {
      var t1 = U.say(0, 'Sent as evidence'), t2 = U.say(0, 'Sent as a suggestion'), t3 = U.say(1, 'Sent as an instruction'), t4 = U.cue(2);
      var k = t < t2 ? 0 : t < t3 ? 1 : 2, t0 = [t1, t2, t3][k];
      c.kinds.forEach(function (tk, i) { if (i === k && t >= t1 && t < t4) U.fly(tk, [[260, 330], [1060, 330]], t, t0, 2, true); else U.op(tk, 0); });
      U.setText(c.kl, t < t1 ? '' : ['evidence', 'suggestion', 'instruction'][k]); U.op(c.kl, t >= t1 && t < t4 ? 1 : 0);
      U.setText(c.react, t < t1 + 2 ? '' : ['weighs it', 'may accept it', 'carries it out'][k]); U.op(c.react, t < t4 ? 1 : 0.4);
      U.fly(c.act, [[1172, 330], [1510, 330]], t, t3 + 2.4, 1.2, true); if (t >= t4) U.op(c.act, 0.35);
      U.cls(c.lt, 'is-live', k === 2 && t >= t3 + 2.4 && t < t4);
      [c.page.g, c.pageTxt].forEach(function (e) { U.op(e, U.ramp(t, t4 + 1, 0.8)); });
      U.fly(c.pk, [[260, 630], [1120, 630]], t, t4 + 3, 2.2, true); U.op(c.keep, U.ramp(t, t4 + 5.4, 0.6));
      U.op(c.words, t < t4 ? 1 : 0.35);
    } });

  // ------------------------------------------------------------------ shared board
  NCMA.scene({ id: 'shared-board', note: '', source: 'Erman et al., 1980', desc: 'Two agents write notes onto a shared document in the center; a third reads from it. No message passes directly between agents. Later each note shows a level and a credibility rating, and then the ratings disappear and are replaced by question marks.',
    build: function (svg, U) {
      var c = {};
      c.board = U.g(svg); U.el('rect', { x: 600, y: 140, width: 700, height: 520, rx: 10, 'class': 'box' }, c.board); U.text(c.board, 950, 120, 'shared document', 'lab', { 'text-anchor': 'middle' });
      c.w1 = U.agent(svg, { x: 220, y: 230, r: 50, label: 'writer 1' }); c.w2 = U.agent(svg, { x: 220, y: 570, r: 50, label: 'writer 2' });
      c.rd = U.agent(svg, { x: 1540, y: 400, r: 54, label: 'reader' });
      c.notes = [0, 1, 2, 3].map(function (i) { var g = U.g(svg), y = 210 + i * 110; U.el('line', { x1: 660, y1: y, x2: 980, y2: y, 'class': 'ln', 'stroke-width': 6 }, g); g.tag = U.text(g, 1000, y + 8, '', 'lab', { 'text-anchor': 'start' }); return g; });
      c.tw = [0, 1, 2, 3].map(function () { return U.token(svg, 'evidence', { r: 15 }); }); c.tr = U.token(svg, 'evidence', { r: 16 });
      return c;
    },
    draw: function (c, t, U) {
      var src = [[270, 230], [270, 570], [270, 230], [270, 570]];
      c.notes.forEach(function (g, i) { var t0 = 1 + i * 1.6; U.fly(c.tw[i], [src[i], [650, 210 + i * 110]], t, t0, 1.3, false); U.op(g, U.ramp(t, t0 + 1.3, 0.4)); });
      U.fly(c.tr, [[1300, 400], [1486, 400]], t, U.say(0, 'A third agent'), 1.6, true);
      var tl = U.say(1, 'attached a level'), tq = U.cue(2);
      var tags = ['phrase · 0.8', 'word · 0.4', 'phrase · 0.6', 'syllable · 0.9'];
      c.notes.forEach(function (g, i) { U.setText(g.tag, t >= tq + 1 ? '?' : t >= tl ? tags[i] : ''); U.cls(g.tag, 'lab--hi', t >= tl && t < tq + 1); });
    } });

  // ------------------------------------------------------------------ fair comparison
  NCMA.scene({ id: 'fair-comparison', note: 'Illustrative · equal budgets of model calls', desc: 'One model call on the left and fifteen on the right. The fifteen squares then rearrange into four organizations with the same count: one agent calling fifteen times in a loop, fifteen independent answers feeding a vote, a fixed plan-draft-check sequence, and five agents exchanging messages over three rounds. The single call then fades. Finally two boxes replace the arrangements: the same five agents over three rounds with fifteen calls, the same information and the same majority readout, without exchange on the left and with lines between agents on the right, under the caption that crediting communication requires holding the rest fixed and varying only the exchange.',
    build: function (svg, U) {
      var c = { sq: [] };
      c.one = U.el('rect', { x: 230, y: 380, width: 40, height: 40, rx: 5, 'class': 'nd' }, svg);
      c.oneLab = U.text(svg, 250, 470, '1 call', 'lab', { 'text-anchor': 'middle' });
      for (var i = 0; i < 15; i++) c.sq.push(U.el('rect', { x: -20, y: -20, width: 40, height: 40, rx: 5, 'class': 'nd' }, svg));
      c.lab = U.text(svg, 1100, 80, '', 'word--lg', { 'text-anchor': 'middle' }); c.sub = U.text(svg, 1100, 700, '', 'lab', { 'text-anchor': 'middle' });
      c.cmp = U.text(svg, 960, 770, 'to credit communication, hold the rest fixed and vary only the exchange', 'cap', { 'text-anchor': 'middle' });
      c.vote = U.agent(svg, { x: 1500, y: 400, r: 40, role: 'tool', label: 'vote', ly: 74 });
      c.lines = U.g(svg);
      for (var r = 0; r < 2; r++) for (var a = 0; a < 5; a++) for (var b = 0; b < 5; b++) if (a !== b) { var x1 = 800 + r * 280, x2 = 800 + (r + 1) * 280; U.el('line', { x1: x1 + 22, y1: 160 + a * 120, x2: x2 - 22, y2: 160 + b * 120, 'class': 'ln is-faint' }, c.lines); }
      c.loopLine = U.el('path', { d: 'M760,400 H1440', 'class': 'ln ln--dash' }, svg);
      // controlled comparison: same five agents, three rounds, same readout; only the exchange differs
      c.ctrl = U.g(svg); c.xl = U.g(svg);
      [[510, 'no exchange'], [1410, 'exchange']].forEach(function (b, bi) {
        var cx = b[0];
        U.el('rect', { x: cx - 360, y: 170, width: 720, height: 480, rx: 10, 'class': bi ? 'box box--hi' : 'box' }, c.ctrl);
        U.text(c.ctrl, cx, 220, b[1], 'cap', { 'text-anchor': 'middle' });
        for (var col = 0; col < 3; col++) for (var row = 0; row < 5; row++) {
          var x = cx - 160 + col * 160, y = 270 + row * 62;
          U.el('rect', { x: x - 15, y: y - 15, width: 30, height: 30, rx: 4, 'class': 'nd' }, c.ctrl);
          if (col < 2) {
            U.el('line', { x1: x + 17, y1: y, x2: x + 143, y2: y, 'class': 'ln' }, c.ctrl);
            if (bi) for (var r2 = 0; r2 < 5; r2++) if (r2 !== row) U.el('line', { x1: x + 17, y1: y, x2: x + 143, y2: 270 + r2 * 62, 'class': 'ln is-faint' }, c.xl);
          }
        }
        U.text(c.ctrl, cx, 600, '15 calls · readout: majority of final answers', 'lab', { 'text-anchor': 'middle' });
      });
      // layouts for the 15 squares
      var L = {};
      L.grid = []; for (i = 0; i < 15; i++) L.grid.push([900 + (i % 5) * 70, 300 + Math.floor(i / 5) * 70]);
      L.loop = []; for (i = 0; i < 15; i++) L.loop.push([760 + i * 48, 400]);
      L.vote = []; for (i = 0; i < 15; i++) L.vote.push([900 + (i % 3) * 70, 150 + Math.floor(i / 3) * 120]);
      L.flow = []; for (i = 0; i < 15; i++) L.flow.push(i === 0 ? [760, 400] : [860 + Math.floor((i - 1) / 2) * 95, i % 2 ? 340 : 460]);
      L.talk = []; for (i = 0; i < 15; i++) L.talk.push([800 + Math.floor(i / 5) * 280, 160 + (i % 5) * 120]);
      c.L = L;
      return c;
    },
    draw: function (c, t, U) {
      var tg = U.say(0, 'Five agents that each'), p1 = U.cue(1);
      var p2 = U.cue(2), tx = U.say(2, 'To credit communication itself'), q = U.ramp(t, p2, 0.8);
      var seq = [['grid', tg], ['loop', U.say(1, 'on one agent that keeps')], ['vote', U.say(1, 'on fifteen independent')], ['flow', U.say(1, 'on a fixed sequence')], ['talk', U.say(1, 'or on agents that exchange')]];
      var cur = 0; seq.forEach(function (s, i) { if (t >= s[1]) cur = i; });
      var from = c.L[seq[Math.max(0, cur - 1)][0]], to = c.L[seq[cur][0]], p = cur === 0 ? 1 : U.ramp(t, seq[cur][1], 1.4);
      c.sq.forEach(function (e, i) { var x = from[i][0] + (to[i][0] - from[i][0]) * p, y = from[i][1] + (to[i][1] - from[i][1]) * p; e.setAttribute('x', (x - 20).toFixed(1)); e.setAttribute('y', (y - 20).toFixed(1)); U.op(e, U.ramp(t, tg, 0.8) * (1 - q)); });
      U.op(c.one, 1 - U.ramp(t, p1, 0.8)); U.op(c.oneLab, 1 - U.ramp(t, p1, 0.8));
      U.op(c.ctrl, q); U.op(c.xl, U.ramp(t, tx, 1));
      var names = ['15 calls', 'one agent, fifteen steps', 'fifteen independent answers, then a vote', 'plan, then draft and check seven times', 'five agents, three rounds of messages'];
      U.setText(c.lab, t >= p2 ? 'same agents, information, budget and readout' : t >= tg ? names[cur] : ''); U.op(c.lab, U.ramp(t, tg, 0.6)); c.lab.setAttribute('x', t >= p2 ? 960 : 1100);
      U.setText(c.sub, t >= p1 ? 'same budget: 15 model calls' : ''); U.op(c.sub, 1 - q);
      U.op(c.vote.g, (cur === 2 ? p : cur === 3 ? 1 - U.ramp(t, seq[3][1], 0.6) : 0) * (1 - q));
      U.op(c.lines, cur === 4 ? p * (1 - q) : 0); U.op(c.loopLine, cur === 1 ? p : cur === 2 ? 1 - U.ramp(t, seq[2][1], 0.6) : 0);
      U.op(c.cmp, U.ramp(t, tx + 1, 0.8));
      U.em(c.sq[0], 2);
    } });

  // ------------------------------------------------------------------ sampling baseline
  NCMA.scene({ id: 'sampling-baseline', note: '', source: 'Wang et al., 2023 · Li et al., 2024 · Choi et al., 2025', desc: 'One model produces nine answers, mostly A and some B, that drop into a tally; the most common answer, A, is selected. Then two equal budgets are compared: a debate among five agents over three rounds, and fifteen independent answers counted by a vote.',
    build: function (svg, U) {
      var c = {};
      c.m = U.g(svg); U.el('rect', { x: 160, y: 200, width: 220, height: 130, rx: 10, 'class': 'box box--hi' }, c.m); U.text(c.m, 270, 274, 'one model', 'word', { 'text-anchor': 'middle' });
      c.ans = 'AABABAAAB'.split('').map(function (v) { return U.token(svg, 'conclusion', { r: 20, label: v }); });
      c.tally = U.text(svg, 1000, 140, '', 'big', { 'text-anchor': 'middle' });
      c.pick = U.text(svg, 1000, 560, 'most common: A', 'big big--hi', { 'text-anchor': 'middle' });
      c.cmp = U.g(svg);
      U.el('rect', { x: 160, y: 430, width: 640, height: 300, rx: 10, 'class': 'box' }, c.cmp); U.el('rect', { x: 960, y: 430, width: 640, height: 300, rx: 10, 'class': 'box' }, c.cmp);
      U.text(c.cmp, 480, 490, 'debate: 5 agents × 3 rounds', 'cap', { 'text-anchor': 'middle' }); U.text(c.cmp, 1280, 490, 'vote: 15 independent answers', 'cap', { 'text-anchor': 'middle' });
      U.text(c.cmp, 480, 680, '15 calls', 'lab', { 'text-anchor': 'middle' }); U.text(c.cmp, 1280, 680, '15 calls', 'lab', { 'text-anchor': 'middle' });
      for (var col = 0; col < 3; col++) for (var row = 0; row < 5; row++) { U.el('rect', { x: 330 + col * 130, y: 520 + row * 28, width: 18, height: 18, rx: 3, 'class': 'nd' }, c.cmp); if (col < 2) for (var r2 = 0; r2 < 5; r2++) U.el('line', { x1: 350 + col * 130, y1: 529 + row * 28, x2: 458 + col * 130, y2: 529 + r2 * 28, 'class': 'ln is-faint' }, c.cmp); }
      for (var k = 0; k < 15; k++) U.el('rect', { x: 1060 + (k % 5) * 50, y: 530 + Math.floor(k / 5) * 40, width: 18, height: 18, rx: 3, 'class': 'nd' }, c.cmp);
      U.link(c.cmp, { x: 1310, y: 570, r: 0 }, { x: 1440, y: 570, r: 0 }, { arrow: true }); U.text(c.cmp, 1490, 580, 'vote', 'lab lab--hi', { 'text-anchor': 'middle' });
      c.cmp.setAttribute('transform', 'translate(0,-170)');
      c.most = U.text(svg, 880, 640, 'much of debate’s advantage came from the voting', 'lab lab--hi', { 'text-anchor': 'middle' });
      return c;
    },
    draw: function (c, t, U) {
      var p1 = U.cue(1), before = t < p1;
      var nA = 0, nB = 0;
      c.ans.forEach(function (tk, i) {
        var col = i % 9, x = 640 + col * 80, t0 = 1.2 + i * 0.6;
        if (before) { U.fly(tk, [[380, 265], [x, 300]], t, t0, 1, true); if (t >= t0 + 1) { if ('AABABAAAB'[i] === 'A') nA++; else nB++; } }
        else U.op(tk, 1 - U.ramp(t, p1, 0.6));
      });
      U.setText(c.tally, before ? (nA + nB ? 'A ' + nA + '  ·  B ' + nB : '') : 'A 6  ·  B 3'); U.op(c.tally, before ? 1 : 1 - U.ramp(t, p1, 0.6));
      U.op(c.pick, before ? U.ramp(t, 1.2 + 9 * 0.6 + 1, 0.6) : 1 - U.ramp(t, p1, 0.6));
      U.op(c.m, before ? 1 : 1 - U.ramp(t, p1, 0.6));
      U.op(c.cmp, U.ramp(t, p1 + 0.5, 0.8)); U.op(c.most, U.ramp(t, U.say(1, 'much of the advantage'), 0.8));
    } });
})();
