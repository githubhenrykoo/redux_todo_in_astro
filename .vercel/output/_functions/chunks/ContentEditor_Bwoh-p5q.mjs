import { jsxDEV } from 'react/jsx-dev-runtime';
import { useState, useEffect } from 'react';
import { c as cn } from './cn_CD0N1Wul.mjs';
import { useSelector } from 'react-redux';
import './utils_BdwD7BdC.mjs';

const ContentEditor = ({
  content = "",
  title = "Content Editor",
  isReadOnly = false,
  onChange,
  onSave,
  language = "Plain Text",
  className = "",
  showLineNumbers = true
}) => {
  const [localContent, setLocalContent] = useState(content);
  const contentLines = localContent.split("\n");
  const lineNumberWidth = contentLines.length.toString().length;
  const themeMode = useSelector((state) => {
    try {
      return state?.theme?.mode || "light";
    } catch (e) {
      return "light";
    }
  });
  const isDark = themeMode === "dark";
  useEffect(() => {
    setLocalContent(content);
  }, [content]);
  const handleContentChange = (e) => {
    const newContent = e.target.value;
    setLocalContent(newContent);
    onChange?.(newContent);
  };
  const handleKeyDown = (e) => {
    if (e.key === "s" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      onSave?.();
    }
  };
  return /* @__PURE__ */ jsxDEV("div", { className: cn("content-editor flex flex-col min-h-0 h-full", className), children: [
    /* @__PURE__ */ jsxDEV("div", { className: cn(
      "px-4 py-2 text-sm flex items-center justify-between flex-shrink-0 border-b",
      isDark ? "bg-neutral-900 text-white border-neutral-800" : "bg-white text-neutral-900 border-neutral-200"
    ), children: [
      /* @__PURE__ */ jsxDEV("span", { children: title }, void 0, false, {
        fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/ui/ContentEditor.tsx",
        lineNumber: 68,
        columnNumber: 9
      }, undefined),
      /* @__PURE__ */ jsxDEV("div", { className: "flex items-center space-x-2", children: [
        isReadOnly && /* @__PURE__ */ jsxDEV("span", { className: isDark ? "text-neutral-400" : "text-neutral-500", children: "Read Only" }, void 0, false, {
          fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/ui/ContentEditor.tsx",
          lineNumber: 71,
          columnNumber: 13
        }, undefined),
        !isReadOnly && onSave && /* @__PURE__ */ jsxDEV(
          "button",
          {
            onClick: onSave,
            className: cn(
              "px-2 py-1 text-xs rounded border-0 transition-colors",
              isDark ? "bg-neutral-800 text-white hover:bg-neutral-700" : "bg-neutral-100 text-neutral-900 hover:bg-neutral-200"
            ),
            children: "Save"
          },
          void 0,
          false,
          {
            fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/ui/ContentEditor.tsx",
            lineNumber: 76,
            columnNumber: 13
          },
          undefined
        )
      ] }, void 0, true, {
        fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/ui/ContentEditor.tsx",
        lineNumber: 69,
        columnNumber: 9
      }, undefined)
    ] }, void 0, true, {
      fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/ui/ContentEditor.tsx",
      lineNumber: 62,
      columnNumber: 7
    }, undefined),
    /* @__PURE__ */ jsxDEV("div", { className: cn(
      "flex-1 min-h-0 overflow-hidden relative",
      isDark ? "bg-neutral-900 text-white" : "bg-white text-neutral-900"
    ), children: [
      showLineNumbers && /* @__PURE__ */ jsxDEV(
        "div",
        {
          className: cn(
            "absolute left-0 top-0 bottom-0 select-none overflow-hidden border-r",
            isDark ? "bg-neutral-800 text-neutral-400 border-neutral-700" : "bg-neutral-100 text-neutral-500 border-neutral-200"
          ),
          style: { width: `${lineNumberWidth + 3}ch`, minWidth: "3ch" },
          children: /* @__PURE__ */ jsxDEV("div", { className: "h-full overflow-auto invisible-scrollbar", children: contentLines.map((_, idx) => /* @__PURE__ */ jsxDEV("div", { className: "px-2 text-right leading-6", children: idx + 1 }, idx, false, {
            fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/ui/ContentEditor.tsx",
            lineNumber: 109,
            columnNumber: 17
          }, undefined)) }, void 0, false, {
            fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/ui/ContentEditor.tsx",
            lineNumber: 107,
            columnNumber: 13
          }, undefined)
        },
        void 0,
        false,
        {
          fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/ui/ContentEditor.tsx",
          lineNumber: 98,
          columnNumber: 11
        },
        undefined
      ),
      /* @__PURE__ */ jsxDEV(
        "div",
        {
          className: "h-full overflow-auto",
          style: {
            marginLeft: showLineNumbers ? `${lineNumberWidth + 3}ch` : "0",
            minWidth: "0"
          },
          children: isReadOnly ? /* @__PURE__ */ jsxDEV("pre", { className: "font-mono text-sm p-4 whitespace-pre overflow-x-auto", children: /* @__PURE__ */ jsxDEV("code", { children: contentLines.map((line, idx) => /* @__PURE__ */ jsxDEV(
            "div",
            {
              className: cn(
                "leading-6",
                isDark ? "hover:bg-neutral-800" : "hover:bg-neutral-100"
              ),
              children: line || "\n"
            },
            idx,
            false,
            {
              fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/ui/ContentEditor.tsx",
              lineNumber: 129,
              columnNumber: 19
            },
            undefined
          )) }, void 0, false, {
            fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/ui/ContentEditor.tsx",
            lineNumber: 127,
            columnNumber: 15
          }, undefined) }, void 0, false, {
            fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/ui/ContentEditor.tsx",
            lineNumber: 126,
            columnNumber: 13
          }, undefined) : /* @__PURE__ */ jsxDEV(
            "textarea",
            {
              value: localContent,
              onChange: handleContentChange,
              onKeyDown: handleKeyDown,
              className: cn(
                "w-full h-full resize-none outline-none font-mono text-sm p-4",
                isDark ? "bg-neutral-900 text-white" : "bg-white text-neutral-900"
              ),
              spellCheck: false,
              autoCapitalize: "off",
              autoComplete: "off",
              autoCorrect: "off"
            },
            void 0,
            false,
            {
              fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/ui/ContentEditor.tsx",
              lineNumber: 144,
              columnNumber: 13
            },
            undefined
          )
        },
        void 0,
        false,
        {
          fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/ui/ContentEditor.tsx",
          lineNumber: 118,
          columnNumber: 9
        },
        undefined
      )
    ] }, void 0, true, {
      fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/ui/ContentEditor.tsx",
      lineNumber: 92,
      columnNumber: 7
    }, undefined),
    /* @__PURE__ */ jsxDEV("div", { className: cn(
      "px-4 py-1 text-xs flex items-center justify-between flex-shrink-0 border-t",
      isDark ? "bg-neutral-800 text-neutral-400 border-neutral-700" : "bg-neutral-100 text-neutral-500 border-neutral-200"
    ), children: [
      /* @__PURE__ */ jsxDEV("div", { children: [
        contentLines.length,
        " ",
        contentLines.length === 1 ? "line" : "lines"
      ] }, void 0, true, {
        fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/ui/ContentEditor.tsx",
        lineNumber: 170,
        columnNumber: 9
      }, undefined),
      /* @__PURE__ */ jsxDEV("div", { className: "flex space-x-4", children: [
        /* @__PURE__ */ jsxDEV("span", { children: language }, void 0, false, {
          fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/ui/ContentEditor.tsx",
          lineNumber: 174,
          columnNumber: 11
        }, undefined),
        /* @__PURE__ */ jsxDEV("span", { children: "UTF-8" }, void 0, false, {
          fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/ui/ContentEditor.tsx",
          lineNumber: 175,
          columnNumber: 11
        }, undefined)
      ] }, void 0, true, {
        fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/ui/ContentEditor.tsx",
        lineNumber: 173,
        columnNumber: 9
      }, undefined)
    ] }, void 0, true, {
      fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/ui/ContentEditor.tsx",
      lineNumber: 164,
      columnNumber: 7
    }, undefined)
  ] }, void 0, true, {
    fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/ui/ContentEditor.tsx",
    lineNumber: 60,
    columnNumber: 5
  }, undefined);
};

export { ContentEditor as C };
