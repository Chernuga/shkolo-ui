// Pages proxy: no longer needed to expose the Worker URL because the app always
// talks to its own origin. Kept for /config-check.html diagnostics only.
export async function onRequest({ env }) {
  const base = (env.SHKOLO_API_BASE || '').replace(/\/+$/, '');
  return new Response(`window.SHKOLO_API_BASE = ${JSON.stringify(base)};\n`, {
    headers: {
      'content-type': 'application/javascript; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}
