import { jsxDEV } from 'react/jsx-dev-runtime';
import 'react';
import { useDispatch, useSelector } from 'react-redux';
import { h as setSearchQuery, s as selectContent, d as deleteContent } from './utils_BdwD7BdC.mjs';

const SearchContent = () => {
  const dispatch = useDispatch();
  const searchQuery = useSelector((state) => state.content.search.query);
  const handleSearchChange = (e) => {
    dispatch(setSearchQuery(e.target.value));
  };
  const handleClearSearch = () => {
    dispatch(setSearchQuery(""));
  };
  return /* @__PURE__ */ jsxDEV("div", { className: "flex items-center space-x-1", children: [
    /* @__PURE__ */ jsxDEV(
      "input",
      {
        type: "text",
        value: searchQuery,
        onChange: handleSearchChange,
        placeholder: "Search content...",
        className: "flex-1 p-1 text-sm border rounded"
      },
      void 0,
      false,
      {
        fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/SearchContent.jsx",
        lineNumber: 21,
        columnNumber: 7
      },
      undefined
    ),
    searchQuery && /* @__PURE__ */ jsxDEV(
      "button",
      {
        onClick: handleClearSearch,
        className: "px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded",
        children: "Clear"
      },
      void 0,
      false,
      {
        fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/SearchContent.jsx",
        lineNumber: 29,
        columnNumber: 9
      },
      undefined
    )
  ] }, void 0, true, {
    fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/SearchContent.jsx",
    lineNumber: 20,
    columnNumber: 5
  }, undefined);
};

const Content = () => {
  const dispatch = useDispatch();
  const { cards, search } = useSelector((state) => state.content);
  const contentCards = Object.values(cards);
  const searchQuery = search.query.toLowerCase();
  const truncateContent = (content, maxLength = 30) => {
    if (!content) return "No content";
    let contentString;
    if (typeof content === "object") {
      contentString = JSON.stringify(content);
    } else {
      contentString = String(content);
    }
    return contentString.length > maxLength ? contentString.substring(0, maxLength) + "..." : contentString;
  };
  const filteredContent = searchQuery ? contentCards.filter(
    (card) => card.content.toLowerCase().includes(searchQuery)
  ) : contentCards;
  const handleContentSelect = (hash) => {
    dispatch(selectContent(hash));
  };
  const handleContentDelete = (hash) => {
    dispatch(deleteContent(hash));
  };
  return /* @__PURE__ */ jsxDEV("div", { className: "h-full max-h-full overflow-y-auto dark:bg-neutral-900 dark:text-neutral-100", children: /* @__PURE__ */ jsxDEV("div", { className: "space-y-1 overflow-hidden", children: filteredContent.length === 0 ? /* @__PURE__ */ jsxDEV("p", { className: "text-sm text-gray-500 dark:text-neutral-500 text-center p-2", children: searchQuery ? `No content matches "${search.query}"` : "No content available" }, void 0, false, {
    fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/Content.jsx",
    lineNumber: 51,
    columnNumber: 11
  }, undefined) : filteredContent.map((card) => {
    if (!card) return null;
    const contentPreview = truncateContent(card.content);
    return /* @__PURE__ */ jsxDEV(
      "div",
      {
        className: `
                  flex flex-col p-1 border-b 
                  hover:bg-gray-100 dark:hover:bg-neutral-800
                  max-h-20 overflow-hidden
                `,
        children: [
          /* @__PURE__ */ jsxDEV(
            "div",
            {
              onClick: () => handleContentSelect(card.hash),
              className: "cursor-pointer text-sm mb-1 dark:text-neutral-100 break-words whitespace-normal max-h-10 overflow-hidden text-ellipsis",
              children: contentPreview
            },
            void 0,
            false,
            {
              fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/Content.jsx",
              lineNumber: 72,
              columnNumber: 17
            },
            undefined
          ),
          /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between items-center text-xs", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "text-gray-500 dark:text-neutral-500 truncate max-w-[50%]", children: [
              "Created: ",
              new Date(card.createdAt).toLocaleString()
            ] }, void 0, true, {
              fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/Content.jsx",
              lineNumber: 81,
              columnNumber: 19
            }, undefined),
            /* @__PURE__ */ jsxDEV("div", { children: /* @__PURE__ */ jsxDEV(
              "button",
              {
                onClick: () => handleContentDelete(card.hash),
                className: "text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-xs",
                children: "Delete"
              },
              void 0,
              false,
              {
                fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/Content.jsx",
                lineNumber: 85,
                columnNumber: 21
              },
              undefined
            ) }, void 0, false, {
              fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/Content.jsx",
              lineNumber: 84,
              columnNumber: 19
            }, undefined)
          ] }, void 0, true, {
            fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/Content.jsx",
            lineNumber: 80,
            columnNumber: 17
          }, undefined)
        ]
      },
      card.hash,
      true,
      {
        fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/Content.jsx",
        lineNumber: 63,
        columnNumber: 15
      },
      undefined
    );
  }) }, void 0, false, {
    fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/Content.jsx",
    lineNumber: 49,
    columnNumber: 7
  }, undefined) }, void 0, false, {
    fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/Content.jsx",
    lineNumber: 47,
    columnNumber: 5
  }, undefined);
};

const SearchAndContent = () => {
  return /* @__PURE__ */ jsxDEV("div", { className: "flex flex-col h-full max-h-full overflow-hidden bg-background", children: [
    /* @__PURE__ */ jsxDEV("div", { className: "flex-none p-3 border-b border-neutral-200 dark:border-neutral-800 bg-muted", children: /* @__PURE__ */ jsxDEV(SearchContent, {}, void 0, false, {
      fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/SearchAndContent.jsx",
      lineNumber: 12,
      columnNumber: 9
    }, undefined) }, void 0, false, {
      fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/SearchAndContent.jsx",
      lineNumber: 11,
      columnNumber: 7
    }, undefined),
    /* @__PURE__ */ jsxDEV("div", { className: "flex-1 overflow-auto p-2 bg-background", children: /* @__PURE__ */ jsxDEV(Content, {}, void 0, false, {
      fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/SearchAndContent.jsx",
      lineNumber: 17,
      columnNumber: 9
    }, undefined) }, void 0, false, {
      fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/SearchAndContent.jsx",
      lineNumber: 16,
      columnNumber: 7
    }, undefined)
  ] }, void 0, true, {
    fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/SearchAndContent.jsx",
    lineNumber: 9,
    columnNumber: 5
  }, undefined);
};

export { SearchAndContent as default };
