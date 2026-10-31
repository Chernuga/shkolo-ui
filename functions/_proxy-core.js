// Transparent proxy for API + data calls.
//   /api/<anything>  -> <API_BASE>/api/<anything>
//   /grades, /schedule, /raw/... -> <API_BASE>/<path>
// Forwards the first-party session cookie and relays the response as-is.
//
// Registered for both the /api/* subfolder and the root catch-all so that a
// request can never fall through to index.html.

import { apiBase, jsonError } from './_lib.js';

async function proxy(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // Never proxy the static assets or the UI itself.
  if (
    url.pathname === '/' ||
    COMMON_ASSETS.has(url.pathname) ||
    url.pathname.endsWith('.html')
  ) {
    return context.next();
  }

  let base;
  try {
    base = apiBase(env);
  } catch (err) {
    return jsonError(err.message);
  }

  const headers = new Headers();
  const cookie = request.headers.get('cookie');
  if (cookie) headers.set('cookie', cookie);
  const accept = request.headers.get('accept');
  if (accept) headers.set('accept', accept);
  const ct = request.headers.get('content-type');
  if (ct) headers.set('content-type', ct);

  const init = { method: request.method, headers, redirect: 'manual' };
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = await request.arrayBuffer();
  }

  const upstream = await fetch(base + url.pathname + url.search, init);

  const out = new Headers(upstream.headers);
  out.delete('set-cookie');
  out.delete('content-encoding');
  out.delete('content-length');
  out.delete('transfer-encoding');

  return new Response(upstream.body, { status: upstream.status, headers: out });
}

const COMMON_ASSETS = new Set([
  '/index.html', '/app.js', '/styles.css', '/config.js',
  '/check.js', '/favicon.ico', '/robots.txt',
  '/preview-grades.png', '/preview-schedule.png', '/preview-mobile.png',
]);

export const onRequest = proxy;
