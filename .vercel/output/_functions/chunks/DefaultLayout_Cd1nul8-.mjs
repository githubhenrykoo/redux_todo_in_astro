import { c as createComponent, a as createAstro, m as maybeRenderHead, g as addAttribute, s as spreadAttributes, d as renderComponent, b as renderScript, r as renderTemplate, f as renderHead, h as defineScriptVars } from './astro/server_cUnz5K5q.mjs';
import 'kleur/colors';
/* empty css                        */
import { b as store, _ as __variableDynamicImportRuntimeHelper, g as cn } from './utils_BdwD7BdC.mjs';
import { jsxDEV } from 'react/jsx-dev-runtime';
import React, { Suspense } from 'react';
import { Provider, useSelector } from 'react-redux';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';
import { TopBar } from './TopBar_BYBexgE8.mjs';
import { FaCode, FaSearch, FaBug, FaTerminal, FaCog } from 'react-icons/fa';
/* empty css                        */

const PanelContent = () => {
  const { panels } = useSelector((state) => state.panellayout);
  if (!panels) return /* @__PURE__ */ jsxDEV("div", { children: "Loading panels..." }, void 0, false, {
    fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/layouts/PanelGroupLayout.jsx",
    lineNumber: 8,
    columnNumber: 23
  }, undefined);
  const renderPanel = (config) => {
    const Component = React.lazy(
      () => (
        // Try both .tsx and .jsx extensions using Promise.any
        Promise.any([
          __variableDynamicImportRuntimeHelper((/* #__PURE__ */ Object.assign({"../components/panels/DatabaseRetrievePanel.tsx": () => import('./DatabaseRetrievePanel_ClzDMoKI.mjs'),"../components/panels/DemoLeftPanel.tsx": () => import('./DemoLeftPanel_DRcA3k5w.mjs'),"../components/panels/DemoMainPanel.tsx": () => import('./DemoMainPanel_CGBMGGfF.mjs'),"../components/panels/DemoRightPanel.tsx": () => import('./DemoRightPanel_xoBLA28t.mjs'),"../components/panels/PanelSystem.tsx": () => import('./PanelSystem_BEoXn74P.mjs'),"../components/panels/TopBar.tsx": () => import('./TopBar_BYBexgE8.mjs')})), `../components/panels/${config.type}.tsx`, 4).then((module) => {
            console.log(`Successfully loaded .tsx component for: ${config.type}`);
            return { default: module.default || module[config.type] };
          }),
          __variableDynamicImportRuntimeHelper((/* #__PURE__ */ Object.assign({"../components/panels/ActionLogPanelReact.jsx": () => import('./ActionLogPanelReact_CNm-UdTo.mjs'),"../components/panels/ContentDetailPanel.jsx": () => import('./ContentDetailPanel_DFitjRZF.mjs'),"../components/panels/GeneratePanel.jsx": () => import('./GeneratePanel_CouTBjBt.mjs'),"../components/panels/ItemDetailPanel.jsx": () => import('./ItemDetailPanel_DIbO4HUr.mjs'),"../components/panels/SearchANDPrompts.jsx": () => import('./SearchANDPrompts_QOwflrJL.mjs'),"../components/panels/SearchAndContent.jsx": () => import('./SearchAndContent_EairH3D9.mjs'),"../components/panels/SearchAndTodos.jsx": () => import('./SearchAndTodos_DVMAPM7C.mjs'),"../components/panels/chatbot.jsx": () => import('./chatbot_BJ6YyXaB.mjs'),"../components/panels/xterm.jsx": () => import('./xterm_D_yTOjhB.mjs')})), `../components/panels/${config.type}.jsx`, 4).then((module) => {
            console.log(`Successfully loaded .jsx component for: ${config.type}`);
            return { default: module.default || module[config.type] };
          })
        ]).catch((error) => {
          console.error(`Failed to load component for panel type: ${config.type}`, error);
          throw new Error(`No component found for panel type: ${config.type}`);
        })
      )
    );
    return /* @__PURE__ */ jsxDEV(Suspense, { fallback: /* @__PURE__ */ jsxDEV("div", { children: "Loading panel..." }, void 0, false, {
      fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/layouts/PanelGroupLayout.jsx",
      lineNumber: 29,
      columnNumber: 27
    }, undefined), children: /* @__PURE__ */ jsxDEV(Component, {}, void 0, false, {
      fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/layouts/PanelGroupLayout.jsx",
      lineNumber: 30,
      columnNumber: 9
    }, undefined) }, void 0, false, {
      fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/layouts/PanelGroupLayout.jsx",
      lineNumber: 29,
      columnNumber: 7
    }, undefined);
  };
  return /* @__PURE__ */ jsxDEV("div", { className: "h-full w-full overflow-hidden", children: /* @__PURE__ */ jsxDEV(PanelGroup, { direction: "horizontal", className: "h-full", children: [
    /* @__PURE__ */ jsxDEV(Panel, { defaultSize: panels.left.size, minSize: panels.left.minSize, children: renderPanel(panels.left) }, void 0, false, {
      fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/layouts/PanelGroupLayout.jsx",
      lineNumber: 38,
      columnNumber: 9
    }, undefined),
    /* @__PURE__ */ jsxDEV(PanelResizeHandle, { className: "w-1 bg-slate-200 hover:bg-slate-400 transition-colors" }, void 0, false, {
      fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/layouts/PanelGroupLayout.jsx",
      lineNumber: 42,
      columnNumber: 9
    }, undefined),
    /* @__PURE__ */ jsxDEV(Panel, { defaultSize: panels.middle.size, minSize: panels.middle.minSize, children: renderPanel(panels.middle) }, void 0, false, {
      fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/layouts/PanelGroupLayout.jsx",
      lineNumber: 44,
      columnNumber: 9
    }, undefined),
    /* @__PURE__ */ jsxDEV(PanelResizeHandle, { className: "w-1 bg-slate-200 hover:bg-slate-400 transition-colors" }, void 0, false, {
      fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/layouts/PanelGroupLayout.jsx",
      lineNumber: 48,
      columnNumber: 9
    }, undefined),
    /* @__PURE__ */ jsxDEV(Panel, { defaultSize: panels.right.size, minSize: panels.right.minSize, children: renderPanel(panels.right) }, void 0, false, {
      fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/layouts/PanelGroupLayout.jsx",
      lineNumber: 50,
      columnNumber: 9
    }, undefined)
  ] }, void 0, true, {
    fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/layouts/PanelGroupLayout.jsx",
    lineNumber: 37,
    columnNumber: 7
  }, undefined) }, void 0, false, {
    fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/layouts/PanelGroupLayout.jsx",
    lineNumber: 36,
    columnNumber: 5
  }, undefined);
};
const PanelGroupLayout = () => /* @__PURE__ */ jsxDEV(Provider, { store, children: /* @__PURE__ */ jsxDEV(PanelContent, {}, void 0, false, {
  fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/layouts/PanelGroupLayout.jsx",
  lineNumber: 60,
  columnNumber: 5
}, undefined) }, void 0, false, {
  fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/layouts/PanelGroupLayout.jsx",
  lineNumber: 59,
  columnNumber: 3
}, undefined);

const $$Astro$1 = createAstro();
const $$Sidebar = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$1, $$props, $$slots);
  Astro2.self = $$Sidebar;
  const { class: className, ...props } = Astro2.props;
  return renderTemplate`${maybeRenderHead()}<div${addAttribute(cn(
    "flex flex-col h-full bg-muted border-r border-neutral-200 dark:border-neutral-800",
    className
  ), "class")}${spreadAttributes(props)}> <div class="flex-1 flex flex-col justify-between py-4"> <div class="space-y-6"> <button id="todoLayoutBtn" class="flex items-center justify-center w-12 h-12 hover:bg-muted-foreground/10 transition-colors border-l-2 border-primary bg-muted"> ${renderComponent($$result, "FaCode", FaCode, { "className": "text-lg text-primary" })} </button> <div class="flex items-center justify-center w-12 h-12 hover:bg-muted-foreground/10 transition-colors"> ${renderComponent($$result, "FaSearch", FaSearch, { "className": "text-lg text-muted-foreground" })} </div> <div class="flex items-center justify-center w-12 h-12 hover:bg-muted-foreground/10 transition-colors"> ${renderComponent($$result, "FaBug", FaBug, { "className": "text-lg text-muted-foreground" })} </div> <button id="generateLayoutBtn" class="flex items-center justify-center w-12 h-12 hover:bg-muted-foreground/10 transition-colors"> ${renderComponent($$result, "FaTerminal", FaTerminal, { "className": "text-lg text-muted-foreground" })} </button> </div> <div> <div class="flex items-center justify-center w-12 h-12 hover:bg-muted-foreground/10 transition-colors"> ${renderComponent($$result, "FaCog", FaCog, { "className": "text-lg text-muted-foreground" })} </div> </div> </div> </div> ${renderScript($$result, "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/Sidebar.astro?astro&type=script&index=0&lang.ts")}`;
}, "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/Sidebar.astro", void 0);

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Astro = createAstro();
const $$DefaultLayout = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$DefaultLayout;
  const { title } = Astro2.props;
  const initialTheme = store.getState().theme?.mode || "light";
  return renderTemplate(_a || (_a = __template(['<html lang="en"', '> <head><meta charset="UTF-8"><meta name="description" content="Astro description"><meta name="viewport" content="width=device-width"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><meta name="generator"', "><title>", "</title><script>(function(){", "\n			// Ensure consistent theme on initial load\n			document.documentElement.classList.remove('light', 'dark');\n			document.documentElement.classList.add(initialTheme);\n		})();<\/script>", '</head> <body class="min-h-screen max-h-screen h-screen flex flex-col bg-background text-foreground antialiased"> <div class="flex-none h-14"> ', ' </div> <div class="flex-1 overflow-hidden"> <div class="flex h-full"> <div class="w-12 flex-none bg-muted border-r border-neutral-200 dark:border-neutral-800"> ', ' </div> <div class="flex-1 bg-background"> ', " </div> </div> </div> ", " </body></html>"])), addAttribute([initialTheme, "min-h-screen overflow-hidden"], "class:list"), addAttribute(Astro2.generator, "content"), title, defineScriptVars({ initialTheme }), renderHead(), renderComponent($$result, "TopBar", TopBar, { "client:load": true, "initial-theme": initialTheme, "client:component-hydration": "load", "client:component-path": "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/TopBar", "client:component-export": "default" }), renderComponent($$result, "Sidebar", $$Sidebar, {}), renderComponent($$result, "PanelGroupLayout", PanelGroupLayout, { "client:load": true, "client:component-hydration": "load", "client:component-path": "/Users/Henrykoo/Documents/redux_todo_in_astro/src/layouts/PanelGroupLayout", "client:component-export": "default" }), renderScript($$result, "/Users/Henrykoo/Documents/redux_todo_in_astro/src/layouts/DefaultLayout.astro?astro&type=script&index=0&lang.ts"));
}, "/Users/Henrykoo/Documents/redux_todo_in_astro/src/layouts/DefaultLayout.astro", void 0);

export { $$DefaultLayout as $ };
