import { jsxDEV } from 'react/jsx-dev-runtime';
import { useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { j as setSearchQuery, k as selectFilteredTodos, r as removeTodo, m as selectTodo } from './utils_BdwD7BdC.mjs';
import { FiSearch, FiTrash2, FiFile, FiImage, FiCode, FiFileText } from 'react-icons/fi';
import { C as ContentTypeInterpreter } from './content_type_detector_J2ggYshD.mjs';

function SearchTodo() {
  const [searchInput, setSearchInput] = useState("");
  const dispatch = useDispatch();
  const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };
  const debouncedSearch = useCallback(
    debounce((query) => {
      dispatch(setSearchQuery(query));
    }, 300),
    [dispatch]
  );
  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchInput(query);
    debouncedSearch(query);
  };
  return /* @__PURE__ */ jsxDEV("div", { className: "mb-6", children: [
    /* @__PURE__ */ jsxDEV("label", { htmlFor: "search", className: "block text-sm font-medium text-foreground mb-2", children: "Search Items" }, void 0, false, {
      fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/SearchTodo.jsx",
      lineNumber: 37,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: "flex gap-2 items-center", children: [
      /* @__PURE__ */ jsxDEV(
        "input",
        {
          id: "search",
          type: "text",
          value: searchInput,
          onChange: handleSearch,
          placeholder: "Type to filter todos...",
          className: "flex-1 px-4 py-2 border border-neutral-200 dark:border-neutral-800 rounded-lg bg-card text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        },
        void 0,
        false,
        {
          fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/SearchTodo.jsx",
          lineNumber: 41,
          columnNumber: 9
        },
        this
      ),
      /* @__PURE__ */ jsxDEV(
        "button",
        {
          className: "bg-muted p-2 rounded-lg hover:bg-muted-foreground/10 transition-colors duration-200",
          onClick: () => debouncedSearch(searchInput),
          "aria-label": "Search",
          children: /* @__PURE__ */ jsxDEV(FiSearch, { className: "w-5 h-5 text-muted-foreground" }, void 0, false, {
            fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/SearchTodo.jsx",
            lineNumber: 54,
            columnNumber: 11
          }, this)
        },
        void 0,
        false,
        {
          fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/SearchTodo.jsx",
          lineNumber: 49,
          columnNumber: 9
        },
        this
      )
    ] }, void 0, true, {
      fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/SearchTodo.jsx",
      lineNumber: 40,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV("p", { className: "mt-1 text-sm text-muted-foreground", children: "Press enter or click the search icon to filter" }, void 0, false, {
      fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/SearchTodo.jsx",
      lineNumber: 57,
      columnNumber: 7
    }, this)
  ] }, void 0, true, {
    fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/SearchTodo.jsx",
    lineNumber: 36,
    columnNumber: 5
  }, this);
}

const contentInterpreter = new ContentTypeInterpreter();
const getContentIcon = (content) => {
  const { mimeType } = contentInterpreter.detectContentType(content);
  switch (mimeType) {
    case "text/plain":
      return /* @__PURE__ */ jsxDEV(FiFileText, { className: "w-5 h-5 text-muted-foreground" }, void 0, false, {
        fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/ToDos.jsx",
        lineNumber: 22,
        columnNumber: 14
      }, undefined);
    case "application/json":
      return /* @__PURE__ */ jsxDEV(FiCode, { className: "w-5 h-5 text-primary" }, void 0, false, {
        fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/ToDos.jsx",
        lineNumber: 24,
        columnNumber: 14
      }, undefined);
    case "image/jpeg":
    case "image/png":
    case "image/webp":
    case "image/gif":
      return /* @__PURE__ */ jsxDEV(FiImage, { className: "w-5 h-5 text-accent" }, void 0, false, {
        fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/ToDos.jsx",
        lineNumber: 29,
        columnNumber: 14
      }, undefined);
    default:
      return /* @__PURE__ */ jsxDEV(FiFile, { className: "w-5 h-5 text-muted-foreground/70" }, void 0, false, {
        fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/ToDos.jsx",
        lineNumber: 31,
        columnNumber: 14
      }, undefined);
  }
};
function ToDos() {
  const dispatch = useDispatch();
  const todos = useSelector(selectFilteredTodos);
  const handleRemove = (id) => {
    dispatch(removeTodo(id));
  };
  const handleSelect = (id) => {
    dispatch(selectTodo(id));
  };
  return /* @__PURE__ */ jsxDEV("div", { className: "mt-6", children: [
    /* @__PURE__ */ jsxDEV("h2", { className: "text-2xl font-bold mb-4 text-foreground", children: "Item Collection" }, void 0, false, {
      fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/ToDos.jsx",
      lineNumber: 49,
      columnNumber: 7
    }, this),
    !todos || todos.length === 0 ? /* @__PURE__ */ jsxDEV("div", { className: "text-center py-8 bg-muted rounded-lg", children: /* @__PURE__ */ jsxDEV("p", { className: "text-muted-foreground", children: "No todos found" }, void 0, false, {
      fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/ToDos.jsx",
      lineNumber: 52,
      columnNumber: 11
    }, this) }, void 0, false, {
      fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/ToDos.jsx",
      lineNumber: 51,
      columnNumber: 9
    }, this) : /* @__PURE__ */ jsxDEV("ul", { className: "space-y-3", children: todos.map((todo) => /* @__PURE__ */ jsxDEV(
      "li",
      {
        className: "group flex items-center justify-between p-4 bg-card border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer",
        onClick: () => handleSelect(todo.id),
        children: [
          /* @__PURE__ */ jsxDEV("div", { className: "flex items-center space-x-3", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "flex-shrink-0", children: getContentIcon(todo.content) }, void 0, false, {
              fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/ToDos.jsx",
              lineNumber: 63,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDEV("span", { className: "text-card-foreground", children: todo.content }, void 0, false, {
              fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/ToDos.jsx",
              lineNumber: 66,
              columnNumber: 17
            }, this)
          ] }, void 0, true, {
            fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/ToDos.jsx",
            lineNumber: 62,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDEV(
            "button",
            {
              onClick: (e) => {
                e.stopPropagation();
                handleRemove(todo.id);
              },
              className: "opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-destructive text-destructive-foreground px-2 py-1 rounded-md hover:bg-destructive/90 focus:outline-none focus:ring-2 focus:ring-destructive focus:ring-opacity-50",
              children: [
                /* @__PURE__ */ jsxDEV("span", { className: "sr-only", children: "Remove todo" }, void 0, false, {
                  fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/ToDos.jsx",
                  lineNumber: 75,
                  columnNumber: 17
                }, this),
                /* @__PURE__ */ jsxDEV(FiTrash2, { size: 16 }, void 0, false, {
                  fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/ToDos.jsx",
                  lineNumber: 76,
                  columnNumber: 17
                }, this)
              ]
            },
            void 0,
            true,
            {
              fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/ToDos.jsx",
              lineNumber: 68,
              columnNumber: 15
            },
            this
          )
        ]
      },
      todo.id,
      true,
      {
        fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/ToDos.jsx",
        lineNumber: 57,
        columnNumber: 13
      },
      this
    )) }, void 0, false, {
      fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/ToDos.jsx",
      lineNumber: 55,
      columnNumber: 9
    }, this)
  ] }, void 0, true, {
    fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/ToDos.jsx",
    lineNumber: 48,
    columnNumber: 5
  }, this);
}

const SearchAndTodos = () => {
  return /* @__PURE__ */ jsxDEV("div", { className: "flex flex-col h-full", children: [
    /* @__PURE__ */ jsxDEV("div", { className: "flex-shrink-0 p-4 border-b border-neutral-200 dark:border-neutral-800 bg-background", children: /* @__PURE__ */ jsxDEV(SearchTodo, {}, void 0, false, {
      fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/SearchAndTodos.jsx",
      lineNumber: 10,
      columnNumber: 9
    }, undefined) }, void 0, false, {
      fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/SearchAndTodos.jsx",
      lineNumber: 9,
      columnNumber: 7
    }, undefined),
    /* @__PURE__ */ jsxDEV("div", { className: "flex-1 overflow-auto p-4 bg-background", children: /* @__PURE__ */ jsxDEV(ToDos, {}, void 0, false, {
      fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/SearchAndTodos.jsx",
      lineNumber: 15,
      columnNumber: 9
    }, undefined) }, void 0, false, {
      fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/SearchAndTodos.jsx",
      lineNumber: 14,
      columnNumber: 7
    }, undefined)
  ] }, void 0, true, {
    fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/SearchAndTodos.jsx",
    lineNumber: 7,
    columnNumber: 5
  }, undefined);
};

export { SearchAndTodos as default };
