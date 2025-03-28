import { c as createComponent, a as createAstro, r as renderTemplate, b as renderScript, d as renderComponent, e as renderSlot, f as renderHead } from './astro/server_cUnz5K5q.mjs';
import 'kleur/colors';
/* empty css                                */

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Astro = createAstro();
const $$BaseLayout = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$BaseLayout;
  const { title } = Astro2.props;
  return renderTemplate(_a || (_a = __template(['<html lang="en"> <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>', '</title><!-- PWA Meta Tags --><meta name="description" content="A Todo application built with Astro and Redux"><meta name="theme-color" content="#ffffff"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="apple-touch-icon" href="/pwa-192x192.png"><link rel="manifest" href="/manifest.webmanifest"><!-- Manual Service Worker Registration --><script src="/sw-register.js"><\/script>', '</head> <body class="bg-background text-foreground"> ', " <!-- PWA update notification component --> ", " <!-- PWA install prompt component --> ", " ", "</body></html>"])), title, renderHead(), renderSlot($$result, $$slots["default"]), renderComponent($$result, "PwaUpdater", null, { "client:only": "react", "client:component-hydration": "only", "client:component-path": "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/PwaUpdater.jsx", "client:component-export": "default" }), renderComponent($$result, "InstallPwa", null, { "client:only": "react", "client:component-hydration": "only", "client:component-path": "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/InstallPwa.jsx", "client:component-export": "default" }), renderScript($$result, "/Users/Henrykoo/Documents/redux_todo_in_astro/src/layouts/BaseLayout.astro?astro&type=script&index=0&lang.ts"));
}, "/Users/Henrykoo/Documents/redux_todo_in_astro/src/layouts/BaseLayout.astro", void 0);

export { $$BaseLayout as $ };
