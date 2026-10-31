// Top-level proxy so the UI can call /grades, /schedule, /raw/... directly.
import { onRequest as proxy } from './api/_proxy.js';

export const onRequest = proxy;
