// Pages Functions route: /config.js
// Exposes the Worker URL to the static front-end without hardcoding it.
export async function onRequest({ env }) {
  const base = (env.SHKOLO_API_BASE || '').replace(/\/+$/, '');
  return new Response(`window.SHKOLO_API_BASE = ${JSON.stringify(base)};\n`, {
    headers: {
      'content-type': 'application/javascript; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}
