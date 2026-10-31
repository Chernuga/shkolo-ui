// /api/* — everything except login goes straight through to the Worker.
// (/api/login has its own file and wins over this catch-all.)
import { onRequest as proxy } from '../_proxy-core.js';

export const onRequest = proxy;
