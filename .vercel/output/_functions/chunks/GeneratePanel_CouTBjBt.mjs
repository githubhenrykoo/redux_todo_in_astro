import { jsxDEV } from 'react/jsx-dev-runtime';
import { useState } from 'react';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';
import 'react-redux';

const GeneratePanel = () => {
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationLog, setGenerationLog] = useState([]);
  const PromptSelectionPanel = () => /* @__PURE__ */ jsxDEV("div", { className: "h-full flex flex-col p-4 bg-white", children: [
    /* @__PURE__ */ jsxDEV("h2", { className: "text-lg font-semibold mb-4", children: "Select Prompt" }, void 0, false, {
      fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/GeneratePanel.jsx",
      lineNumber: 13,
      columnNumber: 13
    }, undefined),
    /* @__PURE__ */ jsxDEV("div", { className: "flex-1 overflow-y-auto", children: /* @__PURE__ */ jsxDEV("div", { className: "space-y-3", children: ["Prompt 1", "Prompt 2", "Prompt 3"].map((prompt, index) => /* @__PURE__ */ jsxDEV(
      "div",
      {
        className: `p-3 rounded-lg cursor-pointer transition-colors ${selectedPrompt === prompt ? "bg-blue-50 border-2 border-blue-500" : "bg-slate-50 hover:bg-slate-100"}`,
        onClick: () => setSelectedPrompt(prompt),
        children: [
          /* @__PURE__ */ jsxDEV("h3", { className: "font-medium", children: prompt }, void 0, false, {
            fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/GeneratePanel.jsx",
            lineNumber: 29,
            columnNumber: 29
          }, undefined),
          /* @__PURE__ */ jsxDEV("p", { className: "text-sm text-slate-600", children: "Description of the prompt..." }, void 0, false, {
            fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/GeneratePanel.jsx",
            lineNumber: 30,
            columnNumber: 29
          }, undefined)
        ]
      },
      index,
      true,
      {
        fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/GeneratePanel.jsx",
        lineNumber: 20,
        columnNumber: 25
      },
      undefined
    )) }, void 0, false, {
      fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/GeneratePanel.jsx",
      lineNumber: 17,
      columnNumber: 17
    }, undefined) }, void 0, false, {
      fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/GeneratePanel.jsx",
      lineNumber: 16,
      columnNumber: 13
    }, undefined),
    /* @__PURE__ */ jsxDEV("div", { className: "mt-4 flex gap-2", children: /* @__PURE__ */ jsxDEV(
      "button",
      {
        className: `flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${selectedPrompt && !isGenerating ? "bg-blue-500 hover:bg-blue-600 text-white" : "bg-slate-200 text-slate-500 cursor-not-allowed"}`,
        disabled: !selectedPrompt || isGenerating,
        onClick: () => {
          setIsGenerating(true);
          setGenerationLog((prev) => [...prev, "Starting generation..."]);
        },
        children: isGenerating ? "Generating..." : "Generate Questions"
      },
      void 0,
      false,
      {
        fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/GeneratePanel.jsx",
        lineNumber: 38,
        columnNumber: 17
      },
      undefined
    ) }, void 0, false, {
      fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/GeneratePanel.jsx",
      lineNumber: 37,
      columnNumber: 13
    }, undefined)
  ] }, void 0, true, {
    fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/GeneratePanel.jsx",
    lineNumber: 12,
    columnNumber: 9
  }, undefined);
  const GenerationDetailsPanel = () => /* @__PURE__ */ jsxDEV("div", { className: "h-full flex flex-col p-4 bg-white", children: [
    /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between items-center mb-4", children: [
      /* @__PURE__ */ jsxDEV("h2", { className: "text-lg font-semibold", children: "Generation Progress" }, void 0, false, {
        fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/GeneratePanel.jsx",
        lineNumber: 61,
        columnNumber: 17
      }, undefined),
      isGenerating && /* @__PURE__ */ jsxDEV(
        "button",
        {
          className: "px-3 py-1 rounded bg-red-500 hover:bg-red-600 text-white text-sm transition-colors",
          onClick: () => {
            setIsGenerating(false);
            setGenerationLog((prev) => [...prev, "Generation cancelled"]);
          },
          children: "Cancel"
        },
        void 0,
        false,
        {
          fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/GeneratePanel.jsx",
          lineNumber: 63,
          columnNumber: 21
        },
        undefined
      )
    ] }, void 0, true, {
      fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/GeneratePanel.jsx",
      lineNumber: 60,
      columnNumber: 13
    }, undefined),
    /* @__PURE__ */ jsxDEV("div", { className: "flex-1 overflow-y-auto bg-slate-50 rounded-lg p-3", children: /* @__PURE__ */ jsxDEV("div", { className: "space-y-2", children: generationLog.map((log, index) => /* @__PURE__ */ jsxDEV(
      "div",
      {
        className: "text-sm font-mono p-2 bg-white rounded border border-slate-200",
        children: log
      },
      index,
      false,
      {
        fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/GeneratePanel.jsx",
        lineNumber: 80,
        columnNumber: 25
      },
      undefined
    )) }, void 0, false, {
      fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/GeneratePanel.jsx",
      lineNumber: 78,
      columnNumber: 17
    }, undefined) }, void 0, false, {
      fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/GeneratePanel.jsx",
      lineNumber: 77,
      columnNumber: 13
    }, undefined)
  ] }, void 0, true, {
    fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/GeneratePanel.jsx",
    lineNumber: 59,
    columnNumber: 9
  }, undefined);
  return /* @__PURE__ */ jsxDEV("div", { className: "h-full bg-slate-100", children: /* @__PURE__ */ jsxDEV(PanelGroup, { direction: "vertical", children: [
    /* @__PURE__ */ jsxDEV(Panel, { defaultSize: 40, minSize: 30, children: /* @__PURE__ */ jsxDEV(PromptSelectionPanel, {}, void 0, false, {
      fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/GeneratePanel.jsx",
      lineNumber: 97,
      columnNumber: 21
    }, undefined) }, void 0, false, {
      fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/GeneratePanel.jsx",
      lineNumber: 96,
      columnNumber: 17
    }, undefined),
    /* @__PURE__ */ jsxDEV(PanelResizeHandle, { className: "h-1 bg-slate-200 hover:bg-slate-400 transition-colors" }, void 0, false, {
      fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/GeneratePanel.jsx",
      lineNumber: 101,
      columnNumber: 17
    }, undefined),
    /* @__PURE__ */ jsxDEV(Panel, { minSize: 30, children: /* @__PURE__ */ jsxDEV(GenerationDetailsPanel, {}, void 0, false, {
      fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/GeneratePanel.jsx",
      lineNumber: 105,
      columnNumber: 21
    }, undefined) }, void 0, false, {
      fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/GeneratePanel.jsx",
      lineNumber: 104,
      columnNumber: 17
    }, undefined)
  ] }, void 0, true, {
    fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/GeneratePanel.jsx",
    lineNumber: 94,
    columnNumber: 13
  }, undefined) }, void 0, false, {
    fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/GeneratePanel.jsx",
    lineNumber: 93,
    columnNumber: 9
  }, undefined);
};

export { GeneratePanel as default };
