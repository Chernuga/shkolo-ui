// Render the app shell (grades + schedule) with stubbed API responses.
// Uses page.evaluate to stub fetch, so no local server or CORS is involved.
const { chromium } = require('playwright');
const path = require('path');

const here = __dirname;
const file = 'file:///' + path.join(here, 'index.html').replace(/\\/g, '/');

const grades = {
  subjectCount: 24, totalSubjectCount: 24, gradeCount: 25, average: 5.68,
  subjects: [
    { index: 1, subject: 'Български език и литература', term1: [{ value: '6', color: 'green' }, { value: '6', color: 'green' }], term2: [], annual: null, average: 6 },
    { index: 2, subject: 'Английски език', term1: [{ value: '5', color: 'blue' }], term2: [], annual: null, average: 5 },
    { index: 3, subject: 'Немски език', term1: [{ value: '6', color: 'green' }, { value: '6', color: 'green' }, { value: '6', color: 'green' }], term2: [], annual: null, average: 6 },
    { index: 4, subject: 'Математика', term1: [{ value: '5', color: 'blue' }], term2: [], annual: null, average: 5 },
    { index: 5, subject: 'Информационни технологии', term1: [{ value: '6', color: 'green' }], term2: [], annual: null, average: 6 },
    { index: 6, subject: 'История и цивилизации', term1: [{ value: '6', color: 'green' }], term2: [], annual: null, average: 6 },
    { index: 7, subject: 'География и икономика', term1: [{ value: '5', color: 'blue' }], term2: [], annual: null, average: 5 },
    { index: 8, subject: 'Философия', term1: [{ value: '5', color: 'blue' }], term2: [], annual: null, average: 5 },
    { index: 9, subject: 'Биология и здравно образование', term1: [{ value: '6', color: 'green' }, { value: '6', color: 'green' }], term2: [], annual: null, average: 6 },
    { index: 10, subject: 'Химия и опазване на околната среда', term1: [{ value: '4', color: 'yellow' }], term2: [], annual: null, average: 4 }
  ]
};

const schedule = {
  week: 44, year: '26', dayCount: 5, lessonCount: 32,
  days: [
    { shortDay: 'Пон', date: '26.10.2026', freeHours: [6, 7, 8], lessons: [
      { hour: 1, subject: 'ГО 10 кл. (…)', teacher: 'Тихомир Д. Костовски', room: null, time: '08:00 - 08:45', free: false },
      { hour: 2, subject: 'ГО 10 кл. (…)', teacher: 'Тихомир Д. Костовски', room: null, time: '08:45 - 09:30', free: false },
      { hour: 3, subject: 'ГО 10 кл. (…)', teacher: 'Тихомир Д. Костовски', room: null, time: '09:50 - 10:35', free: false }
    ] },
    { shortDay: 'Вто', date: '27.10.2026', freeHours: [7, 8], lessons: [
      { hour: 1, subject: 'Компютърни технологии', teacher: 'Славка Б. Бостанджиева', room: '57 (Блок 5)', time: '08:00 - 08:45', free: false },
      { hour: 3, subject: 'География', teacher: 'Юлия Р. Симеонова', room: '34 (Етаж 3)', time: '09:50 - 10:35', free: false },
      { hour: 5, subject: 'Философия', teacher: 'Иван К. Бозуков', room: '21 (Етаж 2)', time: '11:40 - 12:25', free: false }
    ] },
    { shortDay: 'Сря', date: '28.10.2026', freeHours: [7, 8], lessons: [
      { hour: 1, subject: 'Английски език', teacher: 'Цветан В. Върбанов', room: '45 (Етаж 4)', time: '08:00 - 08:45', free: false },
      { hour: 3, subject: 'Химия', teacher: 'Нели И. Димитрова', room: '53 (Блок 5)', time: '09:50 - 10:35', free: false }
    ] },
    { shortDay: 'Чет', date: '29.10.2026', freeHours: [8], lessons: [
      { hour: 1, subject: 'Аналогова схемотехника', teacher: 'Бойка Л. Айкова (отсъства)', room: '25 (Етаж 2)', time: '08:00 - 08:45', free: true },
      { hour: 2, subject: 'Аналогова схемотехника', teacher: 'Бойка Л. Айкова (отсъства)', room: '25 (Етаж 2)', time: '08:45 - 09:30', free: true },
      { hour: 3, subject: 'Немски език', teacher: 'Славка И. Славчева', room: '26 (Етаж 2)', time: '09:50 - 10:35', free: false },
      { hour: 5, subject: 'История', teacher: 'Антоанета Д. Георгиева', room: '33 (Етаж 3)', time: '11:40 - 12:25', free: false }
    ] },
    { shortDay: 'Пет', date: '30.10.2026', freeHours: [], lessons: [
      { hour: 1, subject: 'БЕЛ', teacher: 'Йорданка Д. Славчева', room: '42 (Етаж 4)', time: '08:00 - 08:30', free: false },
      { hour: 3, subject: 'ФВС', teacher: 'Живко Г. Иванов', room: '80 (Спортни 8)', time: '09:15 - 09:45', free: false },
      { hour: 5, subject: 'Биология', teacher: 'Светла Г. Антонова', room: '14 (Етаж 1)', time: '10:30 - 11:00', free: false }
    ] }
  ]
};

const STUB = (data) => `
  window.SHKOLO_API_BASE = '';
  const __resp = (body, status) => new Response(JSON.stringify(body), {
    status: status || 200, headers: { 'content-type': 'application/json' }
  });
  window.fetch = async (url, opts) => {
    const u = new URL(url, location.href);
    if (u.pathname === '/api/session') return __resp({ pupilId: '2600106129' });
    if (u.pathname === '/grades') return __resp(${JSON.stringify(data.grades)});
    if (u.pathname === '/schedule') return __resp(${JSON.stringify(data.schedule)});
    if (u.pathname === '/config.js') return new Response('window.SHKOLO_API_BASE="";', { headers: { 'content-type': 'application/javascript' } });
    return __resp({ error: 'stub: ' + u.pathname }, 404);
  };
`;

(async () => {
  const browser = await chromium.launch();

  async function open(width, height) {
    const page = await browser.newPage({ viewport: { width, height } });
    await page.addInitScript(STUB({ grades, schedule }));
    await page.goto(file);
    await page.waitForTimeout(600);
    return page;
  }

  const page = await open(1240, 800);
  await page.screenshot({ path: path.join(here, 'preview-grades.png') });

  await page.click('[data-view="schedule"]');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(here, 'preview-schedule.png') });

  const mobile = await open(420, 820);
  await mobile.screenshot({ path: path.join(here, 'preview-mobile.png') });

  await browser.close();
  console.log('✓ previews written');
})().catch((e) => { console.error(e.message); process.exit(1); });
