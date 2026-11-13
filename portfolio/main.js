/* Portfolio interactions — vanilla JS, no build step. */
(() => {
  'use strict';

  const { PROFILE, PROJECTS, DISCIPLINES, TOOLKIT } = window;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const prefersReducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const escapeHtml = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pad2 = (n) => String(n).padStart(2, '0');
  const fmtDate = (ym) => {
    const [y, m] = ym.split('-').map(Number);
    return `${MONTHS[m - 1]} ${y}`;
  };
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  /* ─────────── Theme ─────────── */
  function currentTheme() {
    const set = document.documentElement.dataset.theme;
    if (set) return set;
    return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  function toggleTheme() {
    const next = currentTheme() === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch (e) { /* storage unavailable: theme just won't persist */ }
    $('meta[name="theme-color"]').setAttribute('content', next === 'dark' ? '#0e0e0c' : '#f2efe8');
  }
  $('#themeToggle').addEventListener('click', toggleTheme);

  /* ─────────── Hero dot field (cursor-reactive) ─────────── */
  function initDots() {
    const canvas = $('#dots');
    const ctx = canvas.getContext('2d');
    const GAP = 28;
    const RADIUS = 160;
    let w = 0, h = 0, dpr = 1, points = [];
    const mouse = { x: -9999, y: -9999 };

    function resize() {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = rect.width; h = rect.height;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      points = [];
      for (let y = GAP / 2; y < h; y += GAP) for (let x = GAP / 2; x < w; x += GAP) points.push({ x, y });
    }
    function draw() {
      ctx.clearRect(0, 0, w, h);
      const styles = getComputedStyle(document.documentElement);
      const ink = styles.getPropertyValue('--line-strong').trim();
      const accent = styles.getPropertyValue('--accent').trim();
      for (const p of points) {
        const dx = p.x - mouse.x, dy = p.y - mouse.y;
        const dist = Math.hypot(dx, dy);
        const t = Math.max(0, 1 - dist / RADIUS);
        const push = t * 10;
        const ox = dist ? (dx / dist) * push : 0;
        const oy = dist ? (dy / dist) * push : 0;
        ctx.beginPath();
        ctx.fillStyle = t > 0.35 ? accent : ink;
        ctx.arc(p.x + ox, p.y + oy, 1 + t * 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    let raf = 0;
    const schedule = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; draw(); }); };
    canvas.parentElement.addEventListener('pointermove', (e) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; schedule();
    });
    canvas.parentElement.addEventListener('pointerleave', () => { mouse.x = mouse.y = -9999; schedule(); });
    new ResizeObserver(() => { resize(); schedule(); }).observe(canvas);
    new MutationObserver(schedule).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  }

  /* ─────────── Marquee ─────────── */
  function initMarquee() {
    const items = [...TOOLKIT, ...TOOLKIT].map((t) => `<span>${escapeHtml(t)}</span>`).join('');
    $('#marquee').innerHTML = items;
  }

  /* ─────────── Generative cover art ─────────── */
  function coverSvg(index) {
    const variants = [
      () => Array.from({ length: 9 }, (_, i) => `<circle cx="78%" cy="40%" r="${12 + i * 14}" fill="none" stroke="currentColor" stroke-opacity="${0.5 - i * 0.05}"/>`).join(''),
      () => Array.from({ length: 14 }, (_, i) => `<line x1="${i * 8}%" y1="0" x2="${i * 8 + 30}%" y2="100%" stroke="currentColor" stroke-opacity=".3"/>`).join(''),
      () => Array.from({ length: 8 }, (_, i) => `<path d="M0 ${30 + i * 9} Q 25 ${10 + i * 9} 50 ${30 + i * 9} T 100 ${30 + i * 9}" fill="none" stroke="currentColor" stroke-opacity=".35" vector-effect="non-scaling-stroke"/>`).join(''),
      () => Array.from({ length: 40 }, (_, i) => `<rect x="${(i % 8) * 12.5 + 3}%" y="${Math.floor(i / 8) * 20 + 4}%" width="6%" height="10%" fill="currentColor" fill-opacity="${((i * 37) % 10) / 22}"/>`).join(''),
      () => Array.from({ length: 6 }, (_, i) => `<rect x="${10 + i * 6}%" y="${10 + i * 6}%" width="${80 - i * 12}%" height="${80 - i * 12}%" fill="none" stroke="currentColor" stroke-opacity=".35"/>`).join(''),
      () => Array.from({ length: 30 }, (_, i) => `<circle cx="${(i * 53) % 100}%" cy="${(i * 29) % 100}%" r="${2 + (i % 4)}" fill="currentColor" fill-opacity=".45"/>`).join(''),
    ];
    const isWave = index % variants.length === 2;
    const viewBox = isWave ? 'viewBox="0 0 100 100" preserveAspectRatio="none"' : '';
    return `<svg ${viewBox} aria-hidden="true">${variants[index % variants.length]()}</svg>`;
  }
  function coverHtml(p, index) {
    return `<div class="cover">${coverSvg(index)}<span class="cover-num">${pad2(index + 1)}</span><span class="cover-label">${escapeHtml(p.lang)} · ${escapeHtml(fmtDate(p.date))}</span></div>`;
  }

  /* ─────────── Flagship: simulated chat ─────────── */
  const DEMO_SCRIPT = {
    question: 'What dataset did the authors use for evaluation?',
    answer: 'The authors evaluated on a held-out split of 2,400 annotated documents, reporting precision and recall separately for each document category.',
    cites: ['p. 4 · Methods', 'p. 7 · Table 2'],
  };
  let demoRun = 0;
  async function playDemo() {
    const run = ++demoRun;
    const body = $('#demoBody');
    const alive = () => run === demoRun;
    body.innerHTML = '';
    await sleep(400);
    body.insertAdjacentHTML('beforeend', `<div class="msg msg-user">${escapeHtml(DEMO_SCRIPT.question)}</div>`);
    await sleep(700); if (!alive()) return;
    body.insertAdjacentHTML('beforeend', '<div class="thinking" aria-label="Thinking"><i></i><i></i><i></i></div>');
    await sleep(1300); if (!alive()) return;
    body.lastElementChild.remove();
    const msg = document.createElement('div');
    msg.className = 'msg msg-ai';
    const text = document.createElement('span');
    msg.append(text, Object.assign(document.createElement('span'), { className: 'caret' }));
    body.append(msg);
    const words = DEMO_SCRIPT.answer.split(' ');
    for (let i = 0; i < words.length; i++) {
      if (!alive()) return;
      text.textContent += (i ? ' ' : '') + words[i];
      await sleep(prefersReducedMotion ? 0 : 45);
    }
    msg.querySelector('.caret').remove();
    const cites = document.createElement('div');
    cites.className = 'cites';
    DEMO_SCRIPT.cites.forEach((c, i) => {
      const el = Object.assign(document.createElement('span'), { className: 'cite', textContent: `↳ ${c}` });
      el.style.animationDelay = `${i * 120}ms`;
      cites.append(el);
    });
    msg.append(cites);
  }

  /* ─────────── Flagship: pipeline ─────────── */
  function initPipeline() {
    const steps = $$('#pipeSteps li');
    const desc = $('#pipeDesc');
    const status = $('#pipeStatus');
    let auto = 0, timer = 0, hovering = false;

    function setStep(idx) {
      steps.forEach((s, i) => { s.classList.toggle('on', i <= idx); s.classList.toggle('cur', i === idx); });
      desc.textContent = steps[idx].dataset.d;
      status.textContent = idx === steps.length - 1 ? 'answered ✓' : `processing ${idx + 1}/${steps.length}`;
    }
    function tick() {
      if (!hovering) { setStep(auto); auto = (auto + 1) % steps.length; }
      timer = setTimeout(tick, auto === 0 ? 2600 : 1100);
    }
    steps.forEach((s, i) => {
      s.addEventListener('mouseenter', () => { hovering = true; setStep(i); });
      s.addEventListener('mouseleave', () => { hovering = false; });
    });
    const io = new IntersectionObserver(([e]) => {
      clearTimeout(timer);
      if (e.isIntersecting) tick();
    }, { threshold: 0.4 });
    io.observe($('.pipeline'));
  }

  function initFlagship() {
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { playDemo(); io.disconnect(); }
    }, { threshold: 0.4 });
    io.observe($('.demo'));
    $('#demoReplay').addEventListener('click', playDemo);
    initPipeline();
  }

  /* ─────────── Work: filters + list ─────────── */
  const state = { filter: 'All', view: 'list', kbIndex: -1 };
  const matchesFilter = (p) => state.filter === 'All' || p.discipline.includes(state.filter);

  function renderFilters() {
    const options = ['All', ...DISCIPLINES];
    $('#filters').innerHTML = options.map((d) => {
      const count = d === 'All' ? PROJECTS.length : PROJECTS.filter((p) => p.discipline.includes(d)).length;
      return `<button type="button" data-filter="${escapeHtml(d)}" aria-pressed="${d === state.filter}">${escapeHtml(d)}<sup>${count}</sup></button>`;
    }).join('');
  }

  function renderRows() {
    $('#rows').innerHTML = PROJECTS.map((p, i) => {
      const [first, ...rest] = p.title.split(' ');
      const title = rest.length ? `${escapeHtml(first)} <em>${escapeHtml(rest.join(' '))}</em>` : `<em>${escapeHtml(first)}</em>`;
      const tags = p.stack.slice(0, 3).map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join('');
      const live = p.live ? '<span class="live-dot" title="Live deployment"></span>' : '';
      return `<li class="row" data-id="${p.id}">
        <button type="button" class="row-btn" data-open="${p.id}" data-index="${i}">
          <span class="row-idx">${pad2(i + 1)}/${pad2(PROJECTS.length)}</span>
          <span class="row-title">${title}${live}</span>
          <span class="row-tags">${tags}</span>
          <span class="row-date">${escapeHtml(fmtDate(p.date))}</span>
          <span class="row-arrow" aria-hidden="true">→</span>
        </button>
      </li>`;
    }).join('');
  }

  function applyFilter() {
    $$('#filters button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.filter === state.filter)));
    $$('#rows .row').forEach((row) => {
      const p = PROJECTS.find((x) => x.id === row.dataset.id);
      row.hidden = !matchesFilter(p);
    });
    state.kbIndex = -1;
    $$('.row-btn.kb').forEach((b) => b.classList.remove('kb'));
    updateMap();
  }

  function initPreview() {
    const preview = Object.assign(document.createElement('div'), { className: 'preview' });
    document.body.append(preview);
    let x = 0, y = 0, tx = 0, ty = 0, raf = 0;
    const follow = () => {
      x += (tx - x) * 0.18; y += (ty - y) * 0.18;
      preview.style.left = `${x}px`; preview.style.top = `${y}px`;
      raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.5 ? requestAnimationFrame(follow) : 0;
    };
    $('#rows').addEventListener('pointermove', (e) => {
      tx = e.clientX + 170; ty = e.clientY;
      if (!raf) raf = requestAnimationFrame(follow);
    });
    $('#rows').addEventListener('pointerover', (e) => {
      const btn = e.target.closest('.row-btn');
      if (!btn) return;
      const i = Number(btn.dataset.index);
      preview.innerHTML = coverHtml(PROJECTS[i], i);
      preview.classList.add('show');
    });
    $('#rows').addEventListener('pointerleave', () => preview.classList.remove('show'));
  }

  function initWork() {
    renderFilters();
    renderRows();
    $('#filters').addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      state.filter = b.dataset.filter;
      applyFilter();
    });
    $('#rows').addEventListener('click', (e) => {
      const b = e.target.closest('[data-open]');
      if (b) openDrawer(b.dataset.open);
    });
    $$('.view-toggle button').forEach((b) => b.addEventListener('click', () => setView(b.dataset.view)));
    initPreview();
    initMap();
  }

  function setView(view) {
    state.view = view;
    $$('.view-toggle button').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.view === view)));
    $('#viewList').hidden = view !== 'list';
    $('#viewMap').hidden = view !== 'map';
  }

  /* ─────────── Work: map view ─────────── */
  const MAP = { w: 1000, h: 500, left: 150, right: 90, top: 70, laneGap: 105 };
  const monthIndex = (ym) => { const [y, m] = ym.split('-').map(Number); return y * 12 + (m - 1); };
  const mapRange = (() => {
    const idx = PROJECTS.map((p) => monthIndex(p.date));
    return { min: Math.min(...idx), max: Math.max(...idx) };
  })();
  const xFor = (ym) => {
    const span = Math.max(1, mapRange.max - mapRange.min);
    return MAP.left + ((monthIndex(ym) - mapRange.min) / span) * (MAP.w - MAP.left - MAP.right);
  };
  const yFor = (discipline) => MAP.top + DISCIPLINES.indexOf(discipline) * MAP.laneGap;

  function mapNodePositions() {
    const seen = {};
    return PROJECTS.map((p) => {
      const key = `${p.date}|${p.discipline[0]}`;
      const offset = (seen[key] = (seen[key] || 0) + 1) - 1;
      return { p, x: xFor(p.date) + offset * 40, y: yFor(p.discipline[0]) + offset * 22 };
    });
  }

  function initMap() {
    const svg = $('#mapSvg');
    svg.setAttribute('viewBox', `0 0 ${MAP.w} ${MAP.h}`);
    const nodes = mapNodePositions();
    const lanes = DISCIPLINES.map((d) => {
      const y = yFor(d);
      return `<line class="lane" x1="${MAP.left - 20}" x2="${MAP.w - 30}" y1="${y}" y2="${y}"/><text x="24" y="${y + 4}">${escapeHtml(d)}</text>`;
    }).join('');
    const ticks = [];
    for (let m = mapRange.min; m <= mapRange.max; m++) {
      const ym = `${Math.floor(m / 12)}-${pad2((m % 12) + 1)}`;
      ticks.push(`<text x="${xFor(ym)}" y="${MAP.h - 24}" text-anchor="middle">${MONTHS[m % 12]}</text>`);
    }
    const edges = [];
    nodes.forEach((a, i) => nodes.slice(i + 1).forEach((b) => {
      if (!a.p.discipline.some((d) => b.p.discipline.includes(d))) return;
      const mx = (a.x + b.x) / 2;
      edges.push(`<path class="edge" data-a="${a.p.id}" data-b="${b.p.id}" d="M${a.x} ${a.y} C ${mx} ${a.y}, ${mx} ${b.y}, ${b.x} ${b.y}"/>`);
    }));
    const nodeEls = nodes.map(({ p, x, y }) => {
      const flip = x > MAP.w - 260;
      return `<g class="node" data-id="${p.id}" tabindex="0" role="button" aria-label="${escapeHtml(p.title)}, ${escapeHtml(fmtDate(p.date))}">
        <circle cx="${x}" cy="${y}" r="${p.live ? 9 : 7}"/>
        <text x="${flip ? x - 16 : x + 16}" y="${y + 4}" text-anchor="${flip ? 'end' : 'start'}">${escapeHtml(p.title)}</text>
      </g>`;
    }).join('');
    svg.innerHTML = `<rect class="ribbon" x="${MAP.left}" y="30" height="${MAP.h - 80}" width="0"/>
      <line class="ribbon-edge" x1="0" x2="0" y1="30" y2="${MAP.h - 50}"/>
      ${lanes}${ticks.join('')}${edges.join('')}${nodeEls}`;

    const scrub = $('#scrub');
    scrub.min = 0;
    scrub.max = mapRange.max - mapRange.min;
    scrub.value = scrub.max;
    scrub.addEventListener('input', updateMap);

    svg.addEventListener('click', (e) => { const n = e.target.closest('.node'); if (n) openDrawer(n.dataset.id); });
    svg.addEventListener('keydown', (e) => {
      const n = e.target.closest('.node');
      if (n && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openDrawer(n.dataset.id); }
    });
    const tip = $('#mapTip');
    svg.addEventListener('pointerover', (e) => {
      const n = e.target.closest('.node');
      if (!n) { tip.hidden = true; return; }
      const p = PROJECTS.find((x) => x.id === n.dataset.id);
      const c = n.querySelector('circle').getBoundingClientRect();
      const wrap = svg.parentElement.getBoundingClientRect();
      tip.textContent = `${p.lang} · ${fmtDate(p.date)}${p.live ? ' · live' : ''}`;
      tip.style.left = `${c.left - wrap.left + c.width / 2}px`;
      tip.style.top = `${c.top - wrap.top}px`;
      tip.hidden = false;
    });
    svg.addEventListener('pointerleave', () => { tip.hidden = true; });
    updateMap();
  }

  function updateMap() {
    const scrub = $('#scrub');
    if (!scrub || !$('#mapSvg').firstChild) return;
    const limit = mapRange.min + Number(scrub.value);
    const ym = `${Math.floor(limit / 12)}-${pad2((limit % 12) + 1)}`;
    const x = xFor(ym);
    $('#scrubOut').textContent = fmtDate(ym);
    $('#mapSvg .ribbon').setAttribute('width', String(Math.max(0, x - MAP.left)));
    $('#mapSvg .ribbon-edge').setAttribute('x1', String(x));
    $('#mapSvg .ribbon-edge').setAttribute('x2', String(x));
    const visible = new Set(PROJECTS.filter((p) => matchesFilter(p) && monthIndex(p.date) <= limit).map((p) => p.id));
    $$('#mapSvg .node').forEach((n) => n.classList.toggle('off', !visible.has(n.dataset.id)));
    $$('#mapSvg .edge').forEach((e) => { e.style.opacity = visible.has(e.dataset.a) && visible.has(e.dataset.b) ? '1' : '0.08'; });
  }

  /* ─────────── Project drawer ─────────── */
  function openDrawer(id) {
    const i = PROJECTS.findIndex((p) => p.id === id);
    if (i < 0) return;
    const p = PROJECTS[i];
    const prev = PROJECTS[(i - 1 + PROJECTS.length) % PROJECTS.length];
    const next = PROJECTS[(i + 1) % PROJECTS.length];
    const live = p.live ? `<a class="btn btn-solid" href="${escapeHtml(p.live)}" target="_blank" rel="noopener">Open live app ↗</a>` : '';
    $('#drawerInner').innerHTML = `
      <div class="drawer-top">
        <span class="mono dim">${pad2(i + 1)}/${pad2(PROJECTS.length)} — ${escapeHtml(p.discipline.join(' · '))}</span>
        <button class="icon-btn" data-close aria-label="Close project">✕</button>
      </div>
      <div class="drawer-cover">${coverHtml(p, i)}</div>
      <h2 id="drawerTitle">${escapeHtml(p.title)}</h2>
      <p class="lead">${escapeHtml(p.summary)}</p>
      <h3 class="mono dim">Highlights</h3>
      <ul class="feat">${p.features.map((f) => `<li>${escapeHtml(f)}</li>`).join('')}</ul>
      <h3 class="mono dim">Stack</h3>
      <div class="tags">${p.stack.map((s) => `<span class="tag">${escapeHtml(s)}</span>`).join('')}</div>
      <div class="drawer-ctas">${live}<a class="btn btn-ghost" href="${escapeHtml(p.repo)}" target="_blank" rel="noopener">View source ↗</a></div>
      <nav class="drawer-nav" aria-label="Project navigation">
        <button data-goto="${prev.id}" class="mono">← Previous<strong>${escapeHtml(prev.title)}</strong></button>
        <button data-goto="${next.id}" class="mono">Next →<strong>${escapeHtml(next.title)}</strong></button>
      </nav>`;
    const drawer = $('#drawer');
    if (!drawer.open) drawer.showModal();
    drawer.scrollTop = 0;
  }

  function initDrawer() {
    const drawer = $('#drawer');
    drawer.addEventListener('click', (e) => {
      if (e.target === drawer || e.target.closest('[data-close]')) drawer.close();
      const go = e.target.closest('[data-goto]');
      if (go) openDrawer(go.dataset.goto);
    });
    drawer.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        const btns = $$('[data-goto]', drawer);
        btns[e.key === 'ArrowLeft' ? 0 : 1]?.click();
      }
    });
  }

  /* ─────────── Command palette ─────────── */
  function paletteCommands() {
    const scrollTo = (id) => () => document.getElementById(id).scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    const openUrl = (url) => () => window.open(url, '_blank', 'noopener');
    return [
      { label: 'Go to Flagship — DocuMind AI', kind: 'Section', run: scrollTo('flagship') },
      { label: 'Go to Project index', kind: 'Section', run: scrollTo('work') },
      { label: 'Go to About', kind: 'Section', run: scrollTo('about') },
      { label: 'Go to Contact', kind: 'Section', run: scrollTo('contact') },
      { label: 'Toggle light / dark theme', kind: 'Action', run: toggleTheme },
      { label: 'Open GitHub profile', kind: 'Link', run: openUrl(`https://github.com/${PROFILE.github}`) },
      ...PROJECTS.map((p) => ({ label: p.title, kind: 'Project', run: () => openDrawer(p.id) })),
      ...PROJECTS.filter((p) => p.live).map((p) => ({ label: `Launch ${p.title} (live)`, kind: 'Link', run: openUrl(p.live) })),
    ];
  }

  function initPalette() {
    const dlg = $('#palette');
    const input = $('#paletteInput');
    const list = $('#paletteList');
    const commands = paletteCommands();
    let results = commands, active = 0;

    function render() {
      list.innerHTML = results.length
        ? results.map((c, i) => `<li role="option" id="cmd-${i}" data-i="${i}" aria-selected="${i === active}"><span>${escapeHtml(c.label)}</span><span class="mono">${c.kind}</span></li>`).join('')
        : '<li aria-disabled="true"><span class="dim">No results</span></li>';
      input.setAttribute('aria-activedescendant', results.length ? `cmd-${active}` : '');
      list.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
    }
    function run(i) {
      const cmd = results[i];
      if (!cmd) return;
      dlg.close();
      cmd.run();
    }
    function open() {
      if (dlg.open) return;
      input.value = ''; results = commands; active = 0; render();
      dlg.showModal(); input.focus();
    }
    input.addEventListener('input', () => {
      const q = input.value.trim().toLowerCase();
      results = commands.filter((c) => `${c.label} ${c.kind}`.toLowerCase().includes(q));
      active = 0; render();
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); active = Math.min(active + 1, results.length - 1); render(); }
      if (e.key === 'ArrowUp') { e.preventDefault(); active = Math.max(active - 1, 0); render(); }
      if (e.key === 'Enter') { e.preventDefault(); run(active); }
    });
    list.addEventListener('click', (e) => { const li = e.target.closest('[data-i]'); if (li) run(Number(li.dataset.i)); });
    dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
    $('#openPalette').addEventListener('click', open);
    return open;
  }

  /* ─────────── Global keyboard ─────────── */
  function initKeyboard(openPalette) {
    document.addEventListener('keydown', (e) => {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName);
      const dialogOpen = $('#palette').open || $('#drawer').open;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openPalette(); return; }
      if (typing || dialogOpen || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === '/') { e.preventDefault(); openPalette(); return; }
      if (e.key === 'j' || e.key === 'k') moveRowFocus(e.key === 'j' ? 1 : -1);
    });
  }

  function moveRowFocus(delta) {
    if (state.view !== 'list') setView('list');
    const btns = $$('#rows .row:not([hidden]) .row-btn');
    if (!btns.length) return;
    state.kbIndex = Math.max(0, Math.min(btns.length - 1, state.kbIndex + delta));
    btns.forEach((b, i) => b.classList.toggle('kb', i === state.kbIndex));
    btns[state.kbIndex].focus({ preventScroll: true });
    btns[state.kbIndex].scrollIntoView({ block: 'center', behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  }

  /* ─────────── About: stats + live GitHub count ─────────── */
  function countUp(el, to) {
    if (prefersReducedMotion) { el.textContent = String(to); return; }
    const start = performance.now(), DURATION = 1200;
    const step = (now) => {
      const t = Math.min(1, (now - start) / DURATION);
      el.textContent = String(Math.round(to * (1 - Math.pow(1 - t, 3))));
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  async function fetchRepoCount() {
    try {
      const res = await fetch(`https://api.github.com/users/${encodeURIComponent(PROFILE.github)}`, { headers: { Accept: 'application/vnd.github+json' } });
      if (!res.ok) throw new Error(`GitHub API responded ${res.status}`);
      const data = await res.json();
      if (Number.isInteger(data.public_repos)) $('#statRepos').dataset.count = String(data.public_repos);
    } catch (err) {
      console.warn('[portfolio] Using bundled repo count:', err.message);
    }
  }

  function initStats() {
    const repoPromise = fetchRepoCount();
    const io = new IntersectionObserver(async ([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      await Promise.race([repoPromise, sleep(800)]);
      $$('#stats dd[data-count]').forEach((dd) => countUp(dd, Number(dd.dataset.count)));
    }, { threshold: 0.4 });
    io.observe($('#stats'));
  }

  /* ─────────── Contact links ─────────── */
  function initContact() {
    const links = [
      { label: 'GitHub', meta: `@${PROFILE.github}`, href: `https://github.com/${PROFILE.github}` },
      PROFILE.linkedin && { label: 'LinkedIn', meta: 'Connect', href: PROFILE.linkedin },
      PROFILE.email && { label: 'Email', meta: PROFILE.email, href: `mailto:${PROFILE.email}` },
      { label: 'DocuMind AI', meta: 'Live demo', href: 'https://docu-mind-ai-navy.vercel.app' },
    ].filter(Boolean);
    $('#contactLinks').innerHTML = links.map((l) =>
      `<li><a href="${escapeHtml(l.href)}" ${l.href.startsWith('http') ? 'target="_blank" rel="noopener"' : ''}><span>${escapeHtml(l.label)}</span><span class="mono">${escapeHtml(l.meta)} ↗</span></a></li>`
    ).join('');
  }

  /* ─────────── Scroll reveal + active nav ─────────── */
  function initScrollEffects() {
    const targets = $$('.section-head, .display, .lead, .flag-grid, .pipeline, .caps, .rows, .stats, .toolkit, .contact-title, .contact-links');
    targets.forEach((t) => t.setAttribute('data-anim', ''));
    const reveal = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('in'); reveal.unobserve(e.target); }
    }), { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    targets.forEach((t) => reveal.observe(t));

    const navLinks = $$('.nav a');
    const spy = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (!e.isIntersecting) return;
      navLinks.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === `#${e.target.id}`));
    }), { rootMargin: '-45% 0px -50% 0px' });
    $$('main section[id]').forEach((s) => spy.observe(s));
  }

  /* ─────────── Boot ─────────── */
  $('#year').textContent = String(new Date().getFullYear());
  initDots();
  initMarquee();
  initFlagship();
  initWork();
  initDrawer();
  initKeyboard(initPalette());
  initStats();
  initContact();
  initScrollEffects();
})();
