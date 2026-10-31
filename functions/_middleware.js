// Cloudflare Pages middleware:
//   1. serve /config.js with the API base URL (set env SHKOLO_API_BASE)
//   2. let a same-origin login set the HttpOnly session cookie
export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);

  if (url.pathname === '/config.js') {
    const base = env.SHKOLO_API_BASE || '';
    return new Response(
      `window.SHKOLO_API_BASE = ${JSON.stringify(base)};\n`,
      { headers: { 'content-type': 'application/javascript; charset=utf-8' } }
    );
  }

  const response = await next();

  // The Worker sets a Secure, cross-site cookie on its own domain. When the
  // browser posts here, re-issue it as a same-origin cookie so fetch() on
  // api.shkolo.bg carries it.
  if (url.pathname === '/api/login') {
    const token = new URLSearchParams(await response.clone().text()).get('token');
    const headers = new Headers(response.headers);
    if (token) {
      headers.append(
        'set-cookie',
        `sk_sess=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=10800`
      );
    }
    return new Response(response.body, { status: response.status, headers });
  }

  return response;
}
