// Root catch-all, multi-segment: /grades, /raw/diary, /raw/ajax/... ,
// /grades/subjects, etc. `[[path]]` (double brackets) matches any depth.
import { onRequest as proxy } from './_proxy-core.js';

export const onRequest = proxy;
