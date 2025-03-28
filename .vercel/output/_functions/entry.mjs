import { renderers } from './renderers.mjs';
import { a as actions } from './chunks/_noop-actions_CfKMStZn.mjs';
import { c as createExports } from './chunks/entrypoint_BuLwyWUs.mjs';
import { manifest } from './manifest_C4iKka8R.mjs';

const serverIslandMap = new Map();;

const _page0 = () => import('./pages/_image.astro.mjs');
const _page1 = () => import('./pages/api/get-card.astro.mjs');
const _page2 = () => import('./pages/api/retrieve.astro.mjs');
const _page3 = () => import('./pages/api/store-card.astro.mjs');
const _page4 = () => import('./pages/api/submit.astro.mjs');
const _page5 = () => import('./pages/api/update-card.astro.mjs');
const _page6 = () => import('./pages/auth-example.astro.mjs');
const _page7 = () => import('./pages/callback.astro.mjs');
const _page8 = () => import('./pages/communication.astro.mjs');
const _page9 = () => import('./pages/offline.astro.mjs');
const _page10 = () => import('./pages/page.astro.mjs');
const _page11 = () => import('./pages/resizablepage.astro.mjs');
const _page12 = () => import('./pages/retrieve.astro.mjs');
const _page13 = () => import('./pages/slot_and_resizable.astro.mjs');
const _page14 = () => import('./pages/urlresiablepage.astro.mjs');
const _page15 = () => import('./pages/index.astro.mjs');
const pageMap = new Map([
    ["node_modules/astro/dist/assets/endpoint/generic.js", _page0],
    ["src/pages/api/get-card.ts", _page1],
    ["src/pages/api/retrieve.ts", _page2],
    ["src/pages/api/store-card.ts", _page3],
    ["src/pages/api/submit.ts", _page4],
    ["src/pages/api/update-card.ts", _page5],
    ["src/pages/auth-example.astro", _page6],
    ["src/pages/callback.astro", _page7],
    ["src/pages/communication.astro", _page8],
    ["src/pages/offline.astro", _page9],
    ["src/pages/Page.astro", _page10],
    ["src/pages/resizablePage.astro", _page11],
    ["src/pages/retrieve.astro", _page12],
    ["src/pages/slot_and_resizable.astro", _page13],
    ["src/pages/urlresiablepage.astro", _page14],
    ["src/pages/index.astro", _page15]
]);

const _manifest = Object.assign(manifest, {
    pageMap,
    serverIslandMap,
    renderers,
    actions,
    middleware: () => import('./_noop-middleware.mjs')
});
const _args = {
    "middlewareSecret": "77ae801a-0177-44fc-a7e7-9b7dd8c8b4e4",
    "skewProtection": false
};
const _exports = createExports(_manifest, _args);
const __astrojsSsrVirtualEntry = _exports.default;

export { __astrojsSsrVirtualEntry as default, pageMap };
