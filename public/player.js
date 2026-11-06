/* Autoplay player (adapted from the Sandia presentation's player.js).

   Differences from Sandia: this deck has phases inside each page, keyed to
   the passage clock. The player pushes its clock into the deck every frame
   through __t(seconds), so pausing, stepping a passage or changing speed
   moves the visual and the prose together. A click or key inside the deck
   advances the deck by one phase; the player follows and pauses.

   Original notes follow.

   Autoplay player for the unmodified v13 deck.

   The deck advances one state per gesture, and every animation inside a state
   runs on the deck's own timers. So autoplay never needs to click anything: it
   only decides WHEN to advance, through the hooks the deck already exposes:
     __seek(i)  show state i with animation on (what a presenter's click does)
     __state()  the state currently on screen
   These are only reachable because the deck is served from the same origin as
   this page. Serve both together, and embed THIS page elsewhere if needed.

   Everything is scoped to a [data-sp="root"] element, parts are found by
   data-sp names inside it, and keyboard shortcuts only apply while focus is
   inside the player, so it can sit inside another site's page. */
(function () {
  'use strict';

  var T = window.TIMELINE.states;
  var root = document.querySelector('[data-sp="root"]');
  var $ = function (name) { return root.querySelector('[data-sp="' + name + '"]'); };
  var frame = $('deck'), box = $('stage');
  var playBtn = $('play'), track = $('track'), jump = $('jump'), prose = $('prose');
  var panel = prose.parentNode;
  var now = $('now'), pos = $('pos');

  var deck = null;          // the iframe's window once it has booted
  var cur = 0;              // state the player believes is on screen
  var t = 0;                // seconds elapsed inside the current state
  var navSeen = 0;          // deck's own navigation counter (clicks/keys inside the deck)
  var playing = false, speed = 1, last = 0;

  var starts = [], total = 0;
  T.forEach(function (s) { starts.push(total); total += s.duration; });

  function clock(sec) {
    sec = Math.max(0, Math.floor(sec));
    return Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0');
  }

  /* ---- scale the 1920x1080 deck viewport to the stage box --------------- */
  function fitDeck() {
    // letterboxed fit, so the same code serves the page layout and the expanded (fullscreen) stage
    var w = box.clientWidth, h = box.clientHeight || w * 9 / 16, s = Math.min(w / 1920, h / 1080);
    box.style.setProperty('--sp-s', s);
    frame.style.left = Math.max(0, (w - 1920 * s) / 2) + 'px'; frame.style.top = Math.max(0, (h - 1080 * s) / 2) + 'px';
  }
  if (window.ResizeObserver) new ResizeObserver(fitDeck).observe(box);
  else addEventListener('resize', fitDeck);
  fitDeck();

  /* ---- the full text of the talk, below the player ---------------------
     Its height is fixed (it scrolls inside itself) so host pages never see
     their own height change during playback. */
  function sizeTranscript() { panel.style.height = Math.round(Math.max(240, innerHeight * 0.7)) + 'px'; }
  addEventListener('resize', sizeTranscript);

  /* ---- the reading panel beside the stage ---------------------------------
     It shows ALL the text of one page: each beat is a lead paragraph (the one
     the clock reads) and any continuation paragraphs. The beat that matches
     the stage is highlighted, and the panel scrolls to it, but nothing else is
     hidden. Hold: while a viewer scrolls or selects text in the panel, or
     presses Hold, the panel keeps its page and scroll position even when the
     stage moves on; Follow (or any navigation) returns it to the stage. */
  var heldNote = $('held');
  var shownScene = -1, held = false, autoScroll = 0;
  function beatEls() { return now.querySelectorAll('.sp-beat'); }
  function renderPanel(i) {
    var s = T[i];
    shownScene = i; shownOn = -1;
    now.innerHTML = '';
    if (!s.paragraphs.length) { var e = document.createElement('p'); e.className = 'sp-empty'; e.textContent = 'Text for this page has not been added yet.'; now.appendChild(e); }
    s.paragraphs.forEach(function (p, k) {
      var sec = document.createElement('section'); sec.className = 'sp-beat'; sec.dataset.k = k;
      [p.text].concat(p.more || []).forEach(function (txt, j) {
        var el = document.createElement('p'); el.textContent = txt; if (j) el.className = 'sp-more'; sec.appendChild(el);
      });
      sec.addEventListener('click', function () {
        if (String(window.getSelection && getSelection())) return;   // selecting text never moves the clock
        release(); if (cur !== i) go(i); t = p.at; renderTime();
      });
      now.appendChild(sec);
    });
    now.scrollTop = 0;
  }
  function scrollPanelTo(el) {
    var top = el.offsetTop - 22;   // .sp-read is positioned, so offsetTop is measured from it
    autoScroll = Date.now();
    if (now.scrollTo) now.scrollTo({ top: Math.max(0, top), behavior: reduceMotion ? 'auto' : 'smooth' });
    else now.scrollTop = top;
  }
  function updateHeld() {
    now.setAttribute('data-held', held ? 'true' : 'false');
    var away = held && shownScene !== cur;
    heldNote.hidden = !away;
    if (away) heldNote.textContent = 'Text held on page ' + (shownScene + 1) + ' · ' + T[shownScene].label + '. The stage is on page ' + (cur + 1) + '. Show the stage’s page ›';
  }
  function hold() { if (!held) { held = true; updateHeld(); } }
  function release() {
    if (!held) return;
    held = false;
    if (shownScene !== cur) renderPanel(cur);
    updateHeld(); shownOn = -1; renderTime();
  }
  heldNote.addEventListener('click', release);
  ['wheel', 'touchmove'].forEach(function (ev) { now.addEventListener(ev, hold, { passive: true }); });
  now.addEventListener('keydown', function (e) { if (/^(ArrowUp|ArrowDown|PageUp|PageDown|Home|End)$/.test(e.key)) hold(); });
  now.addEventListener('pointerdown', function (e) { if (e.target === now) hold(); });   // the scrollbar
  document.addEventListener('selectionchange', function () {
    var sel = window.getSelection && getSelection();
    if (sel && String(sel) && now.contains(sel.anchorNode)) hold();
  });
  function showNow(s, on) {
    var bs = beatEls();
    for (var k = 0; k < bs.length; k++) bs[k].classList.toggle('sp-on', shownScene === cur && k === on);
    pos.textContent = shownScene === cur && s.paragraphs.length > 1 ? 'Passage ' + (on + 1) + ' / ' + s.paragraphs.length : '';
    if (!held && bs[on] && (on > 0 || now.scrollTop > 0)) scrollPanelTo(bs[on]);
  }

  /* One sequence (Eric, 2026-10-05): ‹ › and the arrow keys step one passage
     at a time, and the deck moves with the text (the clock is set to the
     passage's cue and pushed to the deck every frame). At either end of a page
     they cross into the next page's first passage or the previous page's last,
     so there is no separate level of navigation inside a page. */
  function step(d) {
    var s = T[cur], k = (shownOn < 0 ? 0 : shownOn) + d;
    setPlaying(false); release();
    if (k >= 0 && k < s.paragraphs.length) { t = s.paragraphs[k].at; renderTime(); return; }
    if (d > 0 && cur < T.length - 1) go(cur + 1);
    else if (d < 0 && cur > 0) {
      go(cur - 1);
      var ps = T[cur].paragraphs;
      if (ps.length) { t = ps[ps.length - 1].at; renderTime(); }
    }
  }

  var reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var shownOn = -1;

  /* ---- static UI -------------------------------------------------------- */
  $('total').textContent = clock(total);
  T.forEach(function (s, i) {
    var seg = document.createElement('i');
    seg.style.flex = s.duration;
    seg.title = (i + 1) + '. ' + s.label;
    seg.appendChild(document.createElement('b'));
    seg.addEventListener('click', function () { release(); go(i); });
    track.appendChild(seg);

    var o = document.createElement('option');
    o.value = i; o.textContent = (i + 1) + ' / ' + T.length + ' · ' + s.label;
    jump.appendChild(o);
  });

  /* ---- navigation ------------------------------------------------------- */
  function go(i) {
    cur = Math.max(0, Math.min(T.length - 1, i));
    t = 0;
    if (deck) deck.__seek(cur);
    renderState();
  }

  function setPlaying(on) {
    playing = on && !!deck;
    playBtn.textContent = playing ? '❚❚' : '▶';
    playBtn.setAttribute('aria-label', playing ? 'Pause' : 'Play');
    playBtn.title = playing ? 'Pause' : 'Play';
  }

  playBtn.addEventListener('click', function () {
    if (!playing && cur === T.length - 1 && t >= T[cur].duration) go(0);
    else if (!playing && t === 0) go(cur);   // start the state's animation from its beginning
    setPlaying(!playing);
  });
  $('prev').addEventListener('click', function () { step(-1); });
  $('next').addEventListener('click', function () { step(1); });
  $('restart').addEventListener('click', function () { release(); go(0); });
  var expand = $('expand');
  if (expand) {
    if (!box.requestFullscreen) expand.hidden = true;
    expand.addEventListener('click', function () {
      if (document.fullscreenElement) document.exitFullscreen();
      else box.requestFullscreen().catch(function () {});
    });
    document.addEventListener('fullscreenchange', function () {
      var on = document.fullscreenElement === box;
      expand.textContent = on ? '⤡ Exit' : '⤢ Expand';
      expand.setAttribute('aria-label', on ? 'Exit full screen' : 'Show the slides full screen');
      fitDeck();
    });
  }
  $('speed').addEventListener('change', function (e) { speed = +e.target.value; });
  jump.addEventListener('change', function (e) { release(); go(+e.target.value); });

  root.addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.target.closest && e.target.closest('button, select')) return;
    if (e.key === ' ' || e.key === 'k') { e.preventDefault(); playBtn.click(); }
    else if (e.key === 'ArrowRight' || e.key === '.') { e.preventDefault(); step(1); }
    else if (e.key === 'ArrowLeft' || e.key === ',') { e.preventDefault(); step(-1); }
  });

  /* ---- rendering -------------------------------------------------------- */
  /* the full text of the talk is written once; the current page is marked */
  var fullBuilt = false;
  function buildFull() {
    if (fullBuilt) return; fullBuilt = true;
    prose.innerHTML = '';
    T.forEach(function (s, i) {
      var h = document.createElement('h3'); h.className = 'sp-fullhd'; h.dataset.i = i; h.textContent = (i + 1) + '. ' + s.heading; prose.appendChild(h);
      s.paragraphs.forEach(function (p) {
        [p.text].concat(p.more || []).forEach(function (txt) {
          var el = document.createElement('p'); el.textContent = txt; el.dataset.i = i;
          el.addEventListener('click', function () { if (String(window.getSelection && getSelection())) return; release(); go(i); t = p.at; renderTime(); });
          prose.appendChild(el);
        });
      });
    });
  }
  var fullDetails = panel.closest('details');
  if (fullDetails) fullDetails.addEventListener('toggle', function () { if (fullDetails.open) { buildFull(); markFull(); } });
  function markFull() {
    if (!fullBuilt) return;
    var els = prose.querySelectorAll('[data-i]'), first = null;
    for (var k = 0; k < els.length; k++) { var on = +els[k].dataset.i === cur; els[k].classList.toggle('sp-on', on); if (on && !first) first = els[k]; }
    if (first && fullDetails && fullDetails.open) panel.scrollTop = Math.max(0, first.offsetTop - 12);
  }

  function renderState() {
    var s = T[cur];
    jump.value = cur;
    $('count').textContent = 'Page ' + (cur + 1) + ' of ' + T.length;
    if (!held || shownScene < 0) renderPanel(cur);
    shownOn = -1;
    updateHeld(); markFull();
    // keep the address a direct link to the current page (not when embedded in a host page)
    if (deck && !document.documentElement.classList.contains('embed') && history.replaceState && location.hash !== '#' + s.id) history.replaceState(null, '', '#' + s.id);
    renderTime();
  }

  function renderTime() {
    var s = T[cur];
    $('elapsed').textContent = clock(starts[cur] + t);
    var segs = track.children;
    for (var i = 0; i < segs.length; i++) {
      segs[i].className = i < cur ? 'sp-done' : '';
      segs[i].firstChild.style.width = i === cur ? (100 * t / s.duration) + '%' : '';
    }
    var on = 0;
    s.paragraphs.forEach(function (p, k) { if (p.at <= t) on = k; });
    if (on !== shownOn) { shownOn = on; showNow(s, on); }
  }

  /* ---- the clock -------------------------------------------------------- */
  function tick(now) {
    var dt = last ? Math.min((now - last) / 1000, 0.25) : 0;
    last = now;
    if (deck) {
      /* a visitor clicked or keyed inside the deck: follow it and pause */
      var seen = deck.__state(), nav = deck.__nav ? deck.__nav() : 0;
      if (seen !== cur || nav !== navSeen) {
        navSeen = nav; setPlaying(false);
        if (seen !== cur) { cur = seen; renderState(); }
        t = deck.__time ? Math.min(deck.__time(), T[cur].duration) : 0; renderTime();
      }
      else if (playing) {
        t += dt * speed;
        if (t >= T[cur].duration) {
          if (cur < T.length - 1) go(cur + 1);
          else { t = T[cur].duration; setPlaying(false); }
        }
        renderTime();
      }
      if (deck.__t) deck.__t(t);
    }
    requestAnimationFrame(tick);
  }

  /* ---- boot ------------------------------------------------------------- */
  /* The deck boots on fonts.ready or after 350 ms, whichever comes first, and
     shows its start state then. Wait past that so our first seek is not undone. */
  function attach() {
    var w;
    try { w = frame.contentWindow; if (!w.__deckReady || !w.__seek) throw 0; }
    catch (err) {
      now.innerHTML = '<p class="sp-empty">The player cannot reach the deck. Open this page through a web server (see README), not by double-clicking the file.</p>';
      return;
    }
    setTimeout(function () {
      deck = w; cur = w.__state(); navSeen = w.__nav ? w.__nav() : 0;
      /* a direct link to a page: index.html#scene-id opens on that page, paused at its start */
      var want = decodeURIComponent(location.hash.slice(1)), at = -1;
      T.forEach(function (s, i) { if (s.id === want) at = i; });
      if (at >= 0) go(at); else renderState();
    }, 600);
  }
  if (frame.contentDocument && frame.contentDocument.readyState === 'complete' && frame.contentWindow.__deckReady) attach();
  else frame.addEventListener('load', attach);

  sizeTranscript();
  renderState();
  requestAnimationFrame(tick);
})();
