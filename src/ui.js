(() => {
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  /* Native app (Capacitor) or browser. In the app, progress is also saved with the app's own storage
     (iOS may clear browser storage) and taps use real haptics. */
  const CAP = window.Capacitor, NATIVE = !!(CAP && CAP.isNativePlatform && CAP.isNativePlatform());
  const PLUG = (CAP && CAP.Plugins) || {};
  const store = {
    get(k, d) { try { const v = localStorage.getItem('qt.' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('qt.' + k, JSON.stringify(v)); } catch (e) {} if (NATIVE && PLUG.Preferences) PLUG.Preferences.set({ key: 'qt.' + k, value: JSON.stringify(v) }).catch(() => {}); },
    del(k) { try { localStorage.removeItem('qt.' + k); } catch (e) {} if (NATIVE && PLUG.Preferences) PLUG.Preferences.remove({ key: 'qt.' + k }).catch(() => {}); }
  };
  async function restoreNative() {
    if (!NATIVE || !PLUG.Preferences) return;
    try {
      const { keys } = await PLUG.Preferences.keys();
      for (const key of keys.filter(k => k.startsWith('qt.'))) { const { value } = await PLUG.Preferences.get({ key }); if (value !== null) localStorage.setItem(key, value); }
    } catch (e) { /* fall back to whatever the web view kept */ }
  }
  const buzz = pattern => {
    try {
      if (NATIVE && PLUG.Haptics) { PLUG.Haptics.notification({ type: Array.isArray(pattern) ? 'ERROR' : 'SUCCESS' }); return; }
      navigator.vibrate && navigator.vibrate(pattern);
    } catch (e) {}
  };
  const fmt = n => n.toLocaleString('en-US');
  Engine.load(CHAMPION_DATA);
  if (typeof MATCH_DATA !== 'undefined') Engine.setData(MATCH_DATA);
  const { POS, POS_LABEL } = Engine;
  const ROLE_HINT = { top: 'Side lane, islands', jungle: 'Map control, objectives', mid: 'Center, roams', adc: 'Damage, scaling', support: 'Vision, protection' };
  const ROUND = 5, MAX_POOL = 10;
  const ROLE_ICON = { top: 'M2 14V2H14', jungle: 'M8 1.5L3 9h3l-2 5h8l-2-5h3z', mid: 'M2 14L14 2', adc: 'M2 14H14V2', support: 'M8 1.5l5.5 2v4.5c0 3.2-2.3 5.6-5.5 6.5c-3.2-.9-5.5-3.3-5.5-6.5V3.5z' };
  const icon = (p, size) => `<svg width="${size || 18}" height="${size || 18}" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="${ROLE_ICON[p]}"/></svg>`;
  const initials = n => n.replace(/[^A-Za-z ]/g, '').split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase() || n.slice(0, 2);
  /* Champion icons from Riot's Data Dragon. Falls back to initials if an image can't load
     (offline, blocked, or a champion newer than the cached patch). */
  const DD_SPECIAL = { 'Wukong': 'MonkeyKing', 'Nunu & Willump': 'Nunu', 'Renata Glasc': 'Renata', "Kai'Sa": 'Kaisa', "Kha'Zix": 'Khazix', "Cho'Gath": 'Chogath', "Vel'Koz": 'Velkoz', "Bel'Veth": 'Belveth', 'LeBlanc': 'Leblanc', "Kog'Maw": 'KogMaw', "Rek'Sai": 'RekSai', "K'Sante": 'KSante' };
  const DD = { v: store.get('dd.v', '15.20.1'), ids: store.get('dd.ids', {}) };
  const ddId = n => DD.ids[n] || DD_SPECIAL[n] || n.replace(/[^A-Za-z]/g, '');
  const ICONS = typeof ICON_MAP !== 'undefined' ? ICON_MAP : {};
  const ddImg = n => ICONS[n] ? `champions/${ICONS[n]}` : `https://ddragon.leagueoflegends.com/cdn/${DD.v}/img/champion/${ddId(n)}.png`;
  (async () => {
    if (Object.keys(typeof ICON_MAP !== 'undefined' ? ICON_MAP : {}).length) return;
    try {
      const vs = await (await fetch('https://ddragon.leagueoflegends.com/api/versions.json')).json();
      if (!vs || !vs[0] || vs[0] === store.get('dd.v', null)) return;
      const data = await (await fetch(`https://ddragon.leagueoflegends.com/cdn/${vs[0]}/data/en_US/champion.json`)).json();
      const ids = {}; Object.values(data.data).forEach(c => { ids[c.name] = c.id; });
      DD.v = vs[0]; DD.ids = ids; store.set('dd.v', vs[0]); store.set('dd.ids', ids);
    } catch (e) { /* keep cached version or initials */ }
  })();
  document.addEventListener('error', e => { const t = e.target; if (t && t.tagName === 'IMG' && t.hasAttribute('data-champ')) t.remove(); }, true);
  const badge = (c, extra) => `<span class="badge k-${c.cls}${extra ? ' ' + extra : ''}" aria-hidden="true">${esc(initials(c.name))}<img data-champ src="${ddImg(c.name)}" alt="" loading="lazy" decoding="async"></span>`;
  const tags = c => `${c.cls} · ${Engine.dmgType(c)} · ${c.sty}`;
  const scores = c => `Front ${c.s.fr} · Engage ${c.s.en} · Peel ${c.s.pe} · Dmg ${Math.max(c.s.dp, c.s.bu)} · Clear ${c.s.wc}`;

  /* ---------- state ---------- */
  let role = store.get('role', null);
  const poolOf = r => store.get('pool.' + r, []);
  const levelOf = g => store.get('lvl.' + g, 1);
  let returnTo = 'vHome';

  const VIEWS = ['vRole', 'vPool', 'vHome', 'vSettings', 'vDraft', 'vDecision', 'vResult'];
  function show(v) { VIEWS.forEach(x => $(x).hidden = x !== v); $(v).scrollTop = 0; }
  function toast(msg) { const t = $('toast'); t.textContent = msg; t.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => t.hidden = true, 2200); }
  document.addEventListener('click', e => { if (e.target.closest('[data-home]')) { stopTimer(); goHome(); } });

  /* ---------- role ---------- */
  function renderRoles(el, onPick) {
    el.innerHTML = POS.map(p => `<button class="role" type="button" data-r="${p}" aria-pressed="${p === role}">${icon(p, 22)}<b>${POS_LABEL[p]}</b><span>${ROLE_HINT[p]}</span></button>`).join('');
    el.onclick = e => { const b = e.target.closest('[data-r]'); if (b) onPick(b.dataset.r); };
  }
  function startOnboarding() {
    $('roleStep').hidden = false;
    renderRoles($('roleList'), r => { role = r; store.set('role', r); openPool('vHome', true); });
    show('vRole');
  }

  /* ---------- pool ---------- */
  let poolSel = [], poolAllRoles = false;
  function openPool(back, onboarding) {
    returnTo = back; poolSel = poolOf(role).slice(); poolAllRoles = false;
    $('poolStep').hidden = !onboarding;
    $('poolTitle').textContent = `Your ${POS_LABEL[role]} pool`;
    $('poolSearch').value = '';
    renderPool(); show('vPool');
  }
  function renderPool() {
    const q = $('poolSearch').value.trim().toLowerCase();
    const list = (poolAllRoles ? Engine.all() : Engine.byPos(role)).filter(c => !q || c.name.toLowerCase().includes(q));
    $('poolGrid').innerHTML = list.map(c => `<button class="champ" type="button" data-n="${esc(c.name)}" aria-pressed="${poolSel.includes(c.name)}">${badge(c)}<span>${esc(c.name)}</span></button>`).join('') || '<p class="muted">No champions match.</p>';
    $('poolCount').textContent = `${poolSel.length} / ${MAX_POOL} selected`;
    $('poolAll').textContent = poolAllRoles ? `Only ${POS_LABEL[role]}` : 'Show all champions';
    $('poolSave').disabled = poolSel.length === 0;
  }
  $('poolSearch').addEventListener('input', renderPool);
  $('poolAll').addEventListener('click', () => { poolAllRoles = !poolAllRoles; renderPool(); });
  $('poolGrid').addEventListener('click', e => {
    const b = e.target.closest('[data-n]'); if (!b) return;
    const n = b.dataset.n, i = poolSel.indexOf(n);
    if (i >= 0) poolSel.splice(i, 1);
    else if (poolSel.length >= MAX_POOL) { toast(`Your pool can hold ${MAX_POOL} champions`); return; }
    else poolSel.push(n);
    renderPool();
  });
  $('poolSave').addEventListener('click', () => { store.set('pool.' + role, poolSel); toast('Pool saved'); leavePool(); });
  $('poolSkip').addEventListener('click', () => leavePool());
  function leavePool() { if (returnTo === 'vSettings') openSettings(); else goHome(); }

  /* ---------- home ---------- */
  function goHome() {
    if (!role) return startOnboarding();
    const pool = poolOf(role);
    $('homeRole').innerHTML = `<span class="tag">Main role: <b>${POS_LABEL[role]}</b></span><span class="tag">${pool.length ? pool.length + ' champions in pool' : 'All champions'}</span>`;
    ['Draft', 'Decision'].forEach(g => { const L = levelOf(g.toLowerCase()); $('lv' + g).innerHTML = `<strong>Lv ${L}</strong><span>${Engine.rankOf(L)}</span>`; });
    const saved = savedRound();
    $('resume').hidden = !saved;
    if (saved) $('resumeText').textContent = `${saved.game === 'draft' ? 'Draft' : 'Decision making'} · Lv ${saved.L} · task ${Math.min(saved.i + 1, ROUND)} of ${ROUND}`;
    show('vHome');
  }
  $('toSettings').addEventListener('click', openSettings);
  $('playDraft').addEventListener('click', () => startRound('draft'));
  $('resumeBtn').addEventListener('click', resumeRound);
  $('playDecision').addEventListener('click', () => startRound('decision'));

  /* ---------- settings ---------- */
  function openSettings() {
    renderRoles($('setRoles'), r => { role = r; store.set('role', r); openSettings(); toast(`Main role: ${POS_LABEL[r]}`); });
    const pool = poolOf(role);
    $('setPool').innerHTML = pool.length ? pool.map(n => `<span class="tag">${esc(n)}</span>`).join('') : '<span class="muted">No pool. You train with all champions.</span>';
    $('resetBox').hidden = true;
    const flags = store.get('flags', []);
    $('flagInfo').textContent = flags.length ? `${flags.length} task${flags.length > 1 ? 's' : ''} flagged. Copy them and send them to be reviewed.` : 'No flagged tasks yet. Use "Disagree? Flag this task" after an answer.';
    $('flagCopy').disabled = !flags.length; $('flagText').hidden = true;
    show('vSettings');
  }
  $('editPool').addEventListener('click', () => openPool('vSettings', false));
  $('flagCopy').addEventListener('click', () => {
    const text = JSON.stringify(store.get('flags', []), null, 1);
    const ta = $('flagText'); ta.value = text;
    const fallback = () => { ta.hidden = false; ta.focus(); ta.select(); toast('Select all and copy'); };
    try { navigator.clipboard.writeText(text).then(() => toast('Copied'), fallback); } catch (e) { fallback(); }
  });
  $('resetAsk').addEventListener('click', () => $('resetBox').hidden = false);
  $('resetNo').addEventListener('click', () => $('resetBox').hidden = true);
  $('resetYes').addEventListener('click', () => { ['draft', 'decision'].forEach(g => { store.del('lvl.' + g); store.del('best.' + g); }); $('resetBox').hidden = true; toast('Levels reset'); });

  /* ---------- timer ---------- */
  let tm = null;
  function startTimer(el, secs, onEnd) {
    stopTimer();
    const bar = el.querySelector('i'), t0 = performance.now();
    el.classList.remove('low');
    const tick = now => {
      const left = Math.max(0, secs - (now - t0) / 1000);
      bar.style.transform = `scaleX(${left / secs})`;
      el.classList.toggle('low', left < secs * 0.3);
      tm.left = left;
      if (left <= 0) { stopTimer(); onEnd(); return; }
      tm.raf = requestAnimationFrame(tick);
    };
    tm = { raf: requestAnimationFrame(tick), left: secs, secs };
  }
  function stopTimer() { if (tm) cancelAnimationFrame(tm.raf); }
  const timeLeft = () => tm ? tm.left / tm.secs : 0;

  /* ---------- round ---------- */
  let R = null;
  /* The round in progress is saved after every step, so closing the app or the tab never loses it. */
  const saveRound = () => { if (R) store.set('round', { ...R, at: Date.now() }); };
  const savedRound = () => { const r = store.get('round', null); return r && Date.now() - r.at < 7 * 864e5 ? r : null; };
  function resumeRound() {
    const r = savedRound(); if (!r) return goHome();
    R = r;
    if (R.answered || !R.t) { R.answered = false; return next(); }
    if (R.game === 'draft') showDraft(R.t); else showDecision(R.t);
  }
  function startRound(game) {
    store.del('round');
    const L = levelOf(game), d = Engine.diff(L);
    R = { game, L, d, i: 0, score: 0, marks: [], answered: false,
          secs: game === 'draft' ? Math.round(20 - d * 10) : Math.round(20 - d * 12) };
    next();
  }
  function next() {
    if (R.i >= ROUND) return finish();
    R.answered = false;
    if (R.game === 'draft') showDraft(); else showDecision();
  }
  function scoreFor(ok) { return ok ? Math.round((100 + 100 * timeLeft()) * (1 + 0.1 * (R.L - 1))) : 0; }
  function finish() {
    stopTimer();
    store.del('round');
    const ok = R.marks.filter(Boolean).length;
    const L = R.L, nl = ok >= 4 ? L + 1 : ok <= 1 ? Math.max(1, L - 1) : L;
    store.set('lvl.' + R.game, nl);
    const best = store.get('best.' + R.game, 0); if (R.score > best) store.set('best.' + R.game, R.score);
    $('rGame').textContent = R.game === 'draft' ? 'Draft' : 'Decision making';
    $('rScore').textContent = fmt(R.score);
    const el = $('rLevel');
    el.className = 'lvmsg ' + (nl > L ? 'up' : nl < L ? 'down' : 'same');
    el.textContent = nl > L ? `Level up: ${L} → ${nl}` : nl < L ? `Level down: ${L} → ${nl}` : `Stay on level ${L}`;
    $('rStats').textContent = `${ok} of ${ROUND} right · ${Engine.rankOf(nl)}${R.score > best ? ' · new best' : ''}`;
    $('rDots').innerHTML = R.marks.map(m => `<i class="${m ? 'ok' : ''}"></i>`).join('');
    $('rAgain').textContent = nl > L ? `Play level ${nl}` : 'Play again';
    $('rAgain').onclick = () => startRound(R.game);
    show('vResult');
  }
  function feedback(whyEl, ok, timeout, lines, extra) {
    whyEl.className = 'why ' + (ok ? 'ok' : 'no');
    whyEl.innerHTML = `<h3>${timeout ? 'Time is up' : ok ? (R.game === 'draft' ? 'Right pick' : 'Right call') : (R.game === 'draft' ? 'Not the best pick' : 'Not the best call')}</h3><p class="reasons">${lines.map(esc).join(' ')}</p>${extra ? `<p class="concl">${extra}</p>` : ''}<button class="flag" type="button" data-flag>Disagree? Flag this task</button>`;
    whyEl.hidden = false;
  }
  document.addEventListener('click', e => {
    if (!e.target.closest('[data-flag]')) return;
    const log = store.get('flags', []); log.push({ game: R.game, level: R.L, task: R.task, at: Date.now() });
    store.set('flags', log.slice(-50)); e.target.closest('[data-flag]').textContent = 'Flagged. Thanks!';
  });

  /* ---------- Draft ---------- */
  const stat = (label, mine, theirs, need) => `<div class="stat"><span>${label}</span><div class="vals"><b class="a">${mine}</b><i>vs</i><b class="e">${theirs}</b></div>${need ? `<small>need ${need}</small>` : ''}</div>`;
  function showDraft(saved) {
    const recent = store.get('recentDraft', []);
    const t = saved || Engine.draft(role, R.L, poolOf(role), recent);
    if (!saved) store.set('recentDraft', recent.concat(t.answer).slice(-6));
    R.t = t; R.task = { allies: t.allies.map(x => x.c.name), enemy: t.enemy.map(x => x.c.name), options: t.options.map(o => o.name), answer: t.answer };
    const low = R.L < 7;
    $('dTitle').textContent = `Draft · Lv ${R.L}`;
    $('dCount').textContent = `${R.i + 1}/${ROUND}`;
    $('dLanes').innerHTML = POS.map(p => {
      const a = t.allies.find(x => x.pos === p), e = t.enemy.find(x => x.pos === p), you = p === role;
      const ally = you ? `<span class="badge you" aria-hidden="true">?</span><span class="ln">Your pick</span>`
                       : `${badge(a.c, 'ally')}<span class="ln">${esc(a.c.name)}</span>`;
      return `<div class="lane${you ? ' you' : ''}">${icon(p, 16)}<span class="lr">${POS_LABEL[p]}</span>${ally}<span class="vs">VS</span>${badge(e.c, 'foe')}<span class="ln">${esc(e.c.name)}</span></div>`;
    }).join('');
    const B = t.before;
    $('dMeters').hidden = R.L > 3;
    $('dRead').hidden = R.L > 6 || !t.enemyRead.length;
    $('dRead').innerHTML = `<span class="label">Enemy read</span>` + t.enemyRead.map(x => `<span class="t">${esc(x)}</span>`).join('');
    const F = t.enemyStats;
    $('dMeters').innerHTML = `<div class="legend"><span class="a">■ Your team (4 of 5)</span><span class="e">■ Enemy (5)</span><span>Champions scoring 4+ of 5</span></div>` + stat('Front', B.nFr, F.nFr, 2) + stat('Engage', B.nEn, F.nEn, 2) + stat('Peel', B.nPe, F.nPe) + stat('Magic', `${Math.round(B.apShare * 100)}%`, `${Math.round(F.apShare * 100)}%`, '20-80%');
    $('dQ').textContent = t.fromPool ? `> Select ${POS_LABEL[role]} from your pool` : `> Select the best ${POS_LABEL[role]}`;
    $('dOpts').innerHTML = t.options.map((o, i) => `<button class="opt" type="button" data-i="${i}">${badge(o.c)}<span class="nm"><b>${esc(o.name)}</b>${low ? `<i>${esc(tags(o.c))}</i><i class="sc">${esc(scores(o.c))}</i>` : ''}</span></button>`).join('');
    $('dWhy').hidden = true; $('dNext').hidden = true;
    show('vDraft');
    saveRound();
    startTimer($('dTimer'), R.secs, () => answerDraft(-1));
  }
  $('dOpts').addEventListener('click', e => { const b = e.target.closest('[data-i]'); if (b) answerDraft(+b.dataset.i); });
  function answerDraft(i) {
    if (R.answered) return; R.answered = true; stopTimer();
    const t = R.t, ok = i >= 0 && t.options[i].name === t.answer;
    R.score += scoreFor(ok); R.marks.push(ok); buzz(ok ? 25 : [30, 40, 30]);
    [...$('dOpts').children].forEach((b, k) => { b.disabled = true; if (t.options[k].name === t.answer) b.classList.add('right'); else if (k === i) b.classList.add('wrong'); });
    const best = t.options.find(o => o.name === t.answer);
    const extra = `So <b>${esc(t.answer)}</b> (${esc(tags(best.c))}) is probably the best pick for this draft.`;
    feedback($('dWhy'), ok, i < 0, t.why.length ? t.why.map(w => w.text) : ['It scores highest on the team as a whole.'], extra);
    R.i++; saveRound(); $('dNext').textContent = R.i >= ROUND ? 'See result' : 'Next'; $('dNext').hidden = false;
    $('dWhy').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
  $('dNext').addEventListener('click', next);

  /* ---------- Decision ---------- */
  const LANE_TEXT = { pushing: 'Crashing into their tower', middle: 'In the middle of the lane', crashing: 'Big wave about to hit your tower' };
  const PRIO_TEXT = { ours: 'Your lanes have priority', theirs: 'Enemy lanes have priority', even: 'Even' };
  function mapSvg(s) {
    const dragon = s.obj === 'Dragon', ox = dragon ? 134 : 66, oy = dragon ? 134 : 66;
    const allySpots = dragon ? [[112, 138], [100, 150], [118, 118], [90, 132], [104, 120]] : [[88, 80], [100, 92], [78, 96], [110, 74], [94, 106]];
    const enemySpots = dragon ? [[156, 112], [170, 126], [160, 92], [178, 104], [146, 96]] : [[44, 30], [30, 52], [62, 22], [24, 76], [40, 92]];
    let g = '';
    for (let i = 0; i < s.ally; i++) g += `<circle cx="${allySpots[i][0]}" cy="${allySpots[i][1]}" r="6.5" fill="var(--cyan)"${i === 0 ? ' stroke="var(--ink)" stroke-width="2"' : ''}/>`;
    for (let i = 0; i < s.enemy; i++) g += `<circle cx="${enemySpots[i][0]}" cy="${enemySpots[i][1]}" r="6.5" fill="var(--red)"/>`;
    const x = (cx, cy, c) => `<path d="M${cx - 4} ${cy - 4}l8 8M${cx + 4} ${cy - 4}l-8 8" stroke="${c}" stroke-width="2.5" stroke-linecap="round"/>`;
    for (let i = 0; i < 5 - s.ally; i++) g += x(22 + i * 11, 160, 'var(--cyan)');
    for (let i = 0; i < 5 - s.enemy; i++) g += x(178 - i * 11, 40, 'var(--red)');
    const obj = s.objUp
      ? `<circle cx="${ox}" cy="${oy}" r="12" fill="var(--cyan-bg)" stroke="var(--amber)" stroke-width="2.5"/>`
      : `<circle cx="${ox}" cy="${oy}" r="12" fill="none" stroke="var(--muted)" stroke-width="2" stroke-dasharray="4 3"/>`;
    return `<svg viewBox="0 0 200 200" role="img" aria-label="Map: ${s.ally} allies and ${s.enemy} enemies alive, ${s.obj} ${s.objUp ? 'is up' : 'spawns in ' + s.spawnIn + ' seconds'}">
      <rect width="200" height="200" fill="var(--map)"/><path d="M0 0L200 200" stroke="var(--river)" stroke-width="20"/>
      <path d="M16 184V16H184M16 184L184 16M16 184H184V16" fill="none" stroke="var(--lane)" stroke-width="7" stroke-linejoin="round"/>
      <rect x="4" y="172" width="24" height="24" rx="5" fill="var(--cyan)" opacity=".3"/><rect x="172" y="4" width="24" height="24" rx="5" fill="var(--red)" opacity=".3"/>
      ${obj}<text x="${ox}" y="${dragon ? oy + 30 : oy - 20}" text-anchor="middle" font-size="11" font-weight="700" fill="var(--amber)" font-family="Chakra Petch, sans-serif">${s.obj}</text>${g}</svg>`;
  }
  function showDecision(saved) {
    const recentC = store.get('recentDecision', []);
    const t = saved || Engine.decision(R.L, role, recentC, poolOf(role));
    if (!saved) store.set('recentDecision', recentC.concat(t.answer).slice(-4));
    R.t = t; R.task = { state: t.state, options: t.options.map(o => o.id), answer: t.answer };
    const s = t.state;
    $('cTitle').textContent = `Decision making · Lv ${R.L}`;
    $('cCount').textContent = `${R.i + 1}/${ROUND}`;
    $('cMap').innerHTML = mapSvg(s);
    const gold = s.goldDiff === 0 ? 'Even' : `Your team ${s.goldDiff > 0 ? '+' : '−'}${fmt(Math.abs(s.goldDiff))}`;
    const facts = [
      ['Game time', `<span class="clock">${s.clock}</span>`],
      ['Alive', `You ${s.ally} · Enemy ${s.enemy}${s.respawn ? ` (respawns in ${s.respawn} s)` : ''}`],
      [s.obj, s.objUp ? 'Up now' : `Spawns in ${s.spawnIn} s`],
      ['Lanes near the pit', PRIO_TEXT[s.prio]],
      ['Your wave', LANE_TEXT[s.wave]],
      ['Gold', `${gold}${s.itemGold ? ' · you can buy an item' : ''}`]
    ];
    if (s.jg) facts.push(['Enemy jungler', `Seen ${s.jg.side === 'far' ? 'on the far side' : 'nearby'} ${s.jg.ago} s ago`]);
    $('cFacts').innerHTML = facts.map(f => `<li><span>${esc(f[0])}</span>${f[1]}</li>`).join('');
    const who = (x, me, side) => `<div class="who ${side}${x.alive ? '' : ' dead'}${me ? ' me' : ''}" title="${esc(x.c.name)}">${badge(x.c)}<i>${me ? 'You' : esc(POS_LABEL[x.pos])}</i></div>`;
    $('cTeams').innerHTML = `<span class="side a">Ally</span>` + s.allies.map(x => who(x, x.pos === role, 'ally')).join('') +
      `<span class="side e">Enemy</span>` + s.enemies.map(x => who(x, false, 'foe')).join('') +
      `<div class="youline" style="grid-column:1 / -1">You are <b>${esc(s.you.name)}</b> · ${esc(POS_LABEL[role])} · ${esc(Engine.styleWord(s.you))}. Crossed out = dead.</div>`;
    $('cOpts').innerHTML = t.options.map((o, i) => `<button class="opt" type="button" data-i="${i}"><span class="nm"><b>${esc(o.text)}</b></span></button>`).join('');
    $('cWhy').hidden = true; $('cNext').hidden = true;
    show('vDecision');
    saveRound();
    startTimer($('cTimer'), R.secs, () => answerDecision(-1));
  }
  $('cOpts').addEventListener('click', e => { const b = e.target.closest('[data-i]'); if (b) answerDecision(+b.dataset.i); });
  function answerDecision(i) {
    if (R.answered) return; R.answered = true; stopTimer();
    const t = R.t, ok = i >= 0 && t.options[i].id === t.answer;
    R.score += scoreFor(ok); R.marks.push(ok); buzz(ok ? 25 : [30, 40, 30]);
    [...$('cOpts').children].forEach((b, k) => { b.disabled = true; if (t.options[k].id === t.answer) b.classList.add('right'); else if (k === i) b.classList.add('wrong'); });
    const best = t.options.find(o => o.id === t.answer);
    feedback($('cWhy'), ok, i < 0, t.why, esc(t.conclusion));
    R.i++; saveRound(); $('cNext').textContent = R.i >= ROUND ? 'See result' : 'Next'; $('cNext').hidden = false;
    $('cWhy').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
  $('cNext').addEventListener('click', next);

  /* Web: keep the app on the device so it opens instantly and works offline (not needed in the native app). */
  if (!NATIVE && 'serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
  restoreNative().then(goHome);
})();
