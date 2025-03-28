import { c as createComponent, d as renderComponent, r as renderTemplate } from '../chunks/astro/server_cUnz5K5q.mjs';
import 'kleur/colors';
import { $ as $$DefaultLayout } from '../chunks/DefaultLayout_Cd1nul8-.mjs';
export { renderers } from '../renderers.mjs';

const $$Page = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "DefaultLayout", $$DefaultLayout, { "title": "Redux Todo App" })}`;
}, "/Users/Henrykoo/Documents/redux_todo_in_astro/src/pages/Page.astro", void 0);

const $$file = "/Users/Henrykoo/Documents/redux_todo_in_astro/src/pages/Page.astro";
const $$url = "/Page";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	default: $$Page,
	file: $$file,
	url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
