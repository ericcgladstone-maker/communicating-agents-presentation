/* Deterministic teaching systems (curriculum/examples.md). Classic script that also
   loads under Node for tests (module.exports). Figures draw what these functions
   compute; no figure hard-codes an outcome.

   1. SIX-CLUE CASE: information integration.
      Two candidate explanations, A and B. Six agents each hold one private clue,
      scored as a weight of evidence: positive favors A, negative favors B.
      Four agents hold weak clues for B (-1 each); two hold strong clues for A
      (+3 each). Pooled, the evidence favors A (sum +2). A vote of private
      leanings favors B (4 to 2). This is the hidden-profile structure of
      Stasser & Titus (1985) with explicit weights.

      Exchange is synchronous, in rounds. In round t every agent sends to each
      neighbor what it held at the end of round t-1.
        evidence mode   the message is the set of clue identities known; the
                        receiver takes the union. Judgment = sign(sum of known
                        weights); a zero sum keeps the previous judgment.
        conclusion mode the message is the sender's current judgment (A or B).
                        Judgment = majority over own judgment and those received;
                        a tie keeps the own judgment.
      These rules are assumptions chosen to be transparent. They are not a
      description of how language-model agents behave. */
(function (root) {
  'use strict';
  var M = {};

  var SIX = {
    agents: ['a1', 'a2', 'a3', 'a4', 'a5', 'a6'],
    clue: { a1: -1, a2: -1, a3: -1, a4: -1, a5: 3, a6: 3 },
    // hexagon positions, clockwise from the top; fixed for every topology
    order: ['a1', 'a2', 'a5', 'a3', 'a6', 'a4'],
    topologies: {
      none: [],
      complete: null, // filled below
      ring: [['a1', 'a2'], ['a2', 'a5'], ['a5', 'a3'], ['a3', 'a6'], ['a6', 'a4'], ['a4', 'a1']],
      chain: [['a1', 'a2'], ['a2', 'a5'], ['a5', 'a3'], ['a3', 'a6'], ['a6', 'a4']],
      starA1: [['a1', 'a2'], ['a1', 'a3'], ['a1', 'a4'], ['a1', 'a5'], ['a1', 'a6']],
      starA5: [['a5', 'a1'], ['a5', 'a2'], ['a5', 'a3'], ['a5', 'a4'], ['a5', 'a6']],
      clusters: [['a4', 'a1'], ['a1', 'a2'], ['a2', 'a4'], ['a6', 'a3'], ['a3', 'a5'], ['a5', 'a6'], ['a2', 'a5']]
    }
  };
  SIX.topologies.complete = [];
  for (var i = 0; i < 6; i++) for (var j = i + 1; j < 6; j++) SIX.topologies.complete.push([SIX.agents[i], SIX.agents[j]]);
  M.SIX = SIX;

  var sign = function (x, prev) { return x > 0 ? 'A' : x < 0 ? 'B' : prev; };
  M.sum = function (ids) { return ids.reduce(function (a, id) { return a + SIX.clue[id]; }, 0); };
  M.neighbors = function (edges, directed) {
    var nb = {}; SIX.agents.forEach(function (a) { nb[a] = []; });
    edges.forEach(function (e) { nb[e[1]].push(e[0]); if (!directed) nb[e[0]].push(e[1]); });
    return nb; // nb[x] = agents that send to x
  };
  // run({topology|edges, mode, rounds, directed}) -> history[0..rounds]
  M.runSix = function (o) {
    var edges = o.edges || SIX.topologies[o.topology], nb = M.neighbors(edges, o.directed);
    var know = {}, judge = {};
    SIX.agents.forEach(function (a) { know[a] = [a]; judge[a] = sign(SIX.clue[a], null); });
    var hist = [{ round: 0, know: clone(know), judge: Object.assign({}, judge), msgs: [] }];
    for (var r = 1; r <= o.rounds; r++) {
      var nk = {}, nj = {}, msgs = [];
      SIX.agents.forEach(function (a) {
        nb[a].forEach(function (s) { msgs.push({ from: s, to: a, ev: know[s].slice(), cc: judge[s] }); });
        if (o.mode === 'evidence') {
          var u = know[a].slice();
          nb[a].forEach(function (s) { know[s].forEach(function (id) { if (u.indexOf(id) < 0) u.push(id); }); });
          u.sort(); nk[a] = u; nj[a] = sign(M.sum(u), judge[a]);
        } else {
          var votes = [judge[a]].concat(nb[a].map(function (s) { return judge[s]; }));
          var nA = votes.filter(function (v) { return v === 'A'; }).length, nB = votes.length - nA;
          nk[a] = know[a].slice(); nj[a] = nA > nB ? 'A' : nB > nA ? 'B' : judge[a];
        }
      });
      know = nk; judge = nj;
      hist.push({ round: r, know: clone(know), judge: Object.assign({}, judge), msgs: msgs });
    }
    return hist;
  };
  M.readout = function (h, rule) {
    var j = h.judge;
    if (rule && rule.indexOf('node:') === 0) return j[rule.slice(5)];
    var nA = SIX.agents.filter(function (a) { return j[a] === 'A'; }).length, nB = 6 - nA;
    return nA > nB ? 'A' : nB > nA ? 'B' : 'tie';
  };
  M.count = function (h, v) { return SIX.agents.filter(function (a) { return h.judge[a] === v; }).length; };
  function clone(k) { var o = {}; for (var a in k) o[a] = k[a].slice(); return o; }

  /* 2. RELAY: information transformation along a summarizing chain. A single
        source statement passes through four rewriting agents. The edits at each
        hop are authored (conceptual), chosen to show the transformation types
        that the literature measures; they are not model outputs. */
  M.RELAY = {
    source: 'A preliminary analysis of one district found that the new routing rule may have reduced average response time by about 10%, according to the city transport office.',
    hops: [
      { text: 'A preliminary analysis of one district found the new routing rule may have cut response times by about 10%, the transport office reported.', ops: [] },
      { text: 'The new routing rule cut response times by about 10% in one district, according to the transport office.', ops: [{ k: 'hedge', what: '"preliminary" and "may have" dropped: a tentative estimate becomes an assertion' }] },
      { text: 'The new routing rule cut response times by 10%, officials said.', ops: [{ k: 'scope', what: '"in one district" dropped: a local result becomes general' }, { k: 'attribution', what: '"the transport office" becomes "officials"' }, { k: 'precision', what: '"about 10%" becomes "10%"' }] },
      { text: 'The new routing rule cut response times by 10% and is being rolled out citywide.', ops: [{ k: 'addition', what: '"is being rolled out citywide" added: no upstream message says this' }, { k: 'attribution', what: 'attribution lost entirely' }] }
    ],
    // what a token-level check would see: the named entity and the number survive every hop
    tokens: ['routing rule', '10%', 'response time']
  };

  /* 3. BRIEFING WORKFLOW: a multi-step production task. An orchestrator splits a
        request into three sub-questions, two researcher agents retrieve and read
        sources, a writer drafts into a shared document, a reviewer checks claims
        against the retrieved sources, and a person approves release. The event log
        is authored and deterministic. */
  M.BRIEF = {
    actors: [
      { id: 'orc', role: 'hub', label: 'Orchestrator' },
      { id: 'r1', role: 'agent', label: 'Researcher 1' },
      { id: 'r2', role: 'agent', label: 'Researcher 2' },
      { id: 'web', role: 'tool', label: 'Search tool' },
      { id: 'doc', role: 'artifact', label: 'Shared draft' },
      { id: 'wr', role: 'agent', label: 'Writer' },
      { id: 'rv', role: 'agent', label: 'Reviewer' },
      { id: 'hu', role: 'human', label: 'Approver' }
    ],
    log: [
      { t: 1, from: 'hu', to: 'orc', kind: 'instruction', what: 'Request: a two-page briefing on regional flood-sensor coverage' },
      { t: 2, from: 'orc', to: 'r1', kind: 'instruction', what: 'Sub-task 1: which districts have sensors, and since when' },
      { t: 2, from: 'orc', to: 'r2', kind: 'instruction', what: 'Sub-task 2: reported sensor failures in the last two years' },
      { t: 3, from: 'r1', to: 'web', kind: 'instruction', what: 'Tool call: search(query)' },
      { t: 3, from: 'r2', to: 'web', kind: 'instruction', what: 'Tool call: search(query)' },
      { t: 4, from: 'web', to: 'r1', kind: 'evidence', what: 'Four documents returned' },
      { t: 4, from: 'web', to: 'r2', kind: 'evidence', what: 'Three documents returned' },
      { t: 5, from: 'r1', to: 'doc', kind: 'evidence', what: 'Notes with source links written to the shared draft' },
      { t: 5, from: 'r2', to: 'doc', kind: 'evidence', what: 'Notes with source links written to the shared draft' },
      { t: 6, from: 'orc', to: 'wr', kind: 'instruction', what: 'Draft the briefing from the notes' },
      { t: 7, from: 'doc', to: 'wr', kind: 'evidence', what: 'Writer reads the notes' },
      { t: 8, from: 'wr', to: 'doc', kind: 'conclusion', what: 'Draft written' },
      { t: 9, from: 'doc', to: 'rv', kind: 'both', what: 'Reviewer reads draft and notes' },
      { t: 10, from: 'rv', to: 'orc', kind: 'conclusion', what: 'Two claims lack a source: returned for revision' },
      { t: 11, from: 'orc', to: 'hu', kind: 'both', what: 'Revised draft with sources submitted for approval' }
    ]
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = M;
  else { root.NCMA = root.NCMA || {}; root.NCMA.models = M; }
})(this);
