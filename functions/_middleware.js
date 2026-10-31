// Cloudflare Pages middleware — runs before routing.
//
// It only handles /config.js. Everything else is delegated: Pages prefers an
// exact static/functions match first, so index.html must not be served for
// /api/* — that is why the API routes are handled by their own functions
// (api/login.js, api/_proxy.js, [path].js) and this file never calls next()
// for them.

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);

  if (url.pathname === '/config.js') {
    const base = (env.SHKOLO_API_BASE || '').replace(/\/+$/, '');
    return new Response(`window.SHKOLO_API_BASE = ${JSON.stringify(base)};\n`, {
      headers: {
        'content-type': 'application/javascript; charset=utf-8',
        'cache-control': 'no-store',
      },
    });
  }

  return next();
}
