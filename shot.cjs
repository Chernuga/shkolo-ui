const { chromium } = require('playwright');
const path = require('path');

const GRADES = {
  subjectCount: 24, totalSubjectCount: 24, gradeCount: 25, average: 5.68,
  subjects: [
    { index: 1, subject: 'Български език и литература', term1: [{ value: '6', color: 'green' }, { value: '6', color: 'green' }], term2: [], annual: null, average: 6 },
    { index: 2, subject: 'Английски език', term1: [{ value: '5', color: 'blue' }], term2: [], annual: null, average: 5 },
    { index: 3, subject: 'Немски език', term1: [{ value: '6', color: 'green' }, { value: '6', color: 'green' }, { value: '6', color: 'green' }], term2: [], annual: null, average: 6 },
    { index: 4, subject: 'Математика', term1: [{ value: '5', color: 'blue' }], term2: [], annual: null, average: 5 },
    { index: 5, subject: 'Информационни технологии', term1: [{ value: '6', color: 'green' }], term2: [], annual: null, average: 6 },
    { index: 6, subject: 'История и цивилизации', term1: [{ value: '6', color: 'green' }], term2: [], annual: null, average: 6 },
    { index: 7, subject: 'География и икономика', term1: [{ value: '5', color: 'blue' }], term2: [], annual: null, average: 5 },
    { index: 8, subject: 'Химия и опазване на околната среда', term1: [{ value: '4', color: 'yellow' }], term2: [], annual: null, average: 4 }
  ]
};

const SCHEDULE = {
  week: 44, year: '26', dayCount: 5, lessonCount: 32,
  days: [
    { shortDay: 'Пон', date: '26.10.2026', freeHours: [6, 7, 8], lessons: [
      { hour: 1, subject: 'ГО 10 кл. (…)', teacher: 'Тихомир Д. Костовски', room: null, time: '08:00 - 08:45' },
      { hour: 2, subject: 'ГО 10 кл. (…)', teacher: 'Тихомир Д. Костовски', room: null, time: '08:45 - 09:30' },
      { hour: 3, subject: 'ГО 10 кл. (…)', teacher: 'Тихомир Д. Костовски', room: null, time: '09:50 - 10:35' }
    ]},
    { shortDay: 'Вто', date: '27.10.2026', freeHours: [7, 8], lessons: [
      { hour: 1, subject: 'Компютърни технологии', teacher: 'Славка Б. Бостанджиева', room: '57 (Блок 5)', time: '08:00 - 08:45' },
      { hour: 3, subject: 'География', teacher: 'Юлия Р. Симеонова', room: '34 (Етаж 3)', time: '09:50 - 10:35' },
      { hour: 5, subject: 'Философия', teacher: 'Иван К. Бозуков', room: '21 (Етаж 2)', time: '11:40 - 12:25' }
    ]},
    { shortDay: 'Сря', date: '28.10.2026', freeHours: [7, 8], lessons: [
      { hour: 1, subject: 'Английски език', teacher: 'Цветан В. Върбанов', room: '45 (Етаж 4)', time: '08:00 - 08:45' },
      { hour: 3, subject: 'Химия', teacher: 'Нели И. Димитрова', room: '53 (Блок 5)', time: '09:50 - 10:35' }
    ]},
    { shortDay: 'Чет', date: '29.10.2026', freeHours: [8], lessons: [
      { hour: 1, subject: 'Аналогова схемотехника', teacher: 'Бойка Л. Айкова (отсъства)', room: '25 (Етаж 2)', time: '08:00 - 08:45', free: true },
      { hour: 2, subject: 'Аналогова схемотехника', teacher: 'Бойка Л. Айкова (отсъства)', room: '25 (Етаж 2)', time: '08:45 - 09:30', free: true },
      { hour: 3, subject: 'Немски език', teacher: 'Славка И. Славчева', room: '26 (Етаж 2)', time: '09:50 - 10:35' },
      { hour: 5, subject: 'История', teacher: 'Антоанета Д. Георгиева', room: '33 (Етаж 3)', time: '11:40 - 12:25' }
    ]},
    { shortDay: 'Пет', date: '30.10.2026', freeHours: [], lessons: [
      { hour: 1, subject: 'БЕЛ', teacher: 'Йорданка Д. Славчева', room: '42 (Етаж 4)', time: '08:00 - 08:30' },
      { hour: 3, subject: 'ФВС', teacher: 'Живко Г. Иванов', room: '80 (Спортни 8)', time: '09:15 - 09:45' }
    ]}
  ]
};

function stub() {
  const resp = (o) => new Response(JSON.stringify(o), {
    headers: { 'content-type': 'application/json' },
  });
  window.fetch = async (u) => {
    const n = new URL(u, location.href).pathname;
    if (n.endsWith('/api/session')) return resp({ pupilId: '2600106129' });
    if (n.endsWith('/grades')) return resp(window.__G);
    if (n.endsWith('/schedule')) return resp(window.__S);
    return resp({ error: 'stub' });
  };
}

async function shoot(browser, width, height, name, clickView) {
  const page = await browser.newPage({ viewport: { width, height } });
  // Seed the stub payloads *before* any page script runs, then let init-script install fetch.
  await page.addInitScript(([g, s]) => {
    window.__G = g;
    window.__S = s;
    const resp = (o) => new Response(JSON.stringify(o), {
      headers: { 'content-type': 'application/json' },
    });
    window.fetch = async (u) => {
      const n = new URL(u, location.href).pathname;
      if (n.endsWith('/api/session')) return resp({ pupilId: '2600106129' });
      if (n.endsWith('/grades')) return resp(window.__G);
      if (n.endsWith('/schedule')) return resp(window.__S);
      return resp({ error: 'stub' });
    };
  }, [GRADES, SCHEDULE]);

  await page.goto('file:///' + path.join(process.cwd(), 'index.html').replace(/\\/g, '/') + '?v=' + Date.now());
  await page.waitForTimeout(700);
  if (clickView) {
    await page.click(`[data-view="${clickView}"]`);
    await page.waitForTimeout(600);
  }
  await page.screenshot({ path: name });
  await page.close();
}

(async () => {
  const browser = await chromium.launch();
  await shoot(browser, 1240, 800, 'preview-grades.png');
  await shoot(browser, 1240, 800, 'preview-schedule.png', 'schedule');
  await shoot(browser, 420, 860, 'preview-mobile.png');
  await browser.close();
  console.log('✓ previews written');
})().catch((e) => { console.error(e.message); process.exit(1); });
