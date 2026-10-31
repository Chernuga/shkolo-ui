export const onRequest = async (context) => {
  const { env } = context;
  const base = (env.SHKOLO_API_BASE || '').replace(/\/+$/, '');

  if (!base) {
    return new Response('SHKOLO_API_BASE is not set for this Pages project.', { status: 500 });
  }

  return Response.json({ ok: true, api: base });
};
