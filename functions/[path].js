// Root catch-all: /grades, /schedule, /raw/... (any path that is not a static asset)
import { onRequest as proxy } from './_proxy-core.js';

export const onRequest = proxy;
