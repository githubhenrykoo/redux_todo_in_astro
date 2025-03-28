import { jsxDEV } from 'react/jsx-dev-runtime';
import { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { e as selectActionHistory, f as selectThemeMode } from './utils_BdwD7BdC.mjs';
import { FiFile, FiImage, FiCode, FiFileText } from 'react-icons/fi';
import { C as ContentTypeInterpreter } from './content_type_detector_J2ggYshD.mjs';
import { c as cn } from './cn_CD0N1Wul.mjs';

const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString();
};

const getActionText = (action) => {
  switch (action.type) {
    case 'ADD': return `Added item: "${action.content}"`;
    case 'REMOVE': return `Removed item: "${action.content}"`;
    case 'SELECT': return `Selected item: "${action.content}"`;
    default: return `Unknown action on: "${action.content}"`;
  }
};

const contentInterpreter = new ContentTypeInterpreter();
const getContentIcon = (content) => {
  const { mimeType } = contentInterpreter.detectContentType(content);
  switch (mimeType) {
    case "text/plain":
      return /* @__PURE__ */ jsxDEV(FiFileText, { className: "w-5 h-5 text-gray-600" }, void 0, false, {
        fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/ActionLogPanelReact.jsx",
        lineNumber: 17,
        columnNumber: 14
      }, undefined);
    case "application/json":
      return /* @__PURE__ */ jsxDEV(FiCode, { className: "w-5 h-5 text-blue-600" }, void 0, false, {
        fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/ActionLogPanelReact.jsx",
        lineNumber: 19,
        columnNumber: 14
      }, undefined);
    case "image/jpeg":
    case "image/png":
    case "image/webp":
    case "image/gif":
      return /* @__PURE__ */ jsxDEV(FiImage, { className: "w-5 h-5 text-green-600" }, void 0, false, {
        fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/ActionLogPanelReact.jsx",
        lineNumber: 24,
        columnNumber: 14
      }, undefined);
    default:
      return /* @__PURE__ */ jsxDEV(FiFile, { className: "w-5 h-5 text-gray-400" }, void 0, false, {
        fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/ActionLogPanelReact.jsx",
        lineNumber: 26,
        columnNumber: 14
      }, undefined);
  }
};
const ActionLogPanelReact = () => {
  const actionHistory = useSelector(selectActionHistory);
  const themeMode = useSelector(selectThemeMode);
  const [isDark, setIsDark] = useState(themeMode === "dark");
  const scrollRef = useRef(null);
  useEffect(() => {
    setIsDark(themeMode === "dark");
  }, [themeMode]);
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [actionHistory]);
  return /* @__PURE__ */ jsxDEV("div", { className: "flex flex-col h-full", children: [
    /* @__PURE__ */ jsxDEV("div", { className: cn(
      "flex-shrink-0 p-4 border-b",
      isDark ? "bg-neutral-900 text-white border-neutral-800" : "bg-white text-neutral-900 border-neutral-200"
    ), children: /* @__PURE__ */ jsxDEV("h1", { className: "text-xl font-bold", children: "Action History" }, void 0, false, {
      fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/ActionLogPanelReact.jsx",
      lineNumber: 57,
      columnNumber: 9
    }, undefined) }, void 0, false, {
      fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/ActionLogPanelReact.jsx",
      lineNumber: 51,
      columnNumber: 7
    }, undefined),
    /* @__PURE__ */ jsxDEV(
      "div",
      {
        ref: scrollRef,
        className: cn(
          "flex-1 overflow-auto p-4",
          isDark ? "bg-neutral-900" : "bg-white"
        ),
        children: /* @__PURE__ */ jsxDEV("div", { className: "space-y-2", children: actionHistory.length === 0 ? /* @__PURE__ */ jsxDEV("div", { className: "flex items-center justify-center h-full min-h-[100px]", children: /* @__PURE__ */ jsxDEV("p", { className: "text-gray-500", children: "No actions recorded yet" }, void 0, false, {
          fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/ActionLogPanelReact.jsx",
          lineNumber: 71,
          columnNumber: 15
        }, undefined) }, void 0, false, {
          fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/ActionLogPanelReact.jsx",
          lineNumber: 70,
          columnNumber: 13
        }, undefined) : actionHistory.slice().reverse().map((action) => /* @__PURE__ */ jsxDEV(
          "div",
          {
            className: "p-3 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors",
            children: [
              /* @__PURE__ */ jsxDEV("div", { className: "flex items-center space-x-2", children: [
                getContentIcon(action.content),
                /* @__PURE__ */ jsxDEV("p", { className: "text-sm text-gray-600", children: getActionText(action) }, void 0, false, {
                  fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/ActionLogPanelReact.jsx",
                  lineNumber: 81,
                  columnNumber: 19
                }, undefined)
              ] }, void 0, true, {
                fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/ActionLogPanelReact.jsx",
                lineNumber: 79,
                columnNumber: 17
              }, undefined),
              /* @__PURE__ */ jsxDEV("time", { className: "text-xs text-gray-400 mt-1 block", children: formatTimestamp(action.timestamp) }, void 0, false, {
                fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/ActionLogPanelReact.jsx",
                lineNumber: 83,
                columnNumber: 17
              }, undefined)
            ]
          },
          action.id,
          true,
          {
            fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/ActionLogPanelReact.jsx",
            lineNumber: 75,
            columnNumber: 15
          },
          undefined
        )) }, void 0, false, {
          fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/ActionLogPanelReact.jsx",
          lineNumber: 68,
          columnNumber: 9
        }, undefined)
      },
      void 0,
      false,
      {
        fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/ActionLogPanelReact.jsx",
        lineNumber: 61,
        columnNumber: 7
      },
      undefined
    )
  ] }, void 0, true, {
    fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/ActionLogPanelReact.jsx",
    lineNumber: 49,
    columnNumber: 5
  }, undefined);
};

export { ActionLogPanelReact as default };
