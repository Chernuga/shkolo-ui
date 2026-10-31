/* ==========================================================================
   Shkolo UI — talks to the Shkolo API Worker
   All requests use the HttpOnly session cookie, so the token never appears
   in the UI code or in localStorage.
   ========================================================================== */

// `config.js` (served by a Pages Function) provides window.SHKOLO_API_BASE.
// If it is missing — e.g. opened straight from disk — fall back to same-origin.
const API_BASE = String(window.SHKOLO_API_BASE || '').replace(/\/+$/, '');
const WEEK_KEY = 'shkolo_ui_week';

const $ = (sel) => document.querySelector(sel);
const el = (id) => document.getElementById(id);

let state = {
  week: null,        // {week, year} or null = current week
  view: 'grades',
  gradesLoaded: false,
  scheduleLoaded: false,
};

/* ---------------------------------------------------------------- utils */

function toast(text) {
  const t = el('toast');
  t.textContent = text;
  t.classList.remove('hidden');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.add('hidden'), 2600);
}

function setLoginMsg(text, kind) {
  const m = el('loginMsg');
  m.textContent = text;
  m.className = 'login-msg' + (kind ? ' ' + kind : '');
}

async function api(path, options = {}) {
  const res = await fetch(API_BASE + path, {
    credentials: 'include',
    ...options,
  });
  return res;
}

async function apiJson(path) {
  const res = await api(path);
  const text = await res.text();
  let data = null;
  try { data = JSON.parse(text); } catch (e) { /* not JSON (e.g. Bot Fight Mode HTML) */ }

  if (res.status === 401) {
    showLogin();
    throw new Error('Сесията изтече. Влезте отново.');
  }
  if (!data) {
    throw new Error('Отговорът не е JSON (HTTP ' + res.status + '). Проверете /config-check.html.');
  }
  if (!res.ok) {
    throw new Error(data.error || ('HTTP ' + res.status));
  }
  return data;
}

/* ---------------------------------------------------------------- auth */

async function login(event) {
  event.preventDefault();
  const username = el('username').value.trim();
  const password = el('password').value;
  if (!username || !password) { setLoginMsg('Въведете потребителско име и парола.', 'err'); return; }

  el('loginBtn').disabled = true;
  setLoginMsg('Влизане през браузър… ~20–40 сек.');

  try {
    const res = await api('/api/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const text = await res.text();
    let data = {};
    try { data = JSON.parse(text); } catch (e) {
      throw new Error('Отговорът не е JSON (HTTP ' + res.status + '). Проверете /config-check.html.');
    }
    if (!res.ok) throw new Error(data.error || 'Неуспешен вход');

    el('password').value = '';
    setLoginMsg('');
    await enterApp();
  } catch (err) {
    setLoginMsg(err.message, 'err');
  } finally {
    el('loginBtn').disabled = false;
  }
}

async function logout() {
  try { await api('/api/logout', { method: 'POST' }); } catch (e) { /* ignore */ }
  location.reload();
}

function showLogin() {
  el('app').classList.add('hidden');
  el('loginScreen').classList.remove('hidden');
}

async function enterApp() {
  let info = null;
  try {
    const res = await api('/api/session');
    if (!res.ok) throw new Error('no session');
    info = await res.json();
  } catch (e) {
    showLogin();
    return;
  }

  el('loginScreen').classList.add('hidden');
  el('app').classList.remove('hidden');
  el('userChip').textContent = info.pupilId ? 'ученик ' + info.pupilId : 'активна сесия';

  loadGrades();
}

/* ---------------------------------------------------------------- views */

function setView(view) {
  state.view = view;

  document.querySelectorAll('.nav-item').forEach((b) => {
    b.classList.toggle('active', b.dataset.view === view);
  });
  document.querySelectorAll('.view').forEach((v) => v.classList.add('hidden'));
  el('view-' + view).classList.remove('hidden');

  const titles = {
    grades: 'Оценки', schedule: 'Програма', absences: 'Отсъствия',
    homeworks: 'Домашни', raw: 'Raw',
  };
  el('topTitle').textContent = titles[view] || 'Дневник';
  el('sidebar').classList.remove('open');

  if (view === 'schedule' && !state.scheduleLoaded) loadSchedule();
  if (view === 'absences') loadFrame('absences', '/raw/absences');
  if (view === 'homeworks') loadFrame('homeworks', '/raw/homeworks');
}

function loadFrame(name, path) {
  const frame = el(name === 'absences' ? 'absFrame' : 'hwFrame');
  const link = el(name === 'absences' ? 'absLink' : 'hwLink');
  const url = API_BASE + path;
  if (!frame.dataset.loaded) {
    frame.src = url;
    frame.dataset.loaded = '1';
  }
  link.href = url;
}

function goRaw() {
  const p = el('rawPath').value.trim().replace(/^\/+/, '');
  if (!p) return;
  const url = API_BASE + '/raw/' + p;
  el('rawStatus').textContent = url;
  el('rawFrame').src = url;
}

/* ---------------------------------------------------------------- grades */

async function loadGrades() {
  const body = el('gradesBody');
  body.innerHTML = '<tr><td colspan="6" class="empty">Зареждане…</td></tr>';

  const params = new URLSearchParams();
  const subject = el('fSubject').value.trim();
  const min = el('fMin').value.trim();
  const max = el('fMax').value.trim();
  if (subject) params.set('subject', subject);
  if (min) params.set('min', min);
  if (max) params.set('max', max);

  try {
    const data = await apiJson('/grades' + (params.toString() ? '?' + params : ''));

    el('gradesStat').textContent =
      data.subjectCount + (data.totalSubjectCount ? ' / ' + data.totalSubjectCount : '') + ' предмета · ' +
      data.gradeCount + ' оценки · среден ' + (data.average === null ? '—' : data.average);

    if (!data.subjects.length) {
      body.innerHTML = '<tr><td colspan="6" class="empty">Няма намерени оценки.</td></tr>';
      return;
    }

    body.innerHTML = data.subjects.map((s) => `
      <tr>
        <td class="idx num">${s.index == null ? '' : s.index}</td>
        <td class="subject">${escapeHtml(s.subject)}</td>
        <td>${pills(s.term1)}</td>
        <td>${pills(s.term2)}</td>
        <td class="num muted">${s.annual ? escapeHtml(s.annual) : ''}</td>
        <td class="num muted">${s.average == null ? '' : s.average}</td>
      </tr>
    `).join('');
  } catch (err) {
    body.innerHTML = `<tr><td colspan="6" class="empty">${escapeHtml(err.message)}</td></tr>`;
  }
}

function pills(list) {
  if (!list || !list.length) return '<span class="muted">—</span>';
  return list.map((g) => `<span class="pill ${g.color}">${escapeHtml(g.value)}</span>`).join('');
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/* ---------------------------------------------------------------- schedule */

function weekParam() {
  if (state.week) return `?week=${state.week.week}&year=${state.week.year}`;
  return '';
}

async function loadSchedule() {
  const grid = el('weekGrid');
  grid.innerHTML = '<div class="muted" style="padding:12px">Зареждане…</div>';

  try {
    const data = await apiJson('/schedule' + weekParam());

    el('weekLabel').textContent = 'седмица ' + data.week + ' / ' + (data.year === undefined ? '' : '20' + data.year);
    el('weekInfo').textContent = 'седмица ' + data.week + ' · ' + data.dayCount + ' дни · ' + data.lessonCount + ' часа';

    if (!data.days.length) {
      grid.innerHTML = '<div class="muted" style="padding:12px">Няма часове за тази седмица.</div>';
      return;
    }

    grid.innerHTML = data.days.map(renderDay).join('');
    state.scheduleLoaded = true;
  } catch (err) {
    grid.innerHTML = `<div style="padding:12px;color:var(--red)">${escapeHtml(err.message)}</div>`;
  }
}

function renderDay(day) {
  const rows = [];

  if (!day.lessons.length) {
    rows.push('<div class="gap">Няма часове</div>');
  } else {
    for (const l of day.lessons) {
      rows.push(`
        <div class="lesson${l.free ? ' free' : ''}">
          <div class="lnum">${l.hour}. час</div>
          <div class="lname">${escapeHtml(l.subject)}</div>
          <div class="lmeta">${escapeHtml(l.teacher || '')}</div>
          <div class="lmeta">${escapeHtml(l.room || '')}${l.room && l.time ? ' · ' : ''}${escapeHtml(l.time || '')}</div>
        </div>
      `);
    }
    if (day.freeHours && day.freeHours.length) {
      rows.push(`<div class="gap">свободни: ${day.freeHours.join(', ')}</div>`);
    }
  }

  return `
    <div class="day-col">
      <div class="day-head">
        <span class="dn">${escapeHtml(day.shortDay || '')}</span>
        <span class="dd">${escapeHtml(day.date || '')}</span>
      </div>
      ${rows.join('')}
    </div>
  `;
}

function shiftWeek(delta) {
  if (!state.week) {
    // Start from the currently displayed week
    const now = new Date();
    const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    const dow = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dow);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const week = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    state.week = { week: week + delta, year: now.getFullYear() % 100 };
  } else {
    state.week.week += delta;
  }

  // Wrap weeks 53 -> 1 and 0 -> 52
  if (state.week.week < 1) {
    state.week.week = 52;
    state.week.year -= 1;
  } else if (state.week.week > 52) {
    state.week.week = 1;
    state.week.year += 1;
  }

  state.scheduleLoaded = false;
  loadSchedule();
}

/* ---------------------------------------------------------------- boot */

function bind() {
  el('loginForm').addEventListener('submit', login);
  el('logoutBtn').addEventListener('click', logout);

  el('togglePass').addEventListener('click', () => {
    const p = el('password');
    p.type = p.type === 'password' ? 'text' : 'password';
  });

  document.querySelectorAll('.nav-item').forEach((b) => {
    b.addEventListener('click', () => setView(b.dataset.view));
  });

  el('menuBtn').addEventListener('click', () => el('sidebar').classList.toggle('open'));

  el('gradesRefresh').addEventListener('click', loadGrades);
  el('fApply').addEventListener('click', loadGrades);
  el('fClear').addEventListener('click', () => {
    el('fSubject').value = ''; el('fMin').value = ''; el('fMax').value = '';
    loadGrades();
  });
  ['fSubject', 'fMin', 'fMax'].forEach((id) => {
    el(id).addEventListener('keydown', (e) => { if (e.key === 'Enter') loadGrades(); });
  });

  el('weekPrev').addEventListener('click', () => shiftWeek(-1));
  el('weekNext').addEventListener('click', () => shiftWeek(1));
  el('weekNow').addEventListener('click', () => {
    state.week = null;
    state.scheduleLoaded = false;
    loadSchedule();
  });

  el('rawGo').addEventListener('click', goRaw);
  el('rawPath').addEventListener('keydown', (e) => { if (e.key === 'Enter') goRaw(); });
}

bind();
enterApp();
