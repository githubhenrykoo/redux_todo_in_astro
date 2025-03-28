import { jsxDEV } from 'react/jsx-dev-runtime';
import 'react';

function DemoRightPanel() {
  console.log("[DemoRightPanel] Rendering");
  return /* @__PURE__ */ jsxDEV("div", { style: {
    padding: "1rem",
    backgroundColor: "#f5f5f5",
    height: "100%",
    border: "1px solid #ddd"
  }, children: [
    /* @__PURE__ */ jsxDEV("h2", { style: { margin: "0 0 1rem 0", color: "#333" }, children: "Right Panel" }, void 0, false, {
      fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/DemoRightPanel.tsx",
      lineNumber: 13,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV("p", { style: { margin: "0.5rem 0", color: "#666" }, children: "This panel has a fixed width of 200px" }, void 0, false, {
      fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/DemoRightPanel.tsx",
      lineNumber: 14,
      columnNumber: 7
    }, this)
  ] }, void 0, true, {
    fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/DemoRightPanel.tsx",
    lineNumber: 7,
    columnNumber: 5
  }, this);
}

export { DemoRightPanel, DemoRightPanel as default };
