import { jsxDEV } from 'react/jsx-dev-runtime';
import 'react';

function DemoMainPanel() {
  console.log("[DemoMainPanel] Rendering");
  return /* @__PURE__ */ jsxDEV("div", { style: {
    padding: "1rem",
    backgroundColor: "#ffffff",
    height: "100%",
    border: "1px solid #ddd"
  }, children: [
    /* @__PURE__ */ jsxDEV("h2", { style: { margin: "0 0 1rem 0", color: "#333" }, children: "Main Panel" }, void 0, false, {
      fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/DemoMainPanel.tsx",
      lineNumber: 13,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV("p", { style: { margin: "0.5rem 0", color: "#666" }, children: "This panel takes up the remaining space" }, void 0, false, {
      fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/DemoMainPanel.tsx",
      lineNumber: 14,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV("div", { style: {
      marginTop: "1rem",
      padding: "1rem",
      backgroundColor: "#f5f5f5",
      borderRadius: "4px"
    }, children: Array(20).fill(0).map((_, i) => /* @__PURE__ */ jsxDEV("p", { style: { margin: "0.5rem 0", color: "#666" }, children: [
      "Main panel content line ",
      i + 1
    ] }, i, true, {
      fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/DemoMainPanel.tsx",
      lineNumber: 24,
      columnNumber: 11
    }, this)) }, void 0, false, {
      fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/DemoMainPanel.tsx",
      lineNumber: 17,
      columnNumber: 7
    }, this)
  ] }, void 0, true, {
    fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/DemoMainPanel.tsx",
    lineNumber: 7,
    columnNumber: 5
  }, this);
}

export { DemoMainPanel, DemoMainPanel as default };
