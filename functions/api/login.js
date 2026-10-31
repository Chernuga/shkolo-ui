// Same-origin login proxy: /api/login -> <API_BASE>/api/login
// Keeps the session cookie first-party for this domain, so every other
// /api/* and data call (proxied by /api/_proxy) sends it automatically.

import { onRequest as shared } from './_api.js';

export const onRequest = async (context) => {
  if (context.request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const config = await shared(context);
  const { api: base } = await config.json();

  const upstream = await fetch(base + '/api/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: await context.request.text(),
  });

  const data = await upstream.json().catch(() => ({}));
  const headers = new Headers({ 'content-type': 'application/json; charset=utf-8' });

  if (data.token) {
    headers.append(
      'set-cookie',
      `sk_sess=${data.token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=10800`
    );
  }

  return new Response(JSON.stringify(data), { status: upstream.status, headers });
};
