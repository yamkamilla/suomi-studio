/* Железо: трекер тренировок. Vanilla JS, без сборки.
   Хранение: localStorage всегда; если страница открыта как артефакт claude.ai, данные ещё и
   синхронизируются в его базу (capability db) и доступны с других устройств. */
(function () {
  'use strict';

  // ---------- утилиты ----------
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const pad = (n) => String(n).padStart(2, '0');
  const now = () => Date.now();
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const num = (v) => { const n = parseFloat(String(v).replace(',', '.')); return isFinite(n) ? n : null; };
  const fmtKg = (v) => (v == null ? '' : (Math.round(v * 10) / 10).toLocaleString('ru-RU'));
  const fmtInt = (v) => Math.round(v || 0).toLocaleString('ru-RU');
  const fmtTon = (v) => (v >= 1000 ? (Math.round(v / 100) / 10).toLocaleString('ru-RU') + ' т' : fmtInt(v) + ' кг');
  const fmtDur = (ms) => { const s = Math.max(0, Math.floor(ms / 1000)); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), ss = s % 60; return h ? `${h}:${pad(m)}:${pad(ss)}` : `${m}:${pad(ss)}`; };
  const fmtMin = (ms) => { const m = Math.round(ms / 60000); return m >= 60 ? `${Math.floor(m / 60)} ч ${m % 60} мин` : `${m} мин`; };
  const dayKey = (d) => { d = d instanceof Date ? d : new Date(d); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
  const todayKey = () => dayKey(new Date());
  const fromDayKey = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
  const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  const MONTHS_N = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
  const WD = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  const fmtDate = (ts) => { const d = new Date(ts); const t = new Date(); const k = dayKey(d); if (k === todayKey()) return 'Сегодня'; t.setDate(t.getDate() - 1); if (k === dayKey(t)) return 'Вчера'; return `${d.getDate()} ${MONTHS[d.getMonth()]}${d.getFullYear() !== new Date().getFullYear() ? ' ' + d.getFullYear() : ''}`; };
  const fmtTime = (ts) => { const d = new Date(ts); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
  const mondayOf = (d) => { d = new Date(d); d.setHours(0, 0, 0, 0); const wd = (d.getDay() + 6) % 7; d.setDate(d.getDate() - wd); return d; };
  const plural = (n, a, b, c) => { const m10 = n % 10, m100 = n % 100; if (m10 === 1 && m100 !== 11) return a; if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return b; return c; };
  const e1rm = (kg, reps) => (kg > 0 && reps > 0 ? kg * (1 + Math.min(reps, 30) / 30) : 0);
  const FEEL = ['😩', '😕', '😐', '🙂', '🔥'];
  const FEEL_T = ['ужасно', 'так себе', 'нормально', 'хорошо', 'отлично'];

  const ICON = {
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.2 4.2L19 7"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    more: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>',
    up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 15l6-6 6 6"/></svg>',
    down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>',
    left: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg>',
    right: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 5v14l12-7z"/></svg>',
    timer: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2M9 2h6"/></svg>',
    medal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="14" r="6"/><path d="M8.5 9L6 2h4l2 5 2-5h4l-2.5 7"/></svg>',
  };

  // ---------- хранилище ----------
  const LS_KEY = 'gym.state.v1';
  const LS_ACTIVE = 'gym.active.v1';
  const lsGet = (k) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch (e) { return null; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* нет места или приватный режим */ } };

  const defaultState = () => ({
    version: 1,
    settings: { name: '', club: '', defaultRest: 90, sound: true, vibrate: true, theme: 'auto', bodyweight: null },
    exercises: [],
    exMeta: {},
    templates: [],
    workouts: [],
    checkins: {},
    deleted: {},
    touched: { settings: 0, exercises: 0, exMeta: 0, templates: 0, checkins: 0 },
  });

  let state = Object.assign(defaultState(), lsGet(LS_KEY) || {});
  state.touched = Object.assign({ settings: 0, exercises: 0, exMeta: 0, templates: 0, checkins: 0 }, state.touched || {});
  let active = lsGet(LS_ACTIVE); // текущая тренировка
  let ui = { tab: 'today', histMonth: dayKey(new Date()).slice(0, 7), progEx: null, exQuery: '', exGroup: '', exEq: '', confirm: null };

  const sync = { db: null, uid: null, status: 'local', dirtyMain: false, dirtyW: new Set(), delW: new Set(), timer: null, unsub: [] };

  function saveState(section) {
    if (section) { state.touched[section] = now(); sync.dirtyMain = true; }
    lsSet(LS_KEY, state);
    scheduleFlush();
  }
  function saveActive() { lsSet(LS_ACTIVE, active); updateLiveDot(); }
  function touchWorkout(w) { w.updatedAt = now(); sync.dirtyW.add(w.id); lsSet(LS_KEY, state); scheduleFlush(); }

  // ---------- упражнения ----------
  const allExercises = () => window.GYM_EXERCISES.concat(state.exercises);
  const exById = (id) => allExercises().find((e) => e.id === id) || { id, name: id, en: '', group: 'Всё тело', eq: 'Тренажёр', kind: 'weight', rest: 90 };
  const exMeta = (id) => state.exMeta[id] || {};
  const exRest = (id) => { const m = exMeta(id); return m.rest != null ? m.rest : (exById(id).rest != null ? exById(id).rest : state.settings.defaultRest); };

  // ---------- вычисления ----------
  function setValue(set, kind) {
    if (kind === 'weight') return { kg: set.kg || 0, reps: set.reps || 0 };
    return set;
  }
  function workoutVolume(w) { let v = 0; for (const e of w.exercises) { const k = exById(e.ex).kind; for (const s of e.sets) if (s.done && (k === 'weight' || k === 'body') && s.kg && s.reps) v += s.kg * s.reps; } return v; }
  function workoutSets(w) { let n = 0; for (const e of w.exercises) for (const s of e.sets) if (s.done && s.type !== 'W') n++; return n; }
  function workoutDuration(w) { return (w.end || now()) - (w.start || w.date); }
  function sortedWorkouts() { return state.workouts.slice().sort((a, b) => b.date - a.date); }

  // лучшие результаты по упражнению до указанной даты (исключая тренировку excludeId)
  function bestBefore(exId, excludeId, beforeTs) {
    const best = { kg: 0, e1rm: 0, reps: 0, sec: 0, km: 0 };
    for (const w of state.workouts) {
      if (w.id === excludeId) continue;
      if (beforeTs && w.date > beforeTs) continue;
      for (const e of w.exercises) {
        if (e.ex !== exId) continue;
        for (const s of e.sets) {
          if (!s.done || s.type === 'W') continue;
          if (s.kg > best.kg) best.kg = s.kg;
          const r = e1rm(s.kg, s.reps); if (r > best.e1rm) best.e1rm = r;
          if ((s.reps || 0) > best.reps) best.reps = s.reps;
          if ((s.sec || 0) > best.sec) best.sec = s.sec;
          if ((s.km || 0) > best.km) best.km = s.km;
        }
      }
    }
    return best;
  }
  function detectPR(exId, set, excludeId, current) {
    const kind = exById(exId).kind;
    const b = bestBefore(exId, excludeId);
    // уже сделанные подходы этой же тренировки тоже считаются базой
    for (const s of current || []) {
      if (s === set || !s.done || s.type === 'W') continue;
      b.kg = Math.max(b.kg, s.kg || 0); b.e1rm = Math.max(b.e1rm, e1rm(s.kg, s.reps)); b.reps = Math.max(b.reps, s.reps || 0); b.sec = Math.max(b.sec, s.sec || 0); b.km = Math.max(b.km, s.km || 0);
    }
    if (kind === 'weight') {
      if (set.kg > 0 && set.reps > 0 && b.kg > 0) {
        if (set.kg > b.kg) return { type: 'kg', text: `${fmtKg(set.kg)} кг, новый максимальный вес` };
        const r = e1rm(set.kg, set.reps); if (r > b.e1rm) return { type: '1rm', text: `расчётный 1ПМ ${fmtKg(r)} кг` };
      }
      return null;
    }
    if (kind === 'body') { if (set.reps > b.reps && b.reps > 0) return { type: 'reps', text: `${set.reps} повторений` }; return null; }
    if (kind === 'time') { if (set.sec > b.sec && b.sec > 0) return { type: 'sec', text: `${fmtDur(set.sec * 1000)} — дольше, чем когда-либо` }; return null; }
    if (kind === 'cardio') { if (set.km > b.km && b.km > 0) return { type: 'km', text: `${set.km} км — самая длинная дистанция` }; return null; }
    return null;
  }
  // последняя тренировка с упражнением
  function lastSetsFor(exId, excludeId) {
    const ws = sortedWorkouts();
    for (const w of ws) { if (w.id === excludeId) continue; const e = w.exercises.find((x) => x.ex === exId); if (e && e.sets.some((s) => s.done)) return { date: w.date, sets: e.sets.filter((s) => s.done) }; }
    return null;
  }
  function prevLabel(set, kind) {
    if (!set) return '—';
    if (kind === 'weight') return `${fmtKg(set.kg)}×${set.reps || 0}${set.rpe ? ' @' + set.rpe : ''}`;
    if (kind === 'body') return `${set.reps || 0}${set.kg ? ' +' + fmtKg(set.kg) : ''}`;
    if (kind === 'time') return fmtDur((set.sec || 0) * 1000) + (set.kg ? ' ' + fmtKg(set.kg) + ' кг' : '');
    if (kind === 'cardio') return `${set.sec ? Math.round(set.sec / 60) + ' мин' : ''}${set.km ? ' ' + set.km + ' км' : ''}`.trim() || '—';
    return '—';
  }
  function setLabel(s, kind) { return prevLabel(s, kind); }

  function weekStats(offsetWeeks) {
    const start = mondayOf(new Date()); start.setDate(start.getDate() - 7 * (offsetWeeks || 0));
    const end = new Date(start); end.setDate(end.getDate() + 7);
    const ws = state.workouts.filter((w) => w.date >= start.getTime() && w.date < end.getTime());
    return { start, count: ws.length, volume: ws.reduce((a, w) => a + workoutVolume(w), 0), sets: ws.reduce((a, w) => a + workoutSets(w), 0), minutes: ws.reduce((a, w) => a + workoutDuration(w), 0) / 60000 };
  }
  function streakWeeks() {
    let n = 0; for (let i = 0; i < 520; i++) { const s = weekStats(i); if (s.count > 0) n++; else if (i === 0) continue; else break; } return n;
  }
  function totalPRs() { let n = 0; for (const w of state.workouts) for (const e of w.exercises) for (const s of e.sets) if (s.pr) n++; return n; }

  // ---------- рендер ----------
  const screen = $('#screen');
  function render() {
    $$('.tab').forEach((t) => t.classList.toggle('on', t.dataset.tab === ui.tab));
    let html = '';
    if (ui.tab === 'today') html = active ? renderLive() : renderToday();
    else if (ui.tab === 'history') html = renderHistory();
    else if (ui.tab === 'progress') html = renderProgress();
    else if (ui.tab === 'exercises') html = renderExercises();
    else html = renderMore();
    screen.innerHTML = `<div class="screen">${html}</div>`;
    afterRender();
  }
  function afterRender() {
    if (ui.tab === 'progress') { drawCharts(); }
    if (ui.tab === 'exercises') { const q = $('#exSearch'); if (q && ui.exFocus) { q.focus(); const v = q.value; q.setSelectionRange(v.length, v.length); ui.exFocus = false; } }
  }
  function updateLiveDot() { $('#liveDot').hidden = !active; }

  // ----- Сегодня -----
  function renderToday() {
    const wk = weekStats(0);
    const ci = state.checkins[todayKey()];
    const last = sortedWorkouts()[0];
    const streak = streakWeeks();
    const templates = state.templates.concat(window.GYM_PRESETS.filter((p) => !state.templates.some((t) => t.id === p.id)));
    const d = new Date();
    return `
      <h1 class="screen-title">${WD[(d.getDay() + 6) % 7]}, ${d.getDate()} ${MONTHS[d.getMonth()]}</h1>
      <div class="screen-sub">${state.settings.name ? 'Привет, ' + esc(state.settings.name) + '. ' : ''}${wk.count ? `На этой неделе ${wk.count} ${plural(wk.count, 'тренировка', 'тренировки', 'тренировок')}, ${fmtTon(wk.volume)}.` : 'На этой неделе пока без тренировок.'}</div>

      <div class="tiles">
        <div class="tile"><div class="v num">${wk.count}</div><div class="l">тренировок за неделю</div></div>
        <div class="tile"><div class="v num">${fmtTon(wk.volume)}</div><div class="l">тоннаж недели</div></div>
        <div class="tile"><div class="v num">${streak}<small>нед</small></div><div class="l">серия без пропусков</div></div>
      </div>

      <div class="section-label">Тренировка</div>
      <div class="stack">
        <button class="btn primary block" data-action="start-empty" type="button">${ICON.play} Начать тренировку</button>
        <div class="grid2">
          <button class="btn" data-action="repeat-last" type="button" ${last ? '' : 'disabled'}>Повторить последнюю</button>
          <button class="btn" data-action="log-class" type="button">Групповое занятие</button>
        </div>
      </div>

      <div class="section-label">Самочувствие сегодня</div>
      ${ci ? `
        <button class="item clickable" data-action="checkin" type="button">
          <div class="grow">
            <div class="t">${FEEL[(ci.mood || 3) - 1]} ${FEEL_T[(ci.mood || 3) - 1]} · энергия ${ci.energy || '–'}/5</div>
            <div class="s">${ci.sleep ? 'сон ' + ci.sleep + ' ч · ' : ''}${ci.soreness ? 'крепатура ' + ci.soreness + '/5 · ' : ''}${ci.bodyweight ? 'вес ' + fmtKg(ci.bodyweight) + ' кг' : ''}${ci.note ? ' · ' + esc(ci.note) : ''}</div>
          </div><span class="muted">${ICON.right}</span>
        </button>` : `
        <button class="item clickable" data-action="checkin" type="button">
          <div class="grow"><div class="t">Как ты сегодня?</div><div class="s">Сон, энергия, настроение, вес. Полминуты, зато потом видно, от чего зависят твои результаты.</div></div><span class="muted">${ICON.right}</span>
        </button>`}

      <div class="row between" style="margin-top:20px"><div class="section-label" style="margin:0">Программы</div><button class="btn sm ghost" data-action="new-template" type="button">${ICON.plus} Новая</button></div>
      <div class="list" style="margin-top:8px">
        ${templates.map((t) => `
          <div class="item">
            <button class="grow" data-action="start-template" data-id="${esc(t.id)}" type="button" style="border:none;background:transparent;text-align:left;padding:0;color:inherit">
              <div class="t">${esc(t.name)}</div>
              <div class="s">${t.items.length} ${plural(t.items.length, 'упражнение', 'упражнения', 'упражнений')} · ${t.items.map((i) => exById(i.ex).name).slice(0, 3).join(', ')}${t.items.length > 3 ? '…' : ''}${t.note ? ' · ' + esc(t.note) : ''}</div>
            </button>
            <button class="btn icon sm ghost" data-action="template-menu" data-id="${esc(t.id)}" type="button" aria-label="Меню программы">${ICON.more}</button>
          </div>`).join('')}
      </div>

      ${last ? `<div class="section-label">Последняя тренировка</div>${workoutItem(last)}` : ''}
    `;
  }
  function workoutItem(w) {
    const vol = workoutVolume(w); const prs = w.exercises.reduce((a, e) => a + e.sets.filter((s) => s.pr).length, 0);
    return `<button class="item clickable" data-action="open-workout" data-id="${esc(w.id)}" type="button">
      <div class="grow">
        <div class="t">${esc(w.name || 'Тренировка')} ${prs ? `<span class="pr-mark" title="Рекорды">★${prs}</span>` : ''}</div>
        <div class="s">${fmtDate(w.date)} · ${fmtMin(workoutDuration(w))} · ${workoutSets(w)} подх.${vol ? ' · ' + fmtTon(vol) : ''}${w.club ? ' · ' + esc(w.club) : ''}</div>
        <div class="s ellipsis">${w.exercises.map((e) => exById(e.ex).name).join(', ')}</div>
      </div>
      <div class="right">${w.feel ? `<span style="font-size:20px">${FEEL[w.feel - 1]}</span>` : ''}</div>
    </button>`;
  }

  // ----- Живая тренировка -----
  function renderLive() {
    const w = active;
    return `
      <div class="live-head">
        <div class="grow">
          <input class="live-name" id="liveName" value="${esc(w.name)}" placeholder="Название тренировки" aria-label="Название тренировки">
          <div class="small muted" style="margin-top:4px">${w.editingId ? 'Редактирование · ' + fmtDate(w.date) : 'Начало ' + fmtTime(w.start)} · ${workoutSets(w)} подх. · ${fmtTon(workoutVolume(w))}</div>
        </div>
        <div class="timer num" id="liveTimer">${w.editingId ? '' : fmtDur(now() - w.start)}</div>
      </div>
      <div class="stack">
        ${w.exercises.map((e, i) => exerciseCard(e, i)).join('')}
        <button class="btn block" data-action="add-exercise" type="button">${ICON.plus} Добавить упражнение</button>
        <div class="grid2" style="margin-top:6px">
          <button class="btn danger" data-action="discard" type="button">Отменить</button>
          <button class="btn good" data-action="finish" type="button">${ICON.check} Завершить</button>
        </div>
      </div>`;
  }
  function exerciseCard(e, i) {
    const ex = exById(e.ex); const kind = ex.kind; const last = lastSetsFor(e.ex, active.editingId || active.id);
    const meta = exMeta(e.ex);
    const head = kind === 'cardio' ? '<span>#</span><span>было</span><span>мин</span><span>км</span><span></span>'
      : kind === 'time' ? '<span>#</span><span>было</span><span>сек</span><span>кг</span><span></span>'
        : `<span>#</span><span>было</span><span>${kind === 'body' ? '+кг' : 'кг'}</span><span>повт</span><span>RPE</span><span></span>`;
    return `<div class="ex-card" data-ei="${i}">
      <div class="ex-head">
        <div class="grow">
          <div class="ex-name">${esc(ex.name)}</div>
          <div class="ex-meta"><span class="badge">${esc(ex.eq)}</span><span>${esc(ex.group)}</span>${last ? `<span>· было ${fmtDate(last.date).toLowerCase()}</span>` : '<span>· первый раз</span>'}<span>· отдых ${exRest(e.ex)} с</span></div>
        </div>
        <button class="btn icon sm ghost" data-action="ex-menu" data-ei="${i}" type="button" aria-label="Меню упражнения">${ICON.more}</button>
      </div>
      <input class="machine" data-field="machine" data-ei="${i}" value="${esc(e.machine != null ? e.machine : (meta.machine || ''))}" placeholder="${ex.eq === 'Тренажёр' || ex.eq === 'Блок' ? 'Настройки тренажёра: сиденье 4, упор 3, рукоять узкая…' : 'Оборудование: гриф 20 кг, скамья 30°, коврик…'}" aria-label="Настройки оборудования">
      <div class="sets">
        <div class="set-head ${kind}">${head}</div>
        ${e.sets.map((s, j) => setRow(e, s, i, j, kind, last)).join('')}
      </div>
      <div class="set-actions">
        <button class="btn sm grow" data-action="add-set" data-ei="${i}" type="button">${ICON.plus} Подход</button>
        <button class="btn sm ghost" data-action="start-rest" data-ei="${i}" type="button">${ICON.timer} Отдых</button>
      </div>
    </div>`;
  }
  function setRow(e, s, i, j, kind, last) {
    const prev = last ? (last.sets[j] || last.sets[last.sets.length - 1]) : null;
    const ph = prev || {};
    const cls = `set-row ${kind} ${s.done ? 'done' : ''} ${s.pr ? 'pr' : ''}`;
    const nLabel = s.type === 'W' ? 'Р' : s.type === 'D' ? 'Д' : s.type === 'F' ? 'О' : String(e.sets.slice(0, j + 1).filter((x) => x.type !== 'W').length);
    const inp = (f, val, phv, step, mode) => `<input type="text" inputmode="${mode || 'decimal'}" data-field="${f}" data-ei="${i}" data-si="${j}" value="${val == null ? '' : esc(val)}" placeholder="${phv == null || phv === 0 ? '' : esc(phv)}" aria-label="${f}">`;
    let fields = '';
    if (kind === 'cardio') fields = inp('min', s.sec ? Math.round(s.sec / 60) : null, ph.sec ? Math.round(ph.sec / 60) : null, 1, 'numeric') + inp('km', s.km, ph.km);
    else if (kind === 'time') fields = inp('sec', s.sec, ph.sec, 1, 'numeric') + inp('kg', s.kg, ph.kg);
    else fields = inp('kg', s.kg, ph.kg) + inp('reps', s.reps, ph.reps, 1, 'numeric') + inp('rpe', s.rpe, ph.rpe);
    return `<div class="${cls}">
      <button class="n ${s.type || ''}" data-action="cycle-type" data-ei="${i}" data-si="${j}" type="button" title="Тип подхода: обычный, разминка, дроп, отказ">${nLabel}</button>
      <div class="prev">${prev ? prevLabel(prev, kind) : '—'}</div>
      ${fields}
      <button class="ok" data-action="toggle-done" data-ei="${i}" data-si="${j}" type="button" aria-label="Подход выполнен">${ICON.check}</button>
    </div>`;
  }

  // ----- История -----
  function renderHistory() {
    const [y, m] = ui.histMonth.split('-').map(Number);
    const first = new Date(y, m - 1, 1);
    const daysIn = new Date(y, m, 0).getDate();
    const byDay = {};
    for (const w of state.workouts) { const k = dayKey(w.date); (byDay[k] = byDay[k] || []).push(w); }
    const monthWs = sortedWorkouts().filter((w) => dayKey(w.date).startsWith(ui.histMonth));
    const vols = monthWs.map(workoutVolume).filter((v) => v > 0).sort((a, b) => a - b);
    const q = (p) => (vols.length ? vols[Math.min(vols.length - 1, Math.floor(vols.length * p))] : 0);
    const level = (ws) => { if (!ws) return 0; const v = ws.reduce((a, w) => a + workoutVolume(w), 0); if (!vols.length || v === 0) return 2; if (v <= q(0.25)) return 1; if (v <= q(0.5)) return 2; if (v <= q(0.75)) return 3; return 4; };
    const lead = (first.getDay() + 6) % 7;
    let cells = WD.map((d) => `<div class="d wd">${d}</div>`).join('');
    for (let i = 0; i < lead; i++) cells += '<div class="d out"></div>';
    for (let d = 1; d <= daysIn; d++) {
      const k = `${ui.histMonth}-${pad(d)}`; const ws = byDay[k]; const lv = level(ws);
      const ci = state.checkins[k];
      cells += ws ? `<button class="d h${lv} ${k === todayKey() ? 'today' : ''}" data-action="open-workout" data-id="${esc(ws[0].id)}" type="button" title="${ws.map((w) => w.name).join(', ')}">${d}</button>`
        : `<div class="d ${k === todayKey() ? 'today' : ''}" title="${ci ? 'Чек-ин без тренировки' : ''}">${d}${ci ? '<span style="position:absolute"></span>' : ''}</div>`;
    }
    const total = state.workouts.length;
    const monthVol = monthWs.reduce((a, w) => a + workoutVolume(w), 0);
    const monthMin = monthWs.reduce((a, w) => a + workoutDuration(w), 0) / 60000;
    const groups = {};
    for (const w of monthWs) { const k = dayKey(w.date); (groups[k] = groups[k] || []).push(w); }
    return `
      <h1 class="screen-title">История</h1>
      <div class="screen-sub">${total} ${plural(total, 'тренировка', 'тренировки', 'тренировок')} всего</div>
      <div class="card">
        <div class="row between" style="margin-bottom:12px">
          <button class="btn icon sm" data-action="hist-prev" type="button" aria-label="Предыдущий месяц">${ICON.left}</button>
          <div class="bold">${MONTHS_N[m - 1]} ${y}</div>
          <button class="btn icon sm" data-action="hist-next" type="button" aria-label="Следующий месяц">${ICON.right}</button>
        </div>
        <div class="heat">${cells}</div>
        <div class="row between small muted" style="margin-top:12px"><span>${monthWs.length} ${plural(monthWs.length, 'тренировка', 'тренировки', 'тренировок')}</span><span>${fmtTon(monthVol)}</span><span>${Math.round(monthMin)} мин</span></div>
      </div>
      <div class="list" style="margin-top:12px">
        ${monthWs.length ? monthWs.map(workoutItem).join('') : `<div class="empty"><div class="big">🗓</div>В этом месяце тренировок нет</div>`}
      </div>`;
  }

  // ----- Прогресс -----
  function exerciseHistory(exId) {
    const out = [];
    for (const w of sortedWorkouts().reverse()) {
      for (const e of w.exercises) {
        if (e.ex !== exId) continue;
        const done = e.sets.filter((s) => s.done && s.type !== 'W'); if (!done.length) continue;
        const kind = exById(exId).kind;
        const top = done.reduce((a, s) => (e1rm(s.kg, s.reps) > e1rm(a.kg, a.reps) ? s : a), done[0]);
        out.push({ date: w.date, wid: w.id, sets: done, maxKg: Math.max(...done.map((s) => s.kg || 0)), e1rm: Math.max(...done.map((s) => e1rm(s.kg, s.reps))), vol: done.reduce((a, s) => a + (s.kg || 0) * (s.reps || 0), 0), reps: Math.max(...done.map((s) => s.reps || 0)), sec: Math.max(...done.map((s) => s.sec || 0)), km: Math.max(...done.map((s) => s.km || 0)), top, kind });
      }
    }
    return out;
  }
  function exercisesDone() {
    const cnt = {}; for (const w of state.workouts) for (const e of w.exercises) if (e.sets.some((s) => s.done)) cnt[e.ex] = (cnt[e.ex] || 0) + 1;
    return Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a]);
  }
  function renderProgress() {
    const wk = weekStats(0), prevWk = weekStats(1);
    const done = exercisesDone();
    if (!ui.progEx || !done.includes(ui.progEx)) ui.progEx = done[0] || null;
    const hist = ui.progEx ? exerciseHistory(ui.progEx) : [];
    const kind = ui.progEx ? exById(ui.progEx).kind : 'weight';
    const bw = Object.keys(state.checkins).sort().filter((k) => state.checkins[k].bodyweight).map((k) => ({ k, v: state.checkins[k].bodyweight }));
    const sleep = Object.keys(state.checkins).sort().slice(-30).filter((k) => state.checkins[k].sleep || state.checkins[k].energy);
    const diff = prevWk.volume ? Math.round((wk.volume - prevWk.volume) / prevWk.volume * 100) : null;
    const best = ui.progEx ? bestBefore(ui.progEx) : null;
    return `
      <h1 class="screen-title">Прогресс</h1>
      <div class="screen-sub">Тоннаж, расчётный 1ПМ (формула Эпли), рекорды и самочувствие.</div>
      <div class="tiles">
        <div class="tile"><div class="v num">${fmtTon(wk.volume)}</div><div class="l">тоннаж недели${diff != null ? ` <span class="${diff >= 0 ? 'good' : 'bad'}">${diff >= 0 ? '+' : ''}${diff}%</span>` : ''}</div></div>
        <div class="tile"><div class="v num">${wk.sets}</div><div class="l">рабочих подходов</div></div>
        <div class="tile"><div class="v num">${totalPRs()}</div><div class="l">рекордов всего</div></div>
      </div>

      <div class="section-label">Тоннаж по неделям</div>
      <div class="card chart-wrap" id="chartWeeks"></div>

      <div class="section-label">Упражнение</div>
      ${done.length ? `
      <select class="input" id="progEx" aria-label="Упражнение">${done.map((id) => `<option value="${esc(id)}" ${id === ui.progEx ? 'selected' : ''}>${esc(exById(id).name)}</option>`).join('')}</select>
      <div class="tiles" style="margin-top:10px">
        ${kind === 'weight' ? `<div class="tile"><div class="v num">${fmtKg(best.kg)}<small>кг</small></div><div class="l">макс. вес</div></div>
        <div class="tile"><div class="v num">${fmtKg(best.e1rm)}<small>кг</small></div><div class="l">расч. 1ПМ</div></div>` :
        kind === 'body' ? `<div class="tile"><div class="v num">${best.reps}</div><div class="l">макс. повторений</div></div><div class="tile"><div class="v num">${fmtKg(best.kg) || '0'}<small>кг</small></div><div class="l">макс. доп. вес</div></div>` :
          kind === 'time' ? `<div class="tile"><div class="v num">${fmtDur(best.sec * 1000)}</div><div class="l">макс. время</div></div><div class="tile"><div class="v num">${fmtKg(best.kg) || '0'}<small>кг</small></div><div class="l">макс. вес</div></div>` :
            `<div class="tile"><div class="v num">${best.km}<small>км</small></div><div class="l">макс. дистанция</div></div><div class="tile"><div class="v num">${fmtDur(best.sec * 1000)}</div><div class="l">макс. время</div></div>`}
        <div class="tile"><div class="v num">${hist.length}</div><div class="l">${plural(hist.length, 'тренировка', 'тренировки', 'тренировок')}</div></div>
      </div>
      <div class="card chart-wrap" style="margin-top:10px" id="chartEx"></div>
      <div class="card" style="margin-top:10px">
        <div class="table-wrap"><table class="wtable">
          <thead><tr><th>Дата</th><th>Лучший подход</th>${kind === 'weight' ? '<th>1ПМ</th><th>Тоннаж</th>' : '<th>Подходов</th>'}</tr></thead>
          <tbody>${hist.slice(-8).reverse().map((h) => `<tr><td>${fmtDate(h.date)}</td><td>${setLabel(h.top, kind)}${h.sets.some((s) => s.pr) ? ' <span class="pr-mark">★</span>' : ''}</td>${kind === 'weight' ? `<td>${fmtKg(h.e1rm)}</td><td>${fmtInt(h.vol)}</td>` : `<td>${h.sets.length}</td>`}</tr>`).join('')}</tbody>
        </table></div>
      </div>` : `<div class="empty">Проведи первую тренировку, и здесь появятся графики по каждому упражнению.</div>`}

      <div class="section-label">Вес тела</div>
      ${bw.length >= 2 ? `<div class="card chart-wrap" id="chartBw"></div>` : `<div class="card flat small muted">Отмечай вес в утреннем чек-ине хотя бы два раза, и тут появится график.${bw.length === 1 ? ` Сейчас: ${fmtKg(bw[0].v)} кг.` : ''}</div>`}

      <div class="section-label">Сон и энергия, 30 дней</div>
      ${sleep.length >= 2 ? `<div class="card chart-wrap" id="chartSleep"></div>` : `<div class="card flat small muted">Данные появятся после пары чек-инов.</div>`}
    `;
  }

  // графики: простые SVG по токенам темы
  function svgLine(el, pts, opts) {
    // pts: [{x: label, y: number, sub}], рисует линию с областью и точками
    if (!el) return;
    const W = el.clientWidth || 320, H = opts.h || 160, P = { l: 36, r: 12, t: 12, b: 24 };
    const ys = pts.map((p) => p.y);
    let min = Math.min(...ys), max = Math.max(...ys);
    if (min === max) { min -= 1; max += 1; }
    if (opts.zero) min = Math.min(0, min);
    const span = max - min; min -= span * 0.1; max += span * 0.1;
    const X = (i) => P.l + (pts.length === 1 ? (W - P.l - P.r) / 2 : (i / (pts.length - 1)) * (W - P.l - P.r));
    const Y = (v) => P.t + (1 - (v - min) / (max - min)) * (H - P.t - P.b);
    const ticks = 4; let grid = '';
    for (let i = 0; i <= ticks; i++) { const v = min + (max - min) * (i / ticks); const y = Y(v); grid += `<line x1="${P.l}" x2="${W - P.r}" y1="${y}" y2="${y}"/><text x="${P.l - 6}" y="${y + 3.5}" text-anchor="end">${opts.fmt ? opts.fmt(v) : Math.round(v)}</text>`; }
    const path = pts.map((p, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)},${Y(p.y).toFixed(1)}`).join(' ');
    const area = pts.length > 1 ? `${path} L${X(pts.length - 1).toFixed(1)},${H - P.b} L${X(0).toFixed(1)},${H - P.b} Z` : '';
    const labelEvery = Math.ceil(pts.length / 5);
    const labels = pts.map((p, i) => (i % labelEvery === 0 || i === pts.length - 1 ? `<text x="${X(i)}" y="${H - 6}" text-anchor="${i === 0 ? 'start' : i === pts.length - 1 ? 'end' : 'middle'}">${esc(p.x)}</text>` : '')).join('');
    const dots = pts.map((p, i) => `<circle class="dot" cx="${X(i)}" cy="${Y(p.y)}" r="${pts.length > 30 ? 2.5 : 4}"/>`).join('');
    const hits = pts.map((p, i) => `<rect class="hit" data-i="${i}" x="${X(i) - (W - P.l - P.r) / Math.max(1, pts.length) / 2}" y="0" width="${(W - P.l - P.r) / Math.max(1, pts.length)}" height="${H}"/>`).join('');
    el.innerHTML = `<svg class="chart" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(opts.label || '')}"><g class="grid">${grid}</g>${area ? `<path class="area" d="${area}"/>` : ''}<path class="line" d="${path}"/>${dots}${hits}</svg>`;
    const svg = $('svg', el);
    svg.addEventListener('pointermove', (ev) => { const t = ev.target.closest('.hit'); if (!t) return; const p = pts[+t.dataset.i]; showTip(el, X(+t.dataset.i), Y(p.y), p.tip || `${p.x}: ${opts.fmt ? opts.fmt(p.y) : p.y}`); });
    svg.addEventListener('pointerleave', () => hideTip(el));
  }
  function svgBars(el, pts, opts) {
    if (!el) return;
    const W = el.clientWidth || 320, H = opts.h || 150, P = { l: 36, r: 8, t: 12, b: 24 };
    const max = Math.max(1, ...pts.map((p) => p.y)) * 1.1;
    const n = pts.length, bw = (W - P.l - P.r) / n;
    const Y = (v) => P.t + (1 - v / max) * (H - P.t - P.b);
    let grid = ''; for (let i = 0; i <= 3; i++) { const v = max * (i / 3); const y = Y(v); grid += `<line x1="${P.l}" x2="${W - P.r}" y1="${y}" y2="${y}"/><text x="${P.l - 6}" y="${y + 3.5}" text-anchor="end">${opts.fmt ? opts.fmt(v) : Math.round(v)}</text>`; }
    const bars = pts.map((p, i) => { const x = P.l + i * bw + bw * 0.15; const y = Y(p.y); return `<rect class="bar ${p.y ? '' : 'dim'}" x="${x}" y="${p.y ? y : H - P.b - 3}" width="${bw * 0.7}" height="${p.y ? H - P.b - y : 3}"/><rect class="hit" data-i="${i}" x="${P.l + i * bw}" y="0" width="${bw}" height="${H}"/>`; }).join('');
    const labels = pts.map((p, i) => (p.x ? `<text x="${P.l + i * bw + bw / 2}" y="${H - 6}" text-anchor="middle">${esc(p.x)}</text>` : '')).join('');
    el.innerHTML = `<svg class="chart" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(opts.label || '')}"><g class="grid">${grid}</g>${bars}${labels}</svg>`;
    const svg = $('svg', el);
    svg.addEventListener('pointermove', (ev) => { const t = ev.target.closest('.hit'); if (!t) return; const i = +t.dataset.i; const p = pts[i]; showTip(el, P.l + i * bw + bw / 2, Y(p.y), p.tip || `${opts.fmt ? opts.fmt(p.y) : p.y}`); });
    svg.addEventListener('pointerleave', () => hideTip(el));
  }
  function showTip(el, x, y, text) { let t = $('.chart-tip', el); if (!t) { t = document.createElement('div'); t.className = 'chart-tip'; el.appendChild(t); } const svg = $('svg', el); const r = svg.getBoundingClientRect(); const vb = svg.viewBox.baseVal; const sx = r.width / vb.width, sy = r.height / vb.height; t.style.left = (svg.offsetLeft + x * sx) + 'px'; t.style.top = (svg.offsetTop + y * sy) + 'px'; t.textContent = text; }
  function hideTip(el) { const t = $('.chart-tip', el); if (t) t.remove(); }
  function drawCharts() {
    const weeks = []; for (let i = 11; i >= 0; i--) { const s = weekStats(i); weeks.push({ x: i % 3 === 0 ? `${s.start.getDate()}.${pad(s.start.getMonth() + 1)}` : '', y: Math.round(s.volume), tip: `Неделя с ${s.start.getDate()} ${MONTHS[s.start.getMonth()]}: ${fmtTon(s.volume)}, ${s.count} трен.` }); }
    svgBars($('#chartWeeks'), weeks, { fmt: (v) => (v >= 1000 ? Math.round(v / 1000) + 'т' : Math.round(v)), label: 'Тоннаж по неделям' });
    if (ui.progEx) {
      const hist = exerciseHistory(ui.progEx); const kind = exById(ui.progEx).kind;
      const key = kind === 'weight' ? 'e1rm' : kind === 'body' ? 'reps' : kind === 'time' ? 'sec' : 'km';
      const fmt = kind === 'weight' ? (v) => fmtKg(v) : kind === 'time' ? (v) => Math.round(v) + 'с' : (v) => Math.round(v * 10) / 10;
      const pts = hist.map((h) => { const d = new Date(h.date); return { x: `${d.getDate()}.${pad(d.getMonth() + 1)}`, y: h[key], tip: `${fmtDate(h.date)}: ${kind === 'weight' ? '1ПМ ' + fmtKg(h.e1rm) + ' кг, лучший ' + setLabel(h.top, kind) : setLabel(h.top, kind)}` }; });
      if (pts.length) svgLine($('#chartEx'), pts, { fmt, label: 'Динамика упражнения' });
    }
    const bw = Object.keys(state.checkins).sort().filter((k) => state.checkins[k].bodyweight).map((k) => { const d = fromDayKey(k); return { x: `${d.getDate()}.${pad(d.getMonth() + 1)}`, y: state.checkins[k].bodyweight, tip: `${fmtDate(d)}: ${fmtKg(state.checkins[k].bodyweight)} кг` }; });
    if (bw.length >= 2) svgLine($('#chartBw'), bw, { fmt: (v) => fmtKg(v), label: 'Вес тела', h: 140 });
    const sl = Object.keys(state.checkins).sort().slice(-30).filter((k) => state.checkins[k].sleep || state.checkins[k].energy).map((k) => { const d = fromDayKey(k); const c = state.checkins[k]; return { x: `${d.getDate()}.${pad(d.getMonth() + 1)}`, y: c.sleep || 0, tip: `${fmtDate(d)}: сон ${c.sleep || '–'} ч, энергия ${c.energy || '–'}/5` }; });
    if (sl.length >= 2) svgBars($('#chartSleep'), sl.map((p, i) => Object.assign({}, p, { x: i % 5 === 0 ? p.x : '' })), { fmt: (v) => Math.round(v) + 'ч', label: 'Сон по дням', h: 130 });
  }

  // ----- Упражнения -----
  function renderExercises() {
    const q = ui.exQuery.trim().toLowerCase();
    let list = allExercises().filter((e) => (!ui.exGroup || e.group === ui.exGroup) && (!ui.exEq || e.eq === ui.exEq) && (!q || e.name.toLowerCase().includes(q) || (e.en || '').toLowerCase().includes(q)));
    const freq = {}; for (const w of state.workouts) for (const e of w.exercises) freq[e.ex] = (freq[e.ex] || 0) + 1;
    list.sort((a, b) => (freq[b.id] || 0) - (freq[a.id] || 0) || a.name.localeCompare(b.name, 'ru'));
    return `
      <h1 class="screen-title">Упражнения</h1>
      <div class="screen-sub">${allExercises().length} в библиотеке. Нажми на упражнение, чтобы записать настройки тренажёра и посмотреть историю.</div>
      <div class="row">
        <div class="search grow">${ICON.search}<input class="input" id="exSearch" value="${esc(ui.exQuery)}" placeholder="Поиск: жим, pulldown, ноги…" aria-label="Поиск упражнения"></div>
        <button class="btn icon primary" data-action="new-exercise" type="button" aria-label="Своё упражнение">${ICON.plus}</button>
      </div>
      <div class="pills scroll" style="margin-top:10px"><button class="pill ${ui.exGroup ? '' : 'on'}" data-action="ex-group" data-v="" type="button">Все</button>${window.GYM_GROUPS.map((g) => `<button class="pill ${ui.exGroup === g ? 'on' : ''}" data-action="ex-group" data-v="${esc(g)}" type="button">${esc(g)}</button>`).join('')}</div>
      <div class="pills scroll" style="margin-top:6px"><button class="pill ${ui.exEq ? '' : 'on'}" data-action="ex-eq" data-v="" type="button">Любое</button>${window.GYM_EQUIPMENT.map((g) => `<button class="pill ${ui.exEq === g ? 'on' : ''}" data-action="ex-eq" data-v="${esc(g)}" type="button">${esc(g)}</button>`).join('')}</div>
      <div class="list" style="margin-top:12px">
        ${list.map((e) => { const b = bestBefore(e.id); const m = exMeta(e.id); return `<button class="item clickable" data-action="open-exercise" data-id="${esc(e.id)}" type="button">
          <div class="grow"><div class="t">${esc(e.name)}${e.custom ? ' <span class="badge">своё</span>' : ''}</div><div class="s">${esc(e.en)}${e.en ? ' · ' : ''}${esc(e.eq)}${m.machine ? ' · ' + esc(m.machine) : ''}</div></div>
          <div class="right small num">${freq[e.id] ? `<div>${freq[e.id]}×</div>` : ''}${e.kind === 'weight' && b.kg ? `<div class="accent bold">${fmtKg(b.kg)} кг</div>` : e.kind === 'body' && b.reps ? `<div class="accent bold">${b.reps} повт</div>` : ''}</div>
        </button>`; }).join('') || '<div class="empty">Ничего не нашлось. Добавь своё упражнение кнопкой +.</div>'}
      </div>`;
  }

  // ----- Ещё -----
  function renderMore() {
    const s = state.settings;
    const total = state.workouts.length;
    return `
      <h1 class="screen-title">Ещё</h1>
      <div class="screen-sub">Профиль, настройки, бэкапы и импорт.</div>
      <div class="card stack">
        <div class="card-title">Профиль</div>
        <div class="field"><label for="setName">Как к тебе обращаться</label><input class="input" id="setName" data-setting="name" value="${esc(s.name)}" placeholder="Имя"></div>
        <div class="field"><label for="setClub">Мой клуб</label><input class="input" id="setClub" data-setting="club" list="clubs" value="${esc(s.club)}" placeholder="Elixia …"><datalist id="clubs">${window.GYM_CLUBS.map((c) => `<option value="${esc(c)}">`).join('')}</datalist></div>
        <div class="field"><label for="setBw">Текущий вес, кг</label><input class="input" id="setBw" data-setting="bodyweight" inputmode="decimal" value="${s.bodyweight || ''}" placeholder="например, 68.5"></div>
      </div>
      <div class="card stack" style="margin-top:10px">
        <div class="card-title">Тренировка</div>
        <div class="field"><label for="setRest">Отдых между подходами по умолчанию, сек</label><input class="input" id="setRest" data-setting="defaultRest" inputmode="numeric" value="${s.defaultRest}"></div>
        <div class="row between"><span>Звук по окончании отдыха</span><button class="pill ${s.sound ? 'on' : ''}" data-action="toggle-setting" data-k="sound" type="button">${s.sound ? 'вкл' : 'выкл'}</button></div>
        <div class="row between"><span>Вибрация</span><button class="pill ${s.vibrate ? 'on' : ''}" data-action="toggle-setting" data-k="vibrate" type="button">${s.vibrate ? 'вкл' : 'выкл'}</button></div>
        <div class="field"><label for="setTheme">Тема</label><select class="input" id="setTheme" data-setting="theme"><option value="auto" ${s.theme === 'auto' ? 'selected' : ''}>Как в системе</option><option value="dark" ${s.theme === 'dark' ? 'selected' : ''}>Тёмная</option><option value="light" ${s.theme === 'light' ? 'selected' : ''}>Светлая</option></select></div>
      </div>
      <div class="card stack" style="margin-top:10px">
        <div class="card-title">Данные</div>
        <div class="small muted">${total} ${plural(total, 'тренировка', 'тренировки', 'тренировок')}, ${Object.keys(state.checkins).length} чек-инов, ${state.templates.length} программ. ${sync.db ? 'Синхронизируются с облаком claude.ai: откроешь эту же ссылку на ноутбуке — всё будет на месте.' : 'Хранятся в этом браузере. Делай бэкап время от времени.'}</div>
        <div class="grid2">
          <button class="btn" data-action="export-json" type="button">Бэкап JSON</button>
          <button class="btn" data-action="export-csv" type="button">Экспорт CSV</button>
        </div>
        <label class="btn block" for="importFile" style="cursor:pointer">Импорт: бэкап JSON или CSV из Strong / Hevy</label>
        <input type="file" id="importFile" accept=".json,.csv,text/csv,application/json" hidden>
        <button class="btn danger block" data-action="wipe" type="button">Стереть всё</button>
      </div>
      <details class="card" style="margin-top:10px">
        <summary>Коннекторы и Elixia</summary>
        <div class="small muted" style="margin-top:10px; display:grid; gap:8px">
          <p style="margin:0">У Elixia и SATS нет публичного API для сторонних приложений: их приложение показывает расписание и бронирует занятия, но тренировки с весами туда не выгружаются. Поэтому самый надёжный «коннектор» это вот этот трекер: он работает прямо на телефоне, офлайн, и держит данные в твоём аккаунте claude.ai.</p>
          <p style="margin:0"><b>Групповые занятия</b> (BODYPUMP, RPM и другие из расписания Elixia) записывай кнопкой «Групповое занятие» на главном экране, они попадут в историю и в недельную статистику.</p>
          <p style="margin:0"><b>Переезд из Strong или Hevy</b>: в тех приложениях сделай экспорт CSV и загрузи его через «Импорт». Упражнения сопоставятся по английским названиям, незнакомые добавятся как свои.</p>
          <p style="margin:0"><b>Apple Health и Google Fit</b> из веб-приложения недоступны. Если нужно, выгружай CSV и импортируй вручную, либо спроси Claude: эта страница хранит данные в его базе, он может построить любой отчёт.</p>
          <p style="margin:0"><b>На экран «Домой» на iPhone</b>: в Safari нажми «Поделиться», затем «На экран Домой». Приложение откроется во весь экран без адресной строки.</p>
        </div>
      </details>
      <div class="tiny faint" style="text-align:center;margin-top:18px">Железо · расчётный 1ПМ по формуле Эпли · данные принадлежат тебе</div>`;
  }

  // ---------- листы (bottom sheets) ----------
  const sheetRoot = $('#sheetRoot');
  let sheetOnClose = null;
  function openSheet(html, opts) {
    sheetOnClose = (opts && opts.onClose) || null;
    sheetRoot.innerHTML = `<div class="overlay" data-action="close-sheet"></div><div class="sheet" role="dialog" aria-modal="true"><div class="handle"></div>${html}</div>`;
    if (opts && opts.focus) { const f = $(opts.focus, sheetRoot); if (f) setTimeout(() => f.focus(), 50); }
  }
  function closeSheet() { sheetRoot.innerHTML = ''; if (sheetOnClose) { const f = sheetOnClose; sheetOnClose = null; f(); } }

  // выбор упражнения
  function openExercisePicker(onPick, opts) {
    let q = '', g = '';
    const draw = () => {
      const qq = q.toLowerCase();
      const recent = exercisesDone().slice(0, 6);
      let list = allExercises().filter((e) => (!g || e.group === g) && (!qq || e.name.toLowerCase().includes(qq) || (e.en || '').toLowerCase().includes(qq)));
      list.sort((a, b) => (recent.indexOf(a.id) === -1 ? 99 : recent.indexOf(a.id)) - (recent.indexOf(b.id) === -1 ? 99 : recent.indexOf(b.id)) || a.name.localeCompare(b.name, 'ru'));
      $('#pickList', sheetRoot).innerHTML = list.slice(0, 60).map((e) => `<button class="item clickable" data-pick="${esc(e.id)}" type="button"><div class="grow"><div class="t">${esc(e.name)}</div><div class="s">${esc(e.en)}${e.en ? ' · ' : ''}${esc(e.eq)} · ${esc(e.group)}</div></div>${recent.includes(e.id) ? '<span class="badge accent">недавно</span>' : ''}</button>`).join('') + `<button class="item clickable" data-pick="__new" type="button"><div class="grow"><div class="t">${ICON.plus} Создать своё${q ? ': «' + esc(q) + '»' : ''}</div><div class="s">Если нужного нет в библиотеке</div></div></button>`;
    };
    openSheet(`<h2>${(opts && opts.title) || 'Добавить упражнение'}</h2>
      <div class="search">${ICON.search}<input class="input" id="pickSearch" placeholder="Название по-русски или по-английски" aria-label="Поиск"></div>
      <div class="pills scroll" style="margin-top:8px"><button class="pill on" data-pg="" type="button">Все</button>${window.GYM_GROUPS.map((x) => `<button class="pill" data-pg="${esc(x)}" type="button">${esc(x)}</button>`).join('')}</div>
      <div class="list" id="pickList" style="margin-top:10px"></div>`, { focus: '#pickSearch' });
    draw();
    $('#pickSearch', sheetRoot).addEventListener('input', (e) => { q = e.target.value; draw(); });
    sheetRoot.addEventListener('click', function h(ev) {
      const pg = ev.target.closest('[data-pg]'); if (pg) { g = pg.dataset.pg; $$('[data-pg]', sheetRoot).forEach((b) => b.classList.toggle('on', b.dataset.pg === g)); draw(); return; }
      const p = ev.target.closest('[data-pick]'); if (!p) return;
      sheetRoot.removeEventListener('click', h);
      if (p.dataset.pick === '__new') { openNewExercise(q, (id) => onPick(id)); return; }
      closeSheet(); onPick(p.dataset.pick);
    });
  }
  function openNewExercise(prefill, onDone) {
    openSheet(`<h2>Своё упражнение</h2><div class="stack">
      <div class="field"><label for="neName">Название</label><input class="input" id="neName" value="${esc(prefill || '')}" placeholder="Например: Тяга в Technogym Pure"></div>
      <div class="field"><label for="neEn">Название на тренажёре (англ., необязательно)</label><input class="input" id="neEn" placeholder="Low row"></div>
      <div class="grid2">
        <div class="field"><label for="neGroup">Мышцы</label><select class="input" id="neGroup">${window.GYM_GROUPS.map((g) => `<option>${esc(g)}</option>`).join('')}</select></div>
        <div class="field"><label for="neEq">Оборудование</label><select class="input" id="neEq">${window.GYM_EQUIPMENT.map((g) => `<option ${g === 'Тренажёр' ? 'selected' : ''}>${esc(g)}</option>`).join('')}</select></div>
      </div>
      <div class="field"><label for="neKind">Что записывать</label><select class="input" id="neKind"><option value="weight">Вес и повторения</option><option value="body">Повторения (свой вес, можно + кг)</option><option value="time">Время (сек, можно + кг)</option><option value="cardio">Кардио: минуты и км</option></select></div>
      <div class="field"><label for="neRest">Отдых, сек</label><input class="input" id="neRest" inputmode="numeric" value="90"></div>
    </div><div class="foot"><button class="btn" data-action="close-sheet" type="button">Отмена</button><button class="btn primary" id="neSave" type="button">Сохранить</button></div>`, { focus: '#neName' });
    $('#neSave', sheetRoot).addEventListener('click', () => {
      const name = $('#neName', sheetRoot).value.trim(); if (!name) { toast('Нужно название'); return; }
      const ex = { id: 'c_' + uid(), name, en: $('#neEn', sheetRoot).value.trim(), group: $('#neGroup', sheetRoot).value, eq: $('#neEq', sheetRoot).value, kind: $('#neKind', sheetRoot).value, rest: num($('#neRest', sheetRoot).value) || 90, custom: true };
      state.exercises.push(ex); saveState('exercises'); closeSheet(); toast('Упражнение добавлено'); if (onDone) onDone(ex.id); else render();
    });
  }

  // карточка упражнения (настройки тренажёра, история)
  function openExerciseSheet(id) {
    const ex = exById(id); const m = exMeta(id); const hist = exerciseHistory(id).slice(-10).reverse(); const b = bestBefore(id);
    openSheet(`<h2>${esc(ex.name)}</h2>
      <div class="small muted" style="margin:-8px 0 12px">${esc(ex.en)}${ex.en ? ' · ' : ''}${esc(ex.eq)} · ${esc(ex.group)}</div>
      <div class="stack">
        <div class="field"><label for="emMachine">Настройки тренажёра / заметка об оборудовании</label><textarea class="input" id="emMachine" placeholder="Сиденье 4, упор для груди 3, хват нейтральный. Стоит у окна рядом с кроссовером.">${esc(m.machine || '')}</textarea></div>
        <div class="field"><label for="emRest">Отдых между подходами, сек</label><input class="input" id="emRest" inputmode="numeric" value="${exRest(id)}"></div>
        ${ex.kind === 'weight' && b.kg ? `<div class="tiles two"><div class="tile"><div class="v num">${fmtKg(b.kg)}<small>кг</small></div><div class="l">макс. вес</div></div><div class="tile"><div class="v num">${fmtKg(b.e1rm)}<small>кг</small></div><div class="l">расч. 1ПМ</div></div></div>` : ''}
        ${hist.length ? `<div class="section-label" style="margin-top:6px">Последние тренировки</div><div class="table-wrap"><table class="wtable"><tbody>${hist.map((h) => `<tr><td>${fmtDate(h.date)}</td><td style="text-align:left">${h.sets.map((s) => setLabel(s, ex.kind) + (s.pr ? '<span class="pr-mark">★</span>' : '')).join(', ')}</td></tr>`).join('')}</tbody></table></div>` : '<div class="small muted">Ещё не делала это упражнение.</div>'}
        ${ex.custom ? `<button class="btn danger sm" id="emDelete" type="button">Удалить своё упражнение</button>` : ''}
      </div>
      <div class="foot"><button class="btn" data-action="close-sheet" type="button">Закрыть</button><button class="btn primary" id="emSave" type="button">Сохранить</button>${active ? `<button class="btn good" id="emAdd" type="button">В тренировку</button>` : ''}</div>`);
    const save = () => { state.exMeta[id] = Object.assign({}, m, { machine: $('#emMachine', sheetRoot).value.trim(), rest: clamp(num($('#emRest', sheetRoot).value) || 0, 0, 900) }); saveState('exMeta'); };
    $('#emSave', sheetRoot).addEventListener('click', () => { save(); closeSheet(); toast('Сохранено'); render(); });
    const add = $('#emAdd', sheetRoot); if (add) add.addEventListener('click', () => { save(); closeSheet(); addExerciseToActive(id); ui.tab = 'today'; render(); });
    const del = $('#emDelete', sheetRoot); if (del) del.addEventListener('click', () => { if (!confirmInline(del, 'Точно удалить?')) return; state.exercises = state.exercises.filter((e) => e.id !== id); saveState('exercises'); closeSheet(); render(); });
  }
  // двухшаговое подтверждение на кнопке (confirm() в артефактах не работает)
  function confirmInline(btn, text) {
    if (btn.dataset.armed === '1') return true;
    btn.dataset.armed = '1'; const old = btn.innerHTML; btn.textContent = text || 'Нажми ещё раз для подтверждения';
    setTimeout(() => { if (btn.isConnected) { btn.dataset.armed = ''; btn.innerHTML = old; } }, 3000);
    return false;
  }

  // чек-ин самочувствия
  function openCheckin() {
    const k = todayKey(); const c = Object.assign({ sleep: null, energy: null, mood: null, soreness: null, bodyweight: null, note: '' }, state.checkins[k] || {});
    const scale = (id, n, val) => `<div class="scale" id="${id}">${Array.from({ length: n }, (_, i) => `<button type="button" class="${val === i + 1 ? 'on' : ''}" data-v="${i + 1}">${i + 1}</button>`).join('')}</div>`;
    openSheet(`<h2>Самочувствие</h2><div class="stack">
      <div class="field"><span class="lbl">Настроение</span><div class="scale emoji" id="ciMood">${FEEL.map((f, i) => `<button type="button" class="${c.mood === i + 1 ? 'on' : ''}" data-v="${i + 1}" title="${FEEL_T[i]}">${f}</button>`).join('')}</div></div>
      <div class="field"><span class="lbl">Энергия</span>${scale('ciEnergy', 5, c.energy)}</div>
      <div class="field"><span class="lbl">Крепатура / мышцы болят</span>${scale('ciSore', 5, c.soreness)}</div>
      <div class="grid2">
        <div class="field"><label for="ciSleep">Сон, часов</label><input class="input" id="ciSleep" inputmode="decimal" value="${c.sleep || ''}" placeholder="7.5"></div>
        <div class="field"><label for="ciBw">Вес, кг</label><input class="input" id="ciBw" inputmode="decimal" value="${c.bodyweight || ''}" placeholder="${state.settings.bodyweight || '68.0'}"></div>
      </div>
      <div class="field"><label for="ciNote">Заметка</label><input class="input" id="ciNote" value="${esc(c.note)}" placeholder="Болит плечо, мало ела, стресс…"></div>
    </div><div class="foot"><button class="btn" data-action="close-sheet" type="button">Отмена</button><button class="btn primary" id="ciSave" type="button">Сохранить</button></div>`);
    sheetRoot.addEventListener('click', (ev) => { const b = ev.target.closest('.scale button'); if (!b) return; $$('button', b.parentElement).forEach((x) => x.classList.toggle('on', x === b)); });
    $('#ciSave', sheetRoot).addEventListener('click', () => {
      const pick = (id) => { const b = $(`#${id} button.on`, sheetRoot); return b ? +b.dataset.v : null; };
      const bw = num($('#ciBw', sheetRoot).value);
      state.checkins[k] = { mood: pick('ciMood'), energy: pick('ciEnergy'), soreness: pick('ciSore'), sleep: num($('#ciSleep', sheetRoot).value), bodyweight: bw, note: $('#ciNote', sheetRoot).value.trim(), updatedAt: now() };
      if (bw) { state.settings.bodyweight = bw; state.touched.settings = now(); }
      saveState('checkins'); closeSheet(); toast('Записала. Хорошей тренировки!'); render();
    });
  }

  // групповое занятие
  function openClassLog() {
    openSheet(`<h2>Групповое занятие</h2><div class="stack">
      <div class="field"><label for="clName">Занятие</label><select class="input" id="clName">${window.GYM_CLASSES.map((c) => `<option>${esc(c)}</option>`).join('')}</select></div>
      <div class="grid2">
        <div class="field"><label for="clMin">Длительность, мин</label><input class="input" id="clMin" inputmode="numeric" value="55"></div>
        <div class="field"><label for="clDate">Дата</label><input class="input" id="clDate" type="date" value="${todayKey()}"></div>
      </div>
      <div class="field"><span class="lbl">Как прошло</span><div class="scale emoji" id="clFeel">${FEEL.map((f, i) => `<button type="button" class="${i === 3 ? 'on' : ''}" data-v="${i + 1}">${f}</button>`).join('')}</div></div>
      <div class="field"><label for="clNote">Заметка</label><input class="input" id="clNote" placeholder="Тренер, трек, что болело…"></div>
    </div><div class="foot"><button class="btn" data-action="close-sheet" type="button">Отмена</button><button class="btn primary" id="clSave" type="button">Записать</button></div>`);
    sheetRoot.addEventListener('click', (ev) => { const b = ev.target.closest('.scale button'); if (!b) return; $$('button', b.parentElement).forEach((x) => x.classList.toggle('on', x === b)); });
    $('#clSave', sheetRoot).addEventListener('click', () => {
      const name = $('#clName', sheetRoot).value; const mins = num($('#clMin', sheetRoot).value) || 55; const d = fromDayKey($('#clDate', sheetRoot).value || todayKey()); d.setHours(18, 0, 0, 0);
      const feelB = $('#clFeel button.on', sheetRoot);
      const w = { id: uid(), name, date: d.getTime(), start: d.getTime(), end: d.getTime() + mins * 60000, club: state.settings.club, exercises: [{ ex: 'group_class', note: name, sets: [{ type: 'N', sec: mins * 60, done: true }] }], feel: feelB ? +feelB.dataset.v : null, rpe: null, note: $('#clNote', sheetRoot).value.trim(), updatedAt: now() };
      state.workouts.push(w); touchWorkout(w); closeSheet(); toast(`${name}: записано`); render();
    });
  }

  // ---------- тренировка: действия ----------
  function newWorkout(name, items) {
    const t = now();
    return { id: uid(), name: name || defaultName(), date: t, start: t, end: null, club: state.settings.club, exercises: (items || []).map((it) => ({ ex: it.ex, machine: null, note: '', sets: Array.from({ length: it.sets || 3 }, () => ({ type: 'N', kg: null, reps: null, rpe: null, sec: null, km: null, done: false })) })), feel: null, rpe: null, note: '', updatedAt: t };
  }
  function defaultName() { const h = new Date().getHours(); return h < 12 ? 'Утренняя тренировка' : h < 17 ? 'Дневная тренировка' : 'Вечерняя тренировка'; }
  function startWorkout(w) { active = w; saveActive(); ui.tab = 'today'; render(); startTick(); }
  function addExerciseToActive(exId, nSets) {
    if (!active) return; const last = lastSetsFor(exId, active.editingId || active.id);
    const n = nSets || (last ? last.sets.length : 3);
    active.exercises.push({ ex: exId, machine: null, note: '', sets: Array.from({ length: Math.max(1, n) }, () => ({ type: 'N', kg: null, reps: null, rpe: null, sec: null, km: null, done: false })) });
    saveActive();
  }
  function readSetInputs(ei, si) {
    const card = $(`.ex-card[data-ei="${ei}"]`); if (!card) return;
    const row = $$('.set-row', card)[si]; if (!row) return;
    const s = active.exercises[ei].sets[si];
    $$('input', row).forEach((inp) => {
      const f = inp.dataset.field; let v = num(inp.value);
      if (v == null && inp.value.trim() === '' && inp.placeholder) v = num(inp.placeholder); // пусто = как в прошлый раз
      if (f === 'min') s.sec = v != null ? Math.round(v * 60) : null; else s[f] = v;
    });
  }
  function toggleDone(ei, si) {
    const e = active.exercises[ei]; const s = e.sets[si];
    if (!s.done) {
      readSetInputs(ei, si);
      const kind = exById(e.ex).kind;
      const filled = kind === 'weight' ? (s.kg != null && s.reps) : kind === 'body' ? s.reps : kind === 'time' ? s.sec : (s.sec || s.km);
      if (!filled) { toast('Сначала впиши результат подхода'); return; }
      s.done = true; s.doneAt = now();
      if (s.type !== 'W') { const pr = detectPR(e.ex, s, active.editingId || active.id, e.sets); if (pr) { s.pr = pr.type; toast(`🏅 Рекорд! ${exById(e.ex).name}: ${pr.text}`, 'pr'); haptic([40, 60, 40]); } }
      if (!active.editingId) startRest(exRest(e.ex));
    } else { s.done = false; s.pr = null; }
    saveActive(); render();
  }
  function finishWorkout() {
    const w = active;
    // подходы с данными, но без галочки, считаем выполненными; пустые убираем
    for (const e of w.exercises) {
      const kind = exById(e.ex).kind;
      e.sets = e.sets.filter((s) => s.done || s.kg != null || s.reps != null || s.sec != null || s.km != null);
      for (const s of e.sets) if (!s.done) { const ok = kind === 'weight' ? (s.kg != null && s.reps) : kind === 'body' ? s.reps : (s.sec || s.km); if (ok) { s.done = true; const pr = s.type !== 'W' ? detectPR(e.ex, s, w.editingId || w.id, e.sets) : null; if (pr) s.pr = pr.type; } }
      e.sets = e.sets.filter((s) => s.done);
    }
    w.exercises = w.exercises.filter((e) => e.sets.length);
    if (!w.exercises.length) { toast('Пустую тренировку сохранять не буду'); return; }
    const vol = workoutVolume(w), sets = workoutSets(w), prs = w.exercises.reduce((a, e) => a + e.sets.filter((s) => s.pr).length, 0);
    const dur = w.editingId ? (w.end ? w.end - w.start : 0) : now() - w.start;
    const ci = state.checkins[todayKey()] || {};
    openSheet(`<h2>Завершить тренировку</h2>
      <div class="tiles" style="margin-bottom:12px">
        <div class="tile"><div class="v num">${fmtDur(dur)}</div><div class="l">время</div></div>
        <div class="tile"><div class="v num">${sets}</div><div class="l">рабочих подходов</div></div>
        <div class="tile"><div class="v num">${prs ? '★' + prs : fmtTon(vol)}</div><div class="l">${prs ? plural(prs, 'рекорд', 'рекорда', 'рекордов') : 'тоннаж'}</div></div>
      </div>
      <div class="stack">
        <div class="field"><span class="lbl">Как ощущения</span><div class="scale emoji" id="fnFeel">${FEEL.map((f, i) => `<button type="button" class="${(w.feel || 4) === i + 1 ? 'on' : ''}" data-v="${i + 1}" title="${FEEL_T[i]}">${f}</button>`).join('')}</div></div>
        <div class="field"><span class="lbl">Нагрузка всей тренировки, RPE 1–10</span><div class="scale" id="fnRpe" style="grid-auto-columns:1fr">${Array.from({ length: 10 }, (_, i) => `<button type="button" class="${w.rpe === i + 1 ? 'on' : ''}" data-v="${i + 1}" style="padding:7px 0;font-size:12.5px">${i + 1}</button>`).join('')}</div></div>
        <div class="grid2">
          <div class="field"><label for="fnClub">Клуб</label><input class="input" id="fnClub" list="clubs2" value="${esc(w.club || state.settings.club || '')}" placeholder="Elixia …"><datalist id="clubs2">${window.GYM_CLUBS.map((c) => `<option value="${esc(c)}">`).join('')}</datalist></div>
          <div class="field"><label for="fnBw">Вес тела, кг</label><input class="input" id="fnBw" inputmode="decimal" value="${w.bodyweight || ci.bodyweight || ''}" placeholder="${state.settings.bodyweight || ''}"></div>
        </div>
        <div class="field"><label for="fnNote">Заметка</label><textarea class="input" id="fnNote" placeholder="Что получилось, что болело, что поменять в следующий раз">${esc(w.note || '')}</textarea></div>
      </div>
      <div class="foot"><button class="btn" data-action="close-sheet" type="button">Назад</button><button class="btn good" id="fnSave" type="button">${ICON.check} Сохранить</button></div>`);
    sheetRoot.addEventListener('click', (ev) => { const b = ev.target.closest('.scale button'); if (!b) return; $$('button', b.parentElement).forEach((x) => x.classList.toggle('on', x === b)); });
    $('#fnSave', sheetRoot).addEventListener('click', () => {
      const feelB = $('#fnFeel button.on', sheetRoot), rpeB = $('#fnRpe button.on', sheetRoot);
      w.feel = feelB ? +feelB.dataset.v : null; w.rpe = rpeB ? +rpeB.dataset.v : null;
      w.club = $('#fnClub', sheetRoot).value.trim(); w.bodyweight = num($('#fnBw', sheetRoot).value); w.note = $('#fnNote', sheetRoot).value.trim();
      if (w.club && w.club !== state.settings.club) { state.settings.club = w.club; state.touched.settings = now(); }
      if (w.bodyweight) { state.settings.bodyweight = w.bodyweight; state.touched.settings = now(); const k = dayKey(w.date); state.checkins[k] = Object.assign({}, state.checkins[k] || {}, { bodyweight: w.bodyweight, updatedAt: now() }); state.touched.checkins = now(); }
      // настройки тренажёров сохраняем в метаданные упражнения
      for (const e of w.exercises) if (e.machine != null && e.machine !== (exMeta(e.ex).machine || '')) { state.exMeta[e.ex] = Object.assign({}, exMeta(e.ex), { machine: e.machine }); state.touched.exercises = now(); state.touched.exMeta = now(); }
      if (w.editingId) { const idx = state.workouts.findIndex((x) => x.id === w.editingId); const saved = Object.assign({}, w, { id: w.editingId }); delete saved.editingId; if (idx >= 0) state.workouts[idx] = saved; else state.workouts.push(saved); touchWorkout(saved); }
      else { w.end = now(); state.workouts.push(w); touchWorkout(w); }
      active = null; saveActive(); stopRest(); closeSheet(); saveState('settings');
      toast(prs ? `Сохранено. ${prs} ${plural(prs, 'новый рекорд', 'новых рекорда', 'новых рекордов')}!` : 'Тренировка сохранена. Молодец!', prs ? 'pr' : ''); render();
    });
  }
  function openWorkout(id) {
    const w = state.workouts.find((x) => x.id === id); if (!w) return;
    const vol = workoutVolume(w);
    openSheet(`<h2>${esc(w.name)}</h2>
      <div class="small muted" style="margin:-8px 0 12px">${fmtDate(w.date)} · ${fmtTime(w.start || w.date)} · ${fmtMin(workoutDuration(w))}${w.club ? ' · ' + esc(w.club) : ''}</div>
      <div class="tiles" style="margin-bottom:12px">
        <div class="tile"><div class="v num">${workoutSets(w)}</div><div class="l">подходов</div></div>
        <div class="tile"><div class="v num">${fmtTon(vol)}</div><div class="l">тоннаж</div></div>
        <div class="tile"><div class="v">${w.feel ? FEEL[w.feel - 1] : '–'}</div><div class="l">${w.rpe ? 'RPE ' + w.rpe : 'ощущения'}</div></div>
      </div>
      <div class="stack">
        ${w.exercises.map((e) => { const ex = exById(e.ex); return `<div class="card flat" style="padding:12px"><div class="bold">${esc(ex.name)}</div>${e.machine ? `<div class="tiny muted">${esc(e.machine)}</div>` : ''}<div class="small num" style="margin-top:4px">${e.sets.map((s) => `<span class="${s.type === 'W' ? 'faint' : ''}">${s.type === 'W' ? 'р ' : ''}${setLabel(s, ex.kind)}${s.pr ? '<span class="pr-mark">★</span>' : ''}</span>`).join(' · ')}</div>${e.note ? `<div class="small muted" style="margin-top:4px">${esc(e.note)}</div>` : ''}</div>`; }).join('')}
        ${w.note ? `<div class="small muted">${esc(w.note)}</div>` : ''}
        ${w.bodyweight ? `<div class="small muted">Вес тела: ${fmtKg(w.bodyweight)} кг</div>` : ''}
      </div>
      <div class="grid2" style="margin-top:14px">
        <button class="btn" id="wRepeat" type="button">Повторить</button>
        <button class="btn" id="wEdit" type="button">Редактировать</button>
        <button class="btn" id="wTemplate" type="button">В программу</button>
        <button class="btn danger" id="wDelete" type="button">Удалить</button>
      </div>`);
    $('#wRepeat', sheetRoot).addEventListener('click', () => { if (active) { toast('Сначала заверши текущую тренировку'); return; } closeSheet(); startWorkout(newWorkout(w.name, w.exercises.map((e) => ({ ex: e.ex, sets: e.sets.filter((s) => s.type !== 'W').length || 3 })))); });
    $('#wEdit', sheetRoot).addEventListener('click', () => { if (active) { toast('Сначала заверши текущую тренировку'); return; } closeSheet(); active = JSON.parse(JSON.stringify(w)); active.editingId = w.id; saveActive(); ui.tab = 'today'; render(); });
    $('#wTemplate', sheetRoot).addEventListener('click', () => { const t = { id: 't_' + uid(), name: w.name, note: '', items: w.exercises.map((e) => ({ ex: e.ex, sets: e.sets.filter((s) => s.type !== 'W').length || 3, reps: e.sets[0] ? e.sets[0].reps || 0 : 0 })), updatedAt: now() }; state.templates.push(t); saveState('templates'); closeSheet(); toast('Программа создана'); ui.tab = 'today'; render(); });
    $('#wDelete', sheetRoot).addEventListener('click', (ev) => { if (!confirmInline(ev.currentTarget, 'Точно удалить?')) return; deleteWorkout(id); closeSheet(); render(); toast('Удалено'); });
  }
  function deleteWorkout(id) { state.workouts = state.workouts.filter((x) => x.id !== id); state.deleted[id] = now(); sync.delW.add(id); sync.dirtyW.delete(id); saveState('templates'); }

  // программы
  function openTemplateEditor(t) {
    const isNew = !t; t = t ? JSON.parse(JSON.stringify(t)) : { id: 't_' + uid(), name: '', note: '', items: [] };
    if (!isNew && window.GYM_PRESETS.some((p) => p.id === t.id) && !state.templates.some((x) => x.id === t.id)) { /* редактирование пресета делает его своим */ }
    const draw = () => {
      $('#tplItems', sheetRoot).innerHTML = t.items.map((it, i) => `<div class="item" style="padding:8px 10px"><div class="grow"><div class="t">${esc(exById(it.ex).name)}</div></div><div class="row"><input class="input" style="width:62px;min-height:36px;padding:6px;text-align:center" inputmode="numeric" value="${it.sets}" data-ti="${i}" aria-label="Подходов"><span class="small muted">подх.</span><button class="btn icon sm ghost" data-trm="${i}" type="button" aria-label="Убрать">${ICON.x}</button></div></div>`).join('') || '<div class="small muted">Пока пусто. Добавь упражнения.</div>';
    };
    openSheet(`<h2>${isNew ? 'Новая программа' : 'Программа'}</h2><div class="stack">
      <div class="field"><label for="tplName">Название</label><input class="input" id="tplName" value="${esc(t.name)}" placeholder="Например: Ноги + ягодицы"></div>
      <div class="field"><label for="tplNote">Заметка</label><input class="input" id="tplNote" value="${esc(t.note || '')}" placeholder="Вторник и пятница"></div>
      <div class="list" id="tplItems"></div>
      <button class="btn" id="tplAdd" type="button">${ICON.plus} Добавить упражнение</button>
    </div><div class="foot">${isNew ? '' : '<button class="btn danger" id="tplDelete" type="button">Удалить</button>'}<button class="btn" data-action="close-sheet" type="button">Отмена</button><button class="btn primary" id="tplSave" type="button">Сохранить</button></div>`, { focus: isNew ? '#tplName' : null });
    draw();
    sheetRoot.addEventListener('click', (ev) => { const rm = ev.target.closest('[data-trm]'); if (rm) { t.items.splice(+rm.dataset.trm, 1); draw(); } });
    sheetRoot.addEventListener('input', (ev) => { const i = ev.target.dataset.ti; if (i != null) t.items[+i].sets = clamp(num(ev.target.value) || 1, 1, 20); });
    $('#tplAdd', sheetRoot).addEventListener('click', () => { t.name = $('#tplName', sheetRoot).value; t.note = $('#tplNote', sheetRoot).value; openExercisePicker((id) => { t.items.push({ ex: id, sets: 3, reps: 0 }); openTemplateEditor(t); }, { title: 'В программу' }); });
    $('#tplSave', sheetRoot).addEventListener('click', () => {
      t.name = $('#tplName', sheetRoot).value.trim() || 'Программа'; t.note = $('#tplNote', sheetRoot).value.trim(); t.updatedAt = now();
      const idx = state.templates.findIndex((x) => x.id === t.id); if (idx >= 0) state.templates[idx] = t; else state.templates.push(t);
      saveState('templates'); closeSheet(); render();
    });
    const del = $('#tplDelete', sheetRoot); if (del) del.addEventListener('click', (ev) => { if (!confirmInline(ev.currentTarget, 'Точно удалить?')) return; state.templates = state.templates.filter((x) => x.id !== t.id); state.hiddenPresets = (state.hiddenPresets || []).concat(t.id); saveState('templates'); closeSheet(); render(); });
  }
  function findTemplate(id) { return state.templates.find((t) => t.id === id) || window.GYM_PRESETS.find((p) => p.id === id); }

  // ---------- таймеры ----------
  let tick = null;
  function startTick() { if (tick) clearInterval(tick); tick = setInterval(() => { const el = $('#liveTimer'); if (el && active && !active.editingId) el.textContent = fmtDur(now() - active.start); }, 1000); }
  const rest = { end: 0, total: 0, timer: null, fired: false };
  const restEl = $('#rest');
  function startRest(sec) {
    if (!sec) return; rest.end = now() + sec * 1000; rest.total = sec * 1000; rest.fired = false; restEl.hidden = false; document.body.classList.add('has-rest');
    if (rest.timer) clearInterval(rest.timer); rest.timer = setInterval(drawRest, 250); drawRest();
  }
  function stopRest() { if (rest.timer) clearInterval(rest.timer); rest.timer = null; restEl.hidden = true; restEl.innerHTML = ''; document.body.classList.remove('has-rest'); }
  function drawRest() {
    const left = rest.end - now(); const over = left <= 0;
    if (over && !rest.fired) { rest.fired = true; beep(); haptic([120, 80, 120]); }
    restEl.className = 'rest' + (over ? ' over' : '');
    restEl.innerHTML = `<div class="time">${over ? 'Пора!' : fmtDur(left)}</div><div class="bar"><i style="width:${over ? 100 : Math.round((1 - left / rest.total) * 100)}%"></i></div>
      <button class="btn sm" data-action="rest-add" type="button">+30</button><button class="btn sm ghost" data-action="rest-skip" type="button">${ICON.x}</button>`;
    if (over && left < -60000) stopRest();
  }
  let audioCtx = null;
  function beep() {
    if (!state.settings.sound) return;
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const t0 = audioCtx.currentTime;
      [0, 0.18, 0.36].forEach((dt, i) => { const o = audioCtx.createOscillator(), g = audioCtx.createGain(); o.type = 'sine'; o.frequency.value = i === 2 ? 1320 : 880; g.gain.setValueAtTime(0.0001, t0 + dt); g.gain.exponentialRampToValueAtTime(0.4, t0 + dt + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dt + 0.15); o.connect(g).connect(audioCtx.destination); o.start(t0 + dt); o.stop(t0 + dt + 0.16); });
    } catch (e) { /* без звука */ }
  }
  function haptic(p) { if (state.settings.vibrate && navigator.vibrate) { try { navigator.vibrate(p); } catch (e) { /* нет вибрации */ } } }
  function unlockAudio() { try { audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)(); if (audioCtx.state === 'suspended') audioCtx.resume(); } catch (e) { /* нет аудио */ } }

  // ---------- тосты ----------
  let toastTimer = null;
  function toast(text, cls) {
    const root = $('#toastRoot'); root.innerHTML = `<div class="toast ${cls || ''}">${text}</div>`;
    if (toastTimer) clearTimeout(toastTimer); toastTimer = setTimeout(() => { root.innerHTML = ''; }, cls === 'pr' ? 4200 : 2600);
  }

  // ---------- экспорт / импорт ----------
  async function saveFile(name, data, mime) {
    try { const dl = window.claude && window.claude.use ? await window.claude.use('downloads') : null; if (dl) { await dl.save({ filename: name, data }); toast('Файл сохранён'); return; } } catch (e) { if (e && e.code === 'declined') return; }
    try { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([data], { type: mime })); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); toast('Файл скачивается'); } catch (e) { toast('Не получилось сохранить файл'); }
  }
  function exportJSON() { saveFile(`zhelezo-backup-${todayKey()}.json`, JSON.stringify(Object.assign({}, state, { exportedAt: new Date().toISOString() }), null, 1), 'application/json'); }
  function exportCSV() {
    const rows = [['date', 'time', 'workout', 'club', 'exercise', 'exercise_en', 'set', 'type', 'kg', 'reps', 'rpe', 'seconds', 'km', 'pr', 'workout_rpe', 'feel', 'note']];
    for (const w of sortedWorkouts().reverse()) for (const e of w.exercises) { const ex = exById(e.ex); e.sets.forEach((s, i) => rows.push([dayKey(w.date), fmtTime(w.start || w.date), w.name, w.club || '', ex.name, ex.en || '', i + 1, s.type || 'N', s.kg ?? '', s.reps ?? '', s.rpe ?? '', s.sec ?? '', s.km ?? '', s.pr || '', w.rpe ?? '', w.feel ?? '', (e.note || w.note || '').replace(/\s+/g, ' ')])); }
    const csv = rows.map((r) => r.map((v) => { v = String(v); return /[",;\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(',')).join('\n');
    saveFile(`zhelezo-${todayKey()}.csv`, '﻿' + csv, 'text/csv');
  }
  function parseCSV(text) {
    const rows = []; let row = [], cell = '', q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) { if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c; }
      else if (c === '"') q = true; else if (c === ',' || c === ';') { row.push(cell); cell = ''; } else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cell); cell = ''; if (row.some((x) => x !== '')) rows.push(row); row = []; } else cell += c;
    }
    if (cell || row.length) { row.push(cell); if (row.some((x) => x !== '')) rows.push(row); }
    return rows;
  }
  function matchExercise(name) {
    const n = name.trim().toLowerCase().replace(/\s*\((barbell|dumbbell|machine|cable|bodyweight)\)\s*$/i, (m, g) => ' ' + g);
    const all = allExercises();
    let ex = all.find((e) => e.name.toLowerCase() === n || (e.en || '').toLowerCase() === n);
    if (!ex) ex = all.find((e) => e.en && (n.includes(e.en.toLowerCase()) || e.en.toLowerCase().includes(n)));
    if (!ex) { ex = { id: 'c_' + uid(), name: name.trim(), en: '', group: 'Всё тело', eq: 'Тренажёр', kind: 'weight', rest: 90, custom: true }; state.exercises.push(ex); state.touched.exercises = now(); }
    return ex.id;
  }
  function hashId(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return 'imp_' + (h >>> 0).toString(36); }
  function importCSV(text) {
    const rows = parseCSV(text.replace(/^﻿/, '')); if (rows.length < 2) throw new Error('Пустой файл');
    const head = rows[0].map((h) => h.trim().toLowerCase()); const col = (names) => { for (const n of names) { const i = head.indexOf(n); if (i >= 0) return i; } return -1; };
    const isHevy = head.includes('exercise_title'); const isStrong = head.includes('exercise name');
    if (!isHevy && !isStrong) throw new Error('Не узнаю формат. Нужен CSV из Strong или Hevy, либо бэкап JSON.');
    const cDate = col(['start_time', 'date']), cName = col(['title', 'workout name']), cEx = col(['exercise_title', 'exercise name']), cKg = col(['weight_kg', 'weight', 'weight (kg)']), cReps = col(['reps']), cRpe = col(['rpe']), cSec = col(['duration_seconds', 'seconds']), cKm = col(['distance_km', 'distance']), cType = col(['set_type']), cEnd = col(['end_time']), cDur = col(['duration']), cNote = col(['exercise_notes', 'notes']);
    const groups = {};
    for (const r of rows.slice(1)) {
      const dStr = r[cDate]; if (!dStr) continue;
      let d = new Date(dStr); if (isNaN(d)) { const m = dStr.match(/(\d{1,2}) (\w{3}) (\d{4}), (\d{1,2}):(\d{2})/); if (m) d = new Date(`${m[2]} ${m[1]}, ${m[3]} ${m[4]}:${m[5]}`); }
      if (isNaN(d)) continue;
      const key = dStr + '|' + (r[cName] || '');
      const g = groups[key] = groups[key] || { date: d.getTime(), name: r[cName] || 'Тренировка', end: null, ex: [], exMap: {} };
      if (cEnd >= 0 && r[cEnd]) { const e = new Date(r[cEnd]); if (!isNaN(e)) g.end = e.getTime(); }
      if (cDur >= 0 && r[cDur]) { const m = r[cDur].match(/(?:(\d+)h)?\s*(?:(\d+)m)?/); if (m) g.end = g.date + ((+m[1] || 0) * 60 + (+m[2] || 0)) * 60000; }
      const exName = r[cEx]; if (!exName) continue;
      let e = g.exMap[exName]; if (!e) { e = g.exMap[exName] = { ex: matchExercise(exName), machine: null, note: cNote >= 0 ? (r[cNote] || '') : '', sets: [] }; g.ex.push(e); }
      const t = cType >= 0 ? String(r[cType] || '').toLowerCase() : '';
      const type = t.startsWith('warm') ? 'W' : t.startsWith('drop') ? 'D' : t.startsWith('fail') ? 'F' : 'N';
      const kg = num(r[cKg]), reps = num(r[cReps]), rpe = cRpe >= 0 ? num(r[cRpe]) : null, sec = cSec >= 0 ? num(r[cSec]) : null, km = cKm >= 0 ? num(r[cKm]) : null;
      if (kg == null && reps == null && sec == null && km == null) continue;
      e.sets.push({ type, kg, reps, rpe, sec, km, done: true });
    }
    let added = 0;
    for (const key of Object.keys(groups)) {
      const g = groups[key]; const id = hashId(key); if (state.workouts.some((w) => w.id === id) || state.deleted[id]) continue;
      const w = { id, name: g.name, date: g.date, start: g.date, end: g.end || g.date + 3600000, club: '', exercises: g.ex, feel: null, rpe: null, note: 'Импорт из ' + (isHevy ? 'Hevy' : 'Strong'), updatedAt: now() };
      state.workouts.push(w); sync.dirtyW.add(id); added++;
    }
    recomputePRs();
    saveState('exercises');
    return added;
  }
  function importJSON(text) {
    const d = JSON.parse(text); if (!d || !Array.isArray(d.workouts)) throw new Error('Это не бэкап Железа');
    let added = 0;
    for (const w of d.workouts) { const i = state.workouts.findIndex((x) => x.id === w.id); if (i < 0) { state.workouts.push(w); added++; sync.dirtyW.add(w.id); } else if ((w.updatedAt || 0) > (state.workouts[i].updatedAt || 0)) { state.workouts[i] = w; sync.dirtyW.add(w.id); } }
    for (const e of d.exercises || []) if (!state.exercises.some((x) => x.id === e.id)) state.exercises.push(e);
    for (const t of d.templates || []) if (!state.templates.some((x) => x.id === t.id)) state.templates.push(t);
    Object.assign(state.checkins, d.checkins || {}); state.exMeta = Object.assign({}, d.exMeta || {}, state.exMeta);
    if (d.settings) state.settings = Object.assign({}, d.settings, state.settings);
    ['settings', 'exercises', 'exMeta', 'templates', 'checkins'].forEach((k) => { state.touched[k] = now(); });
    saveState('templates');
    return added;
  }
  // пересчёт рекордов по хронологии (после импорта)
  function recomputePRs() {
    const ws = state.workouts.slice().sort((a, b) => a.date - b.date); const best = {};
    for (const w of ws) for (const e of w.exercises) { const kind = exById(e.ex).kind; const b = best[e.ex] = best[e.ex] || { kg: 0, e1rm: 0, reps: 0, sec: 0, km: 0 }; for (const s of e.sets) { if (!s.done || s.type === 'W') continue; s.pr = null; if (kind === 'weight' && s.kg > 0 && s.reps > 0) { if (s.kg > b.kg && b.kg > 0) s.pr = 'kg'; else { const r = e1rm(s.kg, s.reps); if (r > b.e1rm && b.e1rm > 0) s.pr = '1rm'; } b.kg = Math.max(b.kg, s.kg); b.e1rm = Math.max(b.e1rm, e1rm(s.kg, s.reps)); } else if (kind === 'body') { if (s.reps > b.reps && b.reps > 0) s.pr = 'reps'; b.reps = Math.max(b.reps, s.reps || 0); } else if (kind === 'time') { if (s.sec > b.sec && b.sec > 0) s.pr = 'sec'; b.sec = Math.max(b.sec, s.sec || 0); } else if (kind === 'cardio') { if (s.km > b.km && b.km > 0) s.pr = 'km'; b.km = Math.max(b.km, s.km || 0); } } }
  }

  // ---------- синхронизация с базой артефакта ----------
  function setSyncStatus(s, label) { sync.status = s; const chip = $('#syncChip'); chip.className = 'chip-sync ' + (s === 'ok' ? 'on' : s === 'busy' ? 'busy' : ''); $('#syncLabel').textContent = label; }
  function scheduleFlush() { if (!sync.db) return; if (sync.timer) clearTimeout(sync.timer); sync.timer = setTimeout(flush, 1500); }
  const mainDoc = () => sync.db.doc(`data/users/${sync.uid}/main`);
  const wCol = () => mainDoc().collection('workouts');
  function mainBody() { return { settings: state.settings, exercises: state.exercises, exMeta: state.exMeta, templates: state.templates, checkins: state.checkins, deleted: state.deleted, touched: state.touched, hiddenPresets: state.hiddenPresets || [], updatedAt: now() }; }
  let flushing = false;
  async function flush() {
    if (!sync.db || flushing) { if (flushing) scheduleFlush(); return; }
    flushing = true; setSyncStatus('busy', 'сохраняю…');
    try {
      for (const id of Array.from(sync.delW)) { await wCol().doc(id).delete(); sync.delW.delete(id); }
      for (const id of Array.from(sync.dirtyW)) { const w = state.workouts.find((x) => x.id === id); if (w) await wCol().doc(id).set(w); sync.dirtyW.delete(id); }
      if (sync.dirtyMain) { sync.dirtyMain = false; await mainDoc().set(mainBody()); }
      setSyncStatus('ok', 'в облаке');
    } catch (e) { setSyncStatus('err', 'ошибка синка'); console.warn('sync', e); setTimeout(scheduleFlush, 8000); }
    finally { flushing = false; }
  }
  function mergeMain(remote) {
    if (!remote) { sync.dirtyMain = true; return; }
    const rt = remote.touched || {}; let changed = false;
    for (const k of ['settings', 'exercises', 'exMeta', 'templates', 'checkins']) {
      if ((rt[k] || 0) > (state.touched[k] || 0) && remote[k] != null) { state[k] = remote[k]; state.touched[k] = rt[k]; changed = true; }
      else if ((rt[k] || 0) < (state.touched[k] || 0)) sync.dirtyMain = true;
    }
    for (const id of Object.keys(remote.deleted || {})) { if (!state.deleted[id]) { state.deleted[id] = remote.deleted[id]; const i = state.workouts.findIndex((w) => w.id === id && (w.updatedAt || 0) < remote.deleted[id]); if (i >= 0) { state.workouts.splice(i, 1); changed = true; } } }
    for (const id of Object.keys(state.deleted)) if (!(remote.deleted || {})[id]) sync.dirtyMain = true;
    if (remote.hiddenPresets) state.hiddenPresets = Array.from(new Set((state.hiddenPresets || []).concat(remote.hiddenPresets)));
    if (changed) lsSet(LS_KEY, state);
    return changed;
  }
  function mergeWorkouts(docs) {
    let changed = false; const seen = new Set();
    for (const d of docs) {
      const w = d.data(); if (!w || !w.id) continue; seen.add(w.id);
      if (state.deleted[w.id] && state.deleted[w.id] > (w.updatedAt || 0)) { sync.delW.add(w.id); continue; }
      const i = state.workouts.findIndex((x) => x.id === w.id);
      if (i < 0) { state.workouts.push(w); changed = true; }
      else if ((w.updatedAt || 0) > (state.workouts[i].updatedAt || 0)) { state.workouts[i] = w; changed = true; }
      else if ((w.updatedAt || 0) < (state.workouts[i].updatedAt || 0)) sync.dirtyW.add(w.id);
    }
    for (const w of state.workouts) if (!seen.has(w.id)) sync.dirtyW.add(w.id);
    if (changed) lsSet(LS_KEY, state);
    return changed;
  }
  async function initSync() {
    if (!(window.claude && typeof window.claude.use === 'function')) return;
    try {
      const [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]);
      if (!db || !user) return;
      const id = await user.id(); if (!id) return;
      sync.db = db; sync.uid = id; setSyncStatus('busy', 'загружаю…');
      const [m, ws] = await Promise.all([mainDoc().get(), wCol().limit(1000).get()]);
      let changed = mergeMain(m.exists ? m.data() : null);
      changed = mergeWorkouts(ws.docs) || changed;
      if (changed) render();
      setSyncStatus('ok', 'в облаке');
      if (sync.dirtyMain || sync.dirtyW.size || sync.delW.size) scheduleFlush();
      // живые обновления с других устройств
      sync.unsub.push(wCol().onSnapshot((snap) => { if (snap.metadata.hasPendingWrites) return; if (mergeWorkouts(snap.docs)) render(); }, (e) => console.warn('snap', e)));
      sync.unsub.push(mainDoc().onSnapshot((snap) => { if (snap.metadata.hasPendingWrites || !snap.exists) return; if (mergeMain(snap.data())) render(); }, (e) => console.warn('snap', e)));
    } catch (e) { console.warn('initSync', e); setSyncStatus('err', 'без облака'); }
  }

  // ---------- события ----------
  document.addEventListener('click', (ev) => {
    const tab = ev.target.closest('.tab'); if (tab) { ui.tab = tab.dataset.tab; render(); return; }
    const el = ev.target.closest('[data-action]'); if (!el) return;
    const a = el.dataset.action; const ei = el.dataset.ei != null ? +el.dataset.ei : null; const si = el.dataset.si != null ? +el.dataset.si : null;
    unlockAudio();
    switch (a) {
      case 'close-sheet': closeSheet(); break;
      case 'start-empty': startWorkout(newWorkout()); break;
      case 'repeat-last': { const l = sortedWorkouts()[0]; if (l) startWorkout(newWorkout(l.name, l.exercises.map((e) => ({ ex: e.ex, sets: e.sets.filter((s) => s.type !== 'W').length || 3 })))); break; }
      case 'start-template': { const t = findTemplate(el.dataset.id); if (t) startWorkout(newWorkout(t.name, t.items)); break; }
      case 'template-menu': { const t = findTemplate(el.dataset.id); if (t) openTemplateEditor(t); break; }
      case 'new-template': openTemplateEditor(null); break;
      case 'log-class': openClassLog(); break;
      case 'checkin': openCheckin(); break;
      case 'open-workout': openWorkout(el.dataset.id); break;
      case 'add-exercise': openExercisePicker((id) => { addExerciseToActive(id); render(); }); break;
      case 'add-set': { const e = active.exercises[ei]; const last = e.sets[e.sets.length - 1]; e.sets.forEach((s, j) => readSetInputs(ei, j)); e.sets.push({ type: 'N', kg: last ? last.kg : null, reps: last ? last.reps : null, rpe: null, sec: last ? last.sec : null, km: last ? last.km : null, done: false }); saveActive(); render(); break; }
      case 'toggle-done': toggleDone(ei, si); break;
      case 'cycle-type': { const s = active.exercises[ei].sets[si]; const order = ['N', 'W', 'D', 'F']; s.type = order[(order.indexOf(s.type || 'N') + 1) % order.length]; active.exercises[ei].sets.forEach((x, j) => readSetInputs(ei, j)); saveActive(); render(); break; }
      case 'start-rest': startRest(exRest(active.exercises[ei].ex)); break;
      case 'rest-add': rest.end = Math.max(now(), rest.end) + 30000; rest.total += 30000; rest.fired = false; drawRest(); break;
      case 'rest-skip': stopRest(); break;
      case 'ex-menu': openExerciseMenu(ei); break;
      case 'discard': { if (!confirmInline(el, 'Точно отменить? Данные пропадут')) return; active = null; saveActive(); stopRest(); render(); break; }
      case 'finish': active.exercises.forEach((e, i) => e.sets.forEach((s, j) => readSetInputs(i, j))); saveActive(); finishWorkout(); break;
      case 'hist-prev': case 'hist-next': { const [y, m] = ui.histMonth.split('-').map(Number); const d = new Date(y, m - 1 + (a === 'hist-next' ? 1 : -1), 1); ui.histMonth = `${d.getFullYear()}-${pad(d.getMonth() + 1)}`; render(); break; }
      case 'ex-group': ui.exGroup = el.dataset.v; render(); break;
      case 'ex-eq': ui.exEq = el.dataset.v; render(); break;
      case 'open-exercise': openExerciseSheet(el.dataset.id); break;
      case 'new-exercise': openNewExercise('', () => render()); break;
      case 'toggle-setting': state.settings[el.dataset.k] = !state.settings[el.dataset.k]; saveState('settings'); render(); break;
      case 'export-json': exportJSON(); break;
      case 'export-csv': exportCSV(); break;
      case 'wipe': { if (!confirmInline(el, 'Точно стереть всё? Нажми ещё раз')) return; const ids = state.workouts.map((w) => w.id); state = defaultState(); ids.forEach((id) => { state.deleted[id] = now(); sync.delW.add(id); }); active = null; saveActive(); ['settings', 'exercises', 'exMeta', 'templates', 'checkins'].forEach((k) => { state.touched[k] = now(); }); saveState('settings'); render(); toast('Всё стёрто'); break; }
      default: break;
    }
  });
  document.addEventListener('input', (ev) => {
    const t = ev.target;
    if (t.id === 'liveName' && active) { active.name = t.value; saveActive(); return; }
    if (t.dataset.field && active && t.dataset.ei != null) {
      const e = active.exercises[+t.dataset.ei]; if (!e) return;
      if (t.dataset.field === 'machine') { e.machine = t.value; saveActive(); return; }
      const s = e.sets[+t.dataset.si]; if (!s) return; const v = num(t.value);
      if (t.dataset.field === 'min') s.sec = v != null ? Math.round(v * 60) : null; else s[t.dataset.field] = v;
      saveActive(); return;
    }
    if (t.id === 'exSearch') { ui.exQuery = t.value; ui.exFocus = true; render(); return; }
    if (t.dataset.setting) {
      const k = t.dataset.setting; let v = t.value;
      if (k === 'defaultRest') v = clamp(num(v) || 0, 0, 900); if (k === 'bodyweight') v = num(v);
      state.settings[k] = v; if (k === 'theme') applyTheme(); saveState('settings'); return;
    }
  });
  document.addEventListener('change', (ev) => {
    const t = ev.target;
    if (t.id === 'progEx') { ui.progEx = t.value; render(); }
    if (t.id === 'importFile' && t.files && t.files[0]) {
      const f = t.files[0]; const r = new FileReader();
      r.onload = () => { try { const txt = String(r.result); const n = f.name.toLowerCase().endsWith('.json') || txt.trim().startsWith('{') ? importJSON(txt) : importCSV(txt); toast(`Импорт готов: ${n} ${plural(n, 'новая тренировка', 'новые тренировки', 'новых тренировок')}`); render(); } catch (e) { toast(e.message || 'Не удалось импортировать'); } };
      r.readAsText(f); t.value = '';
    }
  });
  function openExerciseMenu(ei) {
    const e = active.exercises[ei]; const ex = exById(e.ex);
    openSheet(`<h2>${esc(ex.name)}</h2><div class="stack">
      <div class="field"><label for="exNote">Заметка к упражнению в этой тренировке</label><input class="input" id="exNote" value="${esc(e.note || '')}" placeholder="Техника, боль, что поменять"></div>
      <div class="field"><label for="exRestIn">Отдых после подхода, сек (для этого упражнения всегда)</label><input class="input" id="exRestIn" inputmode="numeric" value="${exRest(e.ex)}"></div>
      <div class="grid2">
        <button class="btn" id="exUp" type="button" ${ei === 0 ? 'disabled' : ''}>${ICON.up} Выше</button>
        <button class="btn" id="exDown" type="button" ${ei === active.exercises.length - 1 ? 'disabled' : ''}>${ICON.down} Ниже</button>
        <button class="btn" id="exReplace" type="button">Заменить</button>
        <button class="btn danger" id="exRemove" type="button">Убрать</button>
      </div>
    </div><div class="foot"><button class="btn primary" id="exOk" type="button">Готово</button></div>`);
    const apply = () => { e.note = $('#exNote', sheetRoot).value.trim(); const r = clamp(num($('#exRestIn', sheetRoot).value) || 0, 0, 900); if (r !== exRest(e.ex)) { state.exMeta[e.ex] = Object.assign({}, exMeta(e.ex), { rest: r }); saveState('exMeta'); } saveActive(); };
    $('#exOk', sheetRoot).addEventListener('click', () => { apply(); closeSheet(); render(); });
    $('#exUp', sheetRoot).addEventListener('click', () => { apply(); active.exercises.splice(ei - 1, 0, active.exercises.splice(ei, 1)[0]); saveActive(); closeSheet(); render(); });
    $('#exDown', sheetRoot).addEventListener('click', () => { apply(); active.exercises.splice(ei + 1, 0, active.exercises.splice(ei, 1)[0]); saveActive(); closeSheet(); render(); });
    $('#exRemove', sheetRoot).addEventListener('click', (ev) => { if (!confirmInline(ev.currentTarget, 'Точно убрать?')) return; active.exercises.splice(ei, 1); saveActive(); closeSheet(); render(); });
    $('#exReplace', sheetRoot).addEventListener('click', () => { apply(); openExercisePicker((id) => { e.ex = id; e.machine = null; saveActive(); render(); }, { title: 'Заменить на' }); });
  }

  function applyTheme() { const t = state.settings.theme; if (t === 'dark' || t === 'light') document.documentElement.dataset.theme = t; else delete document.documentElement.dataset.theme; }

  // ---------- старт ----------
  applyTheme();
  updateLiveDot();
  if (active) startTick();
  render();
  initSync();
})();
