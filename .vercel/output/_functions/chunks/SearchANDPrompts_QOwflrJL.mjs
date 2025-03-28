import { jsxDEV } from 'react/jsx-dev-runtime';
import { useState } from 'react';
import 'react-redux';

const SearchANDPrompts = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSection, setActiveSection] = useState("prompts");
  const SearchBar = () => /* @__PURE__ */ jsxDEV("div", { className: "p-4 border-b border-slate-200", children: /* @__PURE__ */ jsxDEV(
    "input",
    {
      type: "text",
      value: searchQuery,
      onChange: (e) => setSearchQuery(e.target.value),
      placeholder: "Search prompts and outputs...",
      className: "w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-blue-500"
    },
    void 0,
    false,
    {
      fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/SearchANDPrompts.jsx",
      lineNumber: 11,
      columnNumber: 13
    },
    undefined
  ) }, void 0, false, {
    fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/SearchANDPrompts.jsx",
    lineNumber: 10,
    columnNumber: 9
  }, undefined);
  const PromptsSection = () => /* @__PURE__ */ jsxDEV("div", { className: "h-full overflow-y-auto p-4", children: [
    /* @__PURE__ */ jsxDEV("h2", { className: "text-lg font-semibold mb-4", children: "Prompts" }, void 0, false, {
      fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/SearchANDPrompts.jsx",
      lineNumber: 24,
      columnNumber: 13
    }, undefined),
    /* @__PURE__ */ jsxDEV("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "p-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between items-start mb-2", children: [
          /* @__PURE__ */ jsxDEV("h3", { className: "font-medium", children: "Math Question Generator" }, void 0, false, {
            fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/SearchANDPrompts.jsx",
            lineNumber: 29,
            columnNumber: 25
          }, undefined),
          /* @__PURE__ */ jsxDEV("span", { className: "text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded", children: "Template" }, void 0, false, {
            fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/SearchANDPrompts.jsx",
            lineNumber: 30,
            columnNumber: 25
          }, undefined)
        ] }, void 0, true, {
          fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/SearchANDPrompts.jsx",
          lineNumber: 28,
          columnNumber: 21
        }, undefined),
        /* @__PURE__ */ jsxDEV("p", { className: "text-sm text-slate-600 mb-2", children: "Generates math questions with varying difficulty levels" }, void 0, false, {
          fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/SearchANDPrompts.jsx",
          lineNumber: 32,
          columnNumber: 21
        }, undefined),
        /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between items-center text-xs text-slate-500", children: [
          /* @__PURE__ */ jsxDEV("span", { children: "Used 24 times" }, void 0, false, {
            fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/SearchANDPrompts.jsx",
            lineNumber: 34,
            columnNumber: 25
          }, undefined),
          /* @__PURE__ */ jsxDEV("div", { className: "space-x-2", children: [
            /* @__PURE__ */ jsxDEV("button", { className: "text-blue-500 hover:text-blue-600", children: "Use" }, void 0, false, {
              fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/SearchANDPrompts.jsx",
              lineNumber: 36,
              columnNumber: 29
            }, undefined),
            /* @__PURE__ */ jsxDEV("button", { className: "text-slate-500 hover:text-slate-600", children: "Edit" }, void 0, false, {
              fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/SearchANDPrompts.jsx",
              lineNumber: 37,
              columnNumber: 29
            }, undefined)
          ] }, void 0, true, {
            fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/SearchANDPrompts.jsx",
            lineNumber: 35,
            columnNumber: 25
          }, undefined)
        ] }, void 0, true, {
          fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/SearchANDPrompts.jsx",
          lineNumber: 33,
          columnNumber: 21
        }, undefined)
      ] }, void 0, true, {
        fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/SearchANDPrompts.jsx",
        lineNumber: 27,
        columnNumber: 17
      }, undefined),
      /* @__PURE__ */ jsxDEV("div", { className: "p-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between items-start mb-2", children: [
          /* @__PURE__ */ jsxDEV("h3", { className: "font-medium", children: "Science Quiz Creator" }, void 0, false, {
            fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/SearchANDPrompts.jsx",
            lineNumber: 43,
            columnNumber: 25
          }, undefined),
          /* @__PURE__ */ jsxDEV("span", { className: "text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded", children: "Template" }, void 0, false, {
            fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/SearchANDPrompts.jsx",
            lineNumber: 44,
            columnNumber: 25
          }, undefined)
        ] }, void 0, true, {
          fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/SearchANDPrompts.jsx",
          lineNumber: 42,
          columnNumber: 21
        }, undefined),
        /* @__PURE__ */ jsxDEV("p", { className: "text-sm text-slate-600 mb-2", children: "Creates science quizzes for different topics" }, void 0, false, {
          fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/SearchANDPrompts.jsx",
          lineNumber: 46,
          columnNumber: 21
        }, undefined),
        /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between items-center text-xs text-slate-500", children: [
          /* @__PURE__ */ jsxDEV("span", { children: "Used 15 times" }, void 0, false, {
            fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/SearchANDPrompts.jsx",
            lineNumber: 48,
            columnNumber: 25
          }, undefined),
          /* @__PURE__ */ jsxDEV("div", { className: "space-x-2", children: [
            /* @__PURE__ */ jsxDEV("button", { className: "text-blue-500 hover:text-blue-600", children: "Use" }, void 0, false, {
              fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/SearchANDPrompts.jsx",
              lineNumber: 50,
              columnNumber: 29
            }, undefined),
            /* @__PURE__ */ jsxDEV("button", { className: "text-slate-500 hover:text-slate-600", children: "Edit" }, void 0, false, {
              fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/SearchANDPrompts.jsx",
              lineNumber: 51,
              columnNumber: 29
            }, undefined)
          ] }, void 0, true, {
            fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/SearchANDPrompts.jsx",
            lineNumber: 49,
            columnNumber: 25
          }, undefined)
        ] }, void 0, true, {
          fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/SearchANDPrompts.jsx",
          lineNumber: 47,
          columnNumber: 21
        }, undefined)
      ] }, void 0, true, {
        fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/SearchANDPrompts.jsx",
        lineNumber: 41,
        columnNumber: 17
      }, undefined)
    ] }, void 0, true, {
      fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/SearchANDPrompts.jsx",
      lineNumber: 25,
      columnNumber: 13
    }, undefined)
  ] }, void 0, true, {
    fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/SearchANDPrompts.jsx",
    lineNumber: 23,
    columnNumber: 9
  }, undefined);
  const GeneratedOutputsSection = () => /* @__PURE__ */ jsxDEV("div", { className: "h-full overflow-y-auto p-4", children: [
    /* @__PURE__ */ jsxDEV("h2", { className: "text-lg font-semibold mb-4", children: "Generated Outputs" }, void 0, false, {
      fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/SearchANDPrompts.jsx",
      lineNumber: 62,
      columnNumber: 13
    }, undefined),
    /* @__PURE__ */ jsxDEV("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "p-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between items-start mb-2", children: [
          /* @__PURE__ */ jsxDEV("h3", { className: "font-medium", children: "Math Quiz Set #1" }, void 0, false, {
            fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/SearchANDPrompts.jsx",
            lineNumber: 67,
            columnNumber: 25
          }, undefined),
          /* @__PURE__ */ jsxDEV("span", { className: "text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded", children: "New" }, void 0, false, {
            fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/SearchANDPrompts.jsx",
            lineNumber: 68,
            columnNumber: 25
          }, undefined)
        ] }, void 0, true, {
          fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/SearchANDPrompts.jsx",
          lineNumber: 66,
          columnNumber: 21
        }, undefined),
        /* @__PURE__ */ jsxDEV("p", { className: "text-sm text-slate-600 mb-2", children: 'Generated from: "Math Question Generator"' }, void 0, false, {
          fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/SearchANDPrompts.jsx",
          lineNumber: 70,
          columnNumber: 21
        }, undefined),
        /* @__PURE__ */ jsxDEV("div", { className: "text-xs text-slate-500 mb-2", children: "10 questions generated" }, void 0, false, {
          fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/SearchANDPrompts.jsx",
          lineNumber: 71,
          columnNumber: 21
        }, undefined),
        /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between items-center text-xs text-slate-500", children: [
          /* @__PURE__ */ jsxDEV("span", { children: "2 minutes ago" }, void 0, false, {
            fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/SearchANDPrompts.jsx",
            lineNumber: 73,
            columnNumber: 25
          }, undefined),
          /* @__PURE__ */ jsxDEV("div", { className: "space-x-2", children: [
            /* @__PURE__ */ jsxDEV("button", { className: "text-green-500 hover:text-green-600", children: "Export" }, void 0, false, {
              fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/SearchANDPrompts.jsx",
              lineNumber: 75,
              columnNumber: 29
            }, undefined),
            /* @__PURE__ */ jsxDEV("button", { className: "text-red-500 hover:text-red-600", children: "Delete" }, void 0, false, {
              fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/SearchANDPrompts.jsx",
              lineNumber: 76,
              columnNumber: 29
            }, undefined)
          ] }, void 0, true, {
            fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/SearchANDPrompts.jsx",
            lineNumber: 74,
            columnNumber: 25
          }, undefined)
        ] }, void 0, true, {
          fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/SearchANDPrompts.jsx",
          lineNumber: 72,
          columnNumber: 21
        }, undefined)
      ] }, void 0, true, {
        fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/SearchANDPrompts.jsx",
        lineNumber: 65,
        columnNumber: 17
      }, undefined),
      /* @__PURE__ */ jsxDEV("div", { className: "p-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between items-start mb-2", children: [
          /* @__PURE__ */ jsxDEV("h3", { className: "font-medium", children: "Physics Quiz Set" }, void 0, false, {
            fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/SearchANDPrompts.jsx",
            lineNumber: 82,
            columnNumber: 25
          }, undefined),
          /* @__PURE__ */ jsxDEV("span", { className: "text-xs bg-green-100 text-green-800 px-2 py-1 rounded", children: "Exported" }, void 0, false, {
            fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/SearchANDPrompts.jsx",
            lineNumber: 83,
            columnNumber: 25
          }, undefined)
        ] }, void 0, true, {
          fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/SearchANDPrompts.jsx",
          lineNumber: 81,
          columnNumber: 21
        }, undefined),
        /* @__PURE__ */ jsxDEV("p", { className: "text-sm text-slate-600 mb-2", children: 'Generated from: "Science Quiz Creator"' }, void 0, false, {
          fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/SearchANDPrompts.jsx",
          lineNumber: 85,
          columnNumber: 21
        }, undefined),
        /* @__PURE__ */ jsxDEV("div", { className: "text-xs text-slate-500 mb-2", children: "15 questions generated" }, void 0, false, {
          fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/SearchANDPrompts.jsx",
          lineNumber: 86,
          columnNumber: 21
        }, undefined),
        /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between items-center text-xs text-slate-500", children: [
          /* @__PURE__ */ jsxDEV("span", { children: "1 hour ago" }, void 0, false, {
            fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/SearchANDPrompts.jsx",
            lineNumber: 88,
            columnNumber: 25
          }, undefined),
          /* @__PURE__ */ jsxDEV("div", { className: "space-x-2", children: [
            /* @__PURE__ */ jsxDEV("button", { className: "text-blue-500 hover:text-blue-600", children: "View" }, void 0, false, {
              fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/SearchANDPrompts.jsx",
              lineNumber: 90,
              columnNumber: 29
            }, undefined),
            /* @__PURE__ */ jsxDEV("button", { className: "text-red-500 hover:text-red-600", children: "Delete" }, void 0, false, {
              fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/SearchANDPrompts.jsx",
              lineNumber: 91,
              columnNumber: 29
            }, undefined)
          ] }, void 0, true, {
            fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/SearchANDPrompts.jsx",
            lineNumber: 89,
            columnNumber: 25
          }, undefined)
        ] }, void 0, true, {
          fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/SearchANDPrompts.jsx",
          lineNumber: 87,
          columnNumber: 21
        }, undefined)
      ] }, void 0, true, {
        fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/SearchANDPrompts.jsx",
        lineNumber: 80,
        columnNumber: 17
      }, undefined)
    ] }, void 0, true, {
      fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/SearchANDPrompts.jsx",
      lineNumber: 63,
      columnNumber: 13
    }, undefined)
  ] }, void 0, true, {
    fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/SearchANDPrompts.jsx",
    lineNumber: 61,
    columnNumber: 9
  }, undefined);
  const SectionToggle = () => /* @__PURE__ */ jsxDEV("div", { className: "flex border-b border-slate-200", children: [
    /* @__PURE__ */ jsxDEV(
      "button",
      {
        className: `flex-1 px-4 py-2 text-center ${activeSection === "prompts" ? "border-b-2 border-blue-500 text-blue-500" : "text-slate-600"}`,
        onClick: () => setActiveSection("prompts"),
        children: "Prompts"
      },
      void 0,
      false,
      {
        fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/SearchANDPrompts.jsx",
        lineNumber: 102,
        columnNumber: 13
      },
      undefined
    ),
    /* @__PURE__ */ jsxDEV(
      "button",
      {
        className: `flex-1 px-4 py-2 text-center ${activeSection === "generated" ? "border-b-2 border-blue-500 text-blue-500" : "text-slate-600"}`,
        onClick: () => setActiveSection("generated"),
        children: "Generated Outputs"
      },
      void 0,
      false,
      {
        fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/SearchANDPrompts.jsx",
        lineNumber: 112,
        columnNumber: 13
      },
      undefined
    )
  ] }, void 0, true, {
    fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/SearchANDPrompts.jsx",
    lineNumber: 101,
    columnNumber: 9
  }, undefined);
  return /* @__PURE__ */ jsxDEV("div", { className: "h-full flex flex-col bg-slate-50", children: [
    /* @__PURE__ */ jsxDEV(SearchBar, {}, void 0, false, {
      fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/SearchANDPrompts.jsx",
      lineNumber: 127,
      columnNumber: 13
    }, undefined),
    /* @__PURE__ */ jsxDEV(SectionToggle, {}, void 0, false, {
      fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/SearchANDPrompts.jsx",
      lineNumber: 128,
      columnNumber: 13
    }, undefined),
    /* @__PURE__ */ jsxDEV("div", { className: "flex-1 overflow-hidden", children: activeSection === "prompts" ? /* @__PURE__ */ jsxDEV(PromptsSection, {}, void 0, false, {
      fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/SearchANDPrompts.jsx",
      lineNumber: 130,
      columnNumber: 48
    }, undefined) : /* @__PURE__ */ jsxDEV(GeneratedOutputsSection, {}, void 0, false, {
      fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/SearchANDPrompts.jsx",
      lineNumber: 130,
      columnNumber: 69
    }, undefined) }, void 0, false, {
      fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/SearchANDPrompts.jsx",
      lineNumber: 129,
      columnNumber: 13
    }, undefined)
  ] }, void 0, true, {
    fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/SearchANDPrompts.jsx",
    lineNumber: 126,
    columnNumber: 9
  }, undefined);
};

export { SearchANDPrompts as default };
