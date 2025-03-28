import { c as createComponent, d as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_cUnz5K5q.mjs';
import 'kleur/colors';
import { $ as $$BaseLayout } from '../chunks/BaseLayout_DpAEEdhg.mjs';
export { renderers } from '../renderers.mjs';

const $$Offline = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": "You are offline" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="flex flex-col items-center justify-center min-h-screen p-4 text-center"> <h1 class="text-4xl font-bold mb-4">You are offline</h1> <p class="text-xl mb-8">Please check your internet connection and try again.</p> <div class="p-4 bg-gray-100 rounded-lg"> <p>Some features of this app are available offline. You can still:</p> <ul class="list-disc mt-2 ml-6 text-left"> <li>View previously loaded todos</li> <li>Add new todos (they will sync when you're back online)</li> <li>Mark todos as complete</li> </ul> </div> <button class="mt-8 px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors" onclick="window.location.href='/'">
Try again
</button> </div> ` })}`;
}, "/Users/Henrykoo/Documents/redux_todo_in_astro/src/pages/offline.astro", void 0);

const $$file = "/Users/Henrykoo/Documents/redux_todo_in_astro/src/pages/offline.astro";
const $$url = "/offline";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Offline,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
