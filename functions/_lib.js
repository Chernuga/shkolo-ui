// Shared config helper for the Pages Functions.
// Reads SHKOLO_API_BASE, failing loudly instead of silently proxying nowhere.
export function apiBase(env) {
  const base = (env.SHKOLO_API_BASE || '').replace(/\/+$/, '');
  if (!base) {
    throw new Error('SHKOLO_API_BASE is not set for this Pages project.');
  }
  return base;
}

export function jsonError(message, status = 500) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}
