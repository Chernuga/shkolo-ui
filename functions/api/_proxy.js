// Transparent proxy for every other API call:
//   /api/<anything>       -> <API_BASE>/api/<anything>
//   /grades, /schedule…   -> <API_BASE>/<path>
// Forwards the first-party session cookie and relays the response as-is.

import { onRequest as shared } from './_api.js';

export const onRequest = async (context) => {
  const { request } = context;
  const url = new URL(request.url);
  const config = await shared(context);
  const { api: base } = await config.json();

  const target = base + url.pathname + url.search;

  const headers = new Headers();
  const cookie = request.headers.get('cookie');
  if (cookie) headers.set('cookie', cookie);
  const accept = request.headers.get('accept');
  if (accept) headers.set('accept', accept);

  const upstream = await fetch(target, {
    method: request.method,
    headers,
    redirect: 'manual',
  });

  // Relay status + body; drop hop-by-hop and cookie headers from upstream.
  const out = new Headers(upstream.headers);
  out.delete('set-cookie');
  out.delete('content-encoding');
  out.delete('content-length');
  out.delete('transfer-encoding');

  return new Response(upstream.body, { status: upstream.status, headers: out });
};
