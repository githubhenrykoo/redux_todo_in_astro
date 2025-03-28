import { c as createComponent, d as renderComponent, r as renderTemplate, m as maybeRenderHead, b as renderScript } from '../chunks/astro/server_cUnz5K5q.mjs';
import 'kleur/colors';
import { $ as $$BaseLayout } from '../chunks/BaseLayout_DpAEEdhg.mjs';
export { renderers } from '../renderers.mjs';

const $$Callback = createComponent(async ($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$BaseLayout, { "title": "Authentication Callback" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="min-h-screen flex items-center justify-center"> <div class="text-center"> <h1 class="text-2xl font-semibold mb-4">Processing Authentication...</h1> <p class="text-gray-600">You will be redirected back automatically.</p> </div> </div> ${renderScript($$result2, "/Users/Henrykoo/Documents/redux_todo_in_astro/src/pages/callback.astro?astro&type=script&index=0&lang.ts")} ` })}`;
}, "/Users/Henrykoo/Documents/redux_todo_in_astro/src/pages/callback.astro", void 0);

const $$file = "/Users/Henrykoo/Documents/redux_todo_in_astro/src/pages/callback.astro";
const $$url = "/callback";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Callback,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
