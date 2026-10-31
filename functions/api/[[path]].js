// /api/*, multi-segment: /api/health, /api/session, /api/logout.
// (/api/login has its own file and wins over this catch-all.)
import { onRequest as proxy } from '../_proxy-core.js';

export const onRequest = proxy;
