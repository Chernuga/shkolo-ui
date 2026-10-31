// POST /api/login -> <API_BASE>/api/login
// Re-issues the session token as a first-party HttpOnly cookie for this origin,
// so every subsequent fetch (carried by the proxy) is authenticated.

import { apiBase, jsonError } from '../_lib.js';

export const onRequest = async (context) => {
  const { request, env } = context;

  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', {
      status: 405,
      headers: { allow: 'POST' },
    });
  }

  let base;
  try {
    base = apiBase(env);
  } catch (err) {
    return jsonError(err.message);
  }

  const upstream = await fetch(base + '/api/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: await request.text(),
  });

  const text = await upstream.text();
  let data = {};
  try { data = JSON.parse(text); } catch (e) { /* keep raw below */ }

  const headers = new Headers({ 'content-type': 'application/json; charset=utf-8' });
  if (data.token) {
    headers.append(
      'set-cookie',
      `sk_sess=${data.token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=10800`
    );
  }

  return new Response(text, { status: upstream.status, headers });
};
