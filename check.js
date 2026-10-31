// Small local sanity check for the static site (no browser needed).
const fs = require('fs');
const path = require('path');

const root = __dirname;
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const js = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');

const views = [...html.matchAll(/id="view-([a-z]+)"/g)].map((m) => m[1]);
const navViews = [...html.matchAll(/data-view="([a-z]+)"/g)].map((m) => m[1]);

const checks = [
  ['index.html has login form', html.includes('id="loginForm"')],
  ['config.js is included', html.includes('src="/config.js"')],
  ['app.js is included', html.includes('src="app.js"')],
  ['views rendered', views.length === 5],
  ['nav matches views', navViews.join() === views.join()],
  ['grades view exists', views.includes('grades')],
  ['schedule view exists', views.includes('schedule')],
  ['raw view exists', views.includes('raw')],
  ['css is dark', css.includes('#0b1220')],
  ['css has mobile rules', css.includes('@media (max-width: 860px)')],
  ['js handles 401', js.includes('res.status === 401')],
  ['js never reads localStorage for the password', !js.includes('localStorage.setItem(\'password\'')],
  ['js calls /grades', js.includes("'/grades'")],
  ['js calls /schedule', js.includes("'/schedule'")],
  ['js calls /raw/', js.includes("'/raw/'")],
];

let failed = 0;
for (const [name, ok] of checks) {
  console.log((ok ? '  ✓ ' : '  ✗ ') + name);
  if (!ok) failed++;
}

console.log(`\nindex.html ${html.length} B · app.js ${js.length} B · styles.css ${css.length} B`);
console.log(failed ? `\n${failed} check(s) failed` : '\n✓ all checks passed');
process.exit(failed ? 1 : 0);
