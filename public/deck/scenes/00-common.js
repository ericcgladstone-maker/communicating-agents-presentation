/* Shared cast for the talk's scenes.
   NCMA.six(svg, U, opts): the six-clue case (models.js SIX). Six agents on a fixed
   hexagon, each with one clue. Clue rings point to the explanation they favor
   (mint ring = A, blue ring = B) and their SIZE shows strength: this is the one
   place in the talk where size carries meaning, and the narration says so.
   The case is an illustrative model: outcomes come from NCMA.models.runSix. */
(function () {
  'use strict';
  var NCMA = window.NCMA;
  var M = NCMA.models;
  NCMA.six = function (svg, U, o) {
    o = o || {};
    var cx = o.cx || 620, cy = o.cy || 400, R = o.R || 250, r = o.r || 40;
    var c = { ag: {}, pos: {}, clue: {}, links: {}, cx: cx, cy: cy };
    c.edges = U.g(svg, 'six-edges'); c.nodes = U.g(svg, 'six-nodes'); c.tk = U.g(svg, 'six-tk');
    M.SIX.order.forEach(function (a, i) { var th = -Math.PI / 2 + i * Math.PI / 3; c.pos[a] = [cx + R * Math.cos(th), cy + R * Math.sin(th), Math.cos(th), Math.sin(th)]; });
    M.SIX.topologies.complete.forEach(function (e) {
      var A = c.pos[e[0]], B = c.pos[e[1]];
      var l = U.link(c.edges, { x: A[0], y: A[1], r: r }, { x: B[0], y: B[1], r: r });
      U.op(l, 0); c.links[e[0] + e[1]] = c.links[e[1] + e[0]] = l;
    });
    M.SIX.agents.forEach(function (a) {
      var p = c.pos[a];
      c.ag[a] = U.agent(c.nodes, { x: p[0], y: p[1], r: r });
      var w = M.SIX.clue[a], strong = Math.abs(w) > 1;
      var tx = p[0] + p[2] * (r + 44), ty = p[1] + p[3] * (r + 44);
      c.clue[a] = U.token(c.nodes, 'evidence', { r: strong ? 25 : 14, cls: w > 0 ? 'clue-A' : 'clue-B' });
      U.place(c.clue[a], tx, ty);
      c.clue[a]._xy = [tx, ty];
    });
    // answer marks on the agents: '' | 'A' | 'B' | '?'
    c.judge = function (a, v) {
      var g = c.ag[a];
      U.cls(g.g, 'is-A', v === 'A'); U.cls(g.g, 'is-B', v === 'B');
      U.setText(g.mark, v || '');
    };
    c.topo = function (name, t, t0) {
      var on = {}; (name ? M.SIX.topologies[name] : []).forEach(function (e) { on[e[0] + e[1]] = on[e[1] + e[0]] = 1; });
      Object.keys(c.links).forEach(function (k) { U.op(c.links[k], on[k] ? (t0 == null ? 1 : U.ramp(t, t0, 0.8)) * 0.8 : 0); });
    };
    c.clues = function (o2) { M.SIX.agents.forEach(function (a) { U.op(c.clue[a], o2); }); };
    // one round of exchange between t0 and t0+d: tokens fly every edge both ways.
    // kind 'evidence' carries the sender's clue count; 'conclusion' carries its answer.
    c.round = function (hist, r, kind, t, t0, d, topoName) {
      var key = 'r' + r + kind + (topoName || '');
      if (!c[key]) {
        c[key] = hist[r].msgs.map(function (m) {
          // a message carrying one clue is drawn as that clue (color = direction, size = strength); more clues carry a count
          var one = kind === 'evidence' && m.ev.length === 1 ? M.SIX.clue[m.ev[0]] : null;
          var tk = one != null ? U.token(c.tk, 'evidence', { r: Math.abs(one) > 1 ? 22 : 14, cls: one > 0 ? 'clue-A' : 'clue-B' })
            : kind === 'evidence' ? U.token(c.tk, 'evidence', { r: 20, label: m.ev.length }) : U.token(c.tk, 'conclusion', { r: 20, label: m.cc });
          var A = c.pos[m.from], B = c.pos[m.to], s = U.seg([A[0], A[1]], [B[0], B[1]], r + 10, r + 10);
          return { tk: tk, pts: s };
        });
      }
      c[key].forEach(function (x, i) { U.fly(x.tk, x.pts, t, t0 + (i % 6) * 0.05, d, false); });
    };
    return c;
  };
  // a balance: left pan holds weights for B, right for A; tilts by the signed sum
  NCMA.balance = function (svg, U, x, y) {
    var g = U.g(svg, 'balance'), b = { g: g };
    U.el('path', { d: 'M' + x + ',' + (y + 150) + ' L' + (x - 40) + ',' + (y + 210) + ' L' + (x + 40) + ',' + (y + 210) + ' Z', 'class': 'box' }, g);
    b.beam = U.g(g); U.place(b.beam, x, y + 150);
    U.el('line', { x1: -230, y1: 0, x2: 230, y2: 0, 'class': 'rule', 'stroke-width': 4 }, b.beam);
    b.left = U.g(b.beam); b.right = U.g(b.beam);
    U.el('path', { d: 'M-300,-6 L-160,-6 L-180,22 L-280,22 Z', 'class': 'box' }, b.left);
    U.el('path', { d: 'M160,-6 L300,-6 L280,22 L180,22 Z', 'class': 'box' }, b.right);
    [-280, -250, -220, -190].forEach(function (px) { var tk = U.token(b.left, 'evidence', { r: 12, cls: 'clue-B' }); U.place(tk, px + 8, -22); U.op(tk, 1); });
    [-6, 30].forEach(function (dx) { var tk = U.token(b.right, 'evidence', { r: 22, cls: 'clue-A' }); U.place(tk, 215 + dx, -32); U.op(tk, 1); });
    b.labL = U.text(g, x - 230, y + 270, 'four weak clues for B', 'lab', { 'text-anchor': 'middle' });
    b.labR = U.text(g, x + 230, y + 270, 'two strong clues for A', 'lab lab--hi', { 'text-anchor': 'middle' });
    b.tilt = function (deg) { b.beam.setAttribute('transform', 'translate(' + x + ',' + (y + 150) + ') rotate(' + deg.toFixed(2) + ')'); };
    return b;
  };
  // a numbered stage label that fades in at a time
  NCMA.say = function (svg, U, x, y, str, cls, anchor) { var t = U.text(svg, x, y, str, cls || 'word', { 'text-anchor': anchor || 'start' }); U.op(t, 0); return t; };
})();
