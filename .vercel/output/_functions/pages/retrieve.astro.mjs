import { c as createComponent, m as maybeRenderHead, d as renderComponent, r as renderTemplate } from '../chunks/astro/server_cUnz5K5q.mjs';
import 'kleur/colors';
export { renderers } from '../renderers.mjs';

const $$Retrieve = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${maybeRenderHead()}<div class="container mx-auto px-4 py-8"> <h1 class="text-3xl font-bold mb-6 text-center">Database Retrieval</h1> <div class="grid grid-cols-1 gap-8"> <div> <h2 class="text-2xl font-semibold mb-4">Retrieve Stored Cards</h2> ${renderComponent($$result, "DatabaseRetrievePanel", null, { "client:only": "react", "client:component-hydration": "only", "client:component-path": "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/DatabaseRetrievePanel", "client:component-export": "DatabaseRetrievePanel" })} </div> </div> </div>`;
}, "/Users/Henrykoo/Documents/redux_todo_in_astro/src/pages/retrieve.astro", void 0);

const $$file = "/Users/Henrykoo/Documents/redux_todo_in_astro/src/pages/retrieve.astro";
const $$url = "/retrieve";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Retrieve,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
