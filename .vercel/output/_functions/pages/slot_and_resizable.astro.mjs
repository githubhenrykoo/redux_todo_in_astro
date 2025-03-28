import { c as createComponent, d as renderComponent, r as renderTemplate, e as renderSlot, m as maybeRenderHead } from '../chunks/astro/server_cUnz5K5q.mjs';
import 'kleur/colors';
import { jsxDEV } from 'react/jsx-dev-runtime';
import React from 'react';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';
import 'clsx';
export { renderers } from '../renderers.mjs';

const panelGroupStyle = {
  display: "flex",
  height: "100%",
  width: "100%"
};
const panelStyle = {
  flex: 1,
  overflow: "hidden",
  position: "relative"
};
const panelResizeHandleStyle = {
  width: "10px",
  background: "#333",
  cursor: "col-resize"
};
const ReactResiableSlot = (props) => {
  console.log("ReactResiableSlot props:", props);
  const leftComponent = props.left;
  const middleComponent = props.middle;
  const rightComponent = props.right;
  console.log("Components:", {
    leftComponent,
    middleComponent,
    rightComponent
  });
  const panelComponents = [
    leftComponent,
    middleComponent,
    rightComponent
  ].filter(Boolean);
  console.log("Filtered panel components:", panelComponents);
  const panelCount = panelComponents.length;
  const defaultSize = panelCount > 0 ? Math.floor(100 / panelCount) : 33;
  return /* @__PURE__ */ jsxDEV(PanelGroup, { direction: "horizontal", style: panelGroupStyle, children: panelComponents.map((panelComponent, index) => {
    console.log(`Rendering panel ${index}:`, panelComponent);
    return /* @__PURE__ */ jsxDEV(React.Fragment, { children: [
      /* @__PURE__ */ jsxDEV(
        Panel,
        {
          defaultSize,
          minSize: 20,
          style: panelStyle,
          children: /* @__PURE__ */ jsxDEV("div", { style: {
            padding: "10px",
            backgroundColor: `hsl(${index * 60}, 50%, 80%)`,
            height: "100%"
          }, children: /* @__PURE__ */ jsxDEV("div", { dangerouslySetInnerHTML: { __html: panelComponent.props.value } }, void 0, false, {
            fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/ReactResiableSlot.jsx",
            lineNumber: 66,
            columnNumber: 17
          }, undefined) }, void 0, false, {
            fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/ReactResiableSlot.jsx",
            lineNumber: 60,
            columnNumber: 15
          }, undefined)
        },
        void 0,
        false,
        {
          fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/ReactResiableSlot.jsx",
          lineNumber: 55,
          columnNumber: 13
        },
        undefined
      ),
      index < panelComponents.length - 1 && /* @__PURE__ */ jsxDEV(PanelResizeHandle, { style: panelResizeHandleStyle }, void 0, false, {
        fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/ReactResiableSlot.jsx",
        lineNumber: 72,
        columnNumber: 15
      }, undefined)
    ] }, index, true, {
      fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/ReactResiableSlot.jsx",
      lineNumber: 54,
      columnNumber: 11
    }, undefined);
  }) }, void 0, false, {
    fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/ReactResiableSlot.jsx",
    lineNumber: 50,
    columnNumber: 5
  }, undefined);
};

const $$Resizablepanelsslot = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "ReactResiableSlot", ReactResiableSlot, { "client:load": true, "client:component-hydration": "load", "client:component-path": "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/ReactResiableSlot.jsx", "client:component-export": "default" }, { "left": ($$result2) => renderTemplate`${maybeRenderHead()}<div> ${renderSlot($$result2, $$slots["left"])} </div>`, "middle": ($$result2) => renderTemplate`<div> ${renderSlot($$result2, $$slots["middle"])} </div>`, "right": ($$result2) => renderTemplate`<div> ${renderSlot($$result2, $$slots["right"])} </div>` })}`;
}, "/Users/Henrykoo/Documents/redux_todo_in_astro/src/layouts/resizablepanelsslot.astro", void 0);

const $$DemoRightPanel = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${maybeRenderHead()}<div class="h-full w-full bg-gray-100 p-4"> <h2>Demo Right Panel</h2> ${renderSlot($$result, $$slots["default"])} </div>`;
}, "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/DemoRightPanel.astro", void 0);

const $$DemoMainPanel = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${maybeRenderHead()}<div class="h-full w-full bg-white p-4"> <h2>Demo Main Panel</h2> ${renderSlot($$result, $$slots["default"])} </div>`;
}, "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/DemoMainPanel.astro", void 0);

const $$DemoLeftPanel = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${maybeRenderHead()}<div class="h-full w-full bg-gray-50 p-4"> <h2>Demo Left Panel</h2> ${renderSlot($$result, $$slots["default"])} </div>`;
}, "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/DemoLeftPanel.astro", void 0);

const $$SlotAndResizable = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "ResizablePanelsSlot", $$Resizablepanelsslot, {}, { "left": ($$result2) => renderTemplate`${renderComponent($$result2, "DemoMainPanel", $$DemoMainPanel, { "slot": "left" })}`, "middle": ($$result2) => renderTemplate`${renderComponent($$result2, "DemoLeftPanel", $$DemoLeftPanel, { "slot": "middle" })}`, "right": ($$result2) => renderTemplate`${renderComponent($$result2, "DemoRightPanel", $$DemoRightPanel, { "slot": "right" })}` })}`;
}, "/Users/Henrykoo/Documents/redux_todo_in_astro/src/pages/slot_and_resizable.astro", void 0);

const $$file = "/Users/Henrykoo/Documents/redux_todo_in_astro/src/pages/slot_and_resizable.astro";
const $$url = "/slot_and_resizable";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$SlotAndResizable,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
