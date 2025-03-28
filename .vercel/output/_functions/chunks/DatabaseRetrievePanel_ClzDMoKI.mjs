import { jsxDEV } from 'react/jsx-dev-runtime';
import { useState, useEffect } from 'react';
import './cryptoPolyfill_D9Y5yeZG.mjs';
import 'buffer';
import { useDispatch } from 'react-redux';
import { i as importCardFromDatabase, s as selectContent } from './utils_BdwD7BdC.mjs';

const DatabaseRetrievePanel = () => {
  const dispatch = useDispatch();
  const [cards, setCards] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [hashValue, setHashValue] = useState("");
  const [selectedCardHash, setSelectedCardHash] = useState(null);
  const fetchCards = async (params) => {
    try {
      setLoading(true);
      setError(null);
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append("page", params.page.toString());
      if (params.pageSize) queryParams.append("pageSize", params.pageSize.toString());
      if (params.search) queryParams.append("search", params.search);
      if (params.hash) queryParams.append("hash", params.hash);
      const response = await fetch(`/api/retrieve?${queryParams.toString()}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch cards");
      }
      const data = await response.json();
      setCards(data);
      setSelectedCardHash(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      console.error("Error fetching cards:", err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchCards({ page, pageSize });
  }, []);
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm) {
      setPage(1);
      fetchCards({ search: searchTerm, page: 1, pageSize });
    }
  };
  const handleHashLookup = (e) => {
    e.preventDefault();
    if (hashValue) {
      fetchCards({ hash: hashValue });
    }
  };
  const handlePageChange = (newPage) => {
    setPage(newPage);
    if (searchTerm) {
      fetchCards({ search: searchTerm, page: newPage, pageSize });
    } else {
      fetchCards({ page: newPage, pageSize });
    }
  };
  const handleSelectCard = (card) => {
    setSelectedCardHash(card.hash);
    dispatch(importCardFromDatabase({
      hash: card.hash,
      content: card.content,
      metadata: {},
      relationships: {
        parentHash: null,
        childHashes: [],
        relatedHashes: []
      }
    }));
    dispatch(selectContent(card.hash));
  };
  const formatDate = (dateString) => {
    if (!dateString) {
      return "N/A";
    }
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "N/A";
      }
      return date.toLocaleString();
    } catch (e) {
      return "N/A";
    }
  };
  const getCardTimestamp = (card) => {
    if (card.g_time) {
      return card.g_time;
    }
    if (typeof card.content === "object" && card.content !== null) {
      if (card.content.__stateTimestamp) {
        return card.content.__stateTimestamp;
      }
    }
    if (typeof card.content === "string") {
      try {
        const parsedContent = JSON.parse(card.content);
        if (parsedContent.__stateTimestamp) {
          return parsedContent.__stateTimestamp;
        }
      } catch (e) {
      }
    }
    return null;
  };
  const getSlidingPageNumbers = (currentPage, totalPages, windowSize = 5) => {
    const adjustedWindowSize = windowSize % 2 === 0 ? windowSize + 1 : windowSize;
    const halfWindow = Math.floor(adjustedWindowSize / 2);
    let startPage = Math.max(1, currentPage - halfWindow);
    let endPage = Math.min(totalPages, startPage + adjustedWindowSize - 1);
    if (endPage === totalPages) {
      startPage = Math.max(1, totalPages - adjustedWindowSize + 1);
    }
    const pages = [];
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return {
      pages,
      showStartEllipsis: startPage > 1,
      showEndEllipsis: endPage < totalPages
    };
  };
  return /* @__PURE__ */ jsxDEV("div", { className: "flex flex-col h-full max-h-full bg-background", children: [
    /* @__PURE__ */ jsxDEV("div", { className: "flex-none p-3 border-b border-neutral-200 dark:border-neutral-800", children: /* @__PURE__ */ jsxDEV("div", { className: "flex flex-col gap-2", children: [
      /* @__PURE__ */ jsxDEV("form", { onSubmit: handleSearch, className: "w-full", children: /* @__PURE__ */ jsxDEV("div", { className: "flex flex-wrap gap-2", children: [
        /* @__PURE__ */ jsxDEV(
          "input",
          {
            type: "text",
            value: searchTerm,
            onChange: (e) => setSearchTerm(e.target.value),
            placeholder: "Search by content...",
            className: "flex-1 min-w-0 px-3 py-1 border rounded text-sm"
          },
          void 0,
          false,
          {
            fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/DatabaseRetrievePanel.tsx",
            lineNumber: 214,
            columnNumber: 15
          },
          undefined
        ),
        /* @__PURE__ */ jsxDEV(
          "button",
          {
            type: "submit",
            className: "px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm whitespace-nowrap",
            disabled: loading,
            children: "Search"
          },
          void 0,
          false,
          {
            fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/DatabaseRetrievePanel.tsx",
            lineNumber: 221,
            columnNumber: 15
          },
          undefined
        )
      ] }, void 0, true, {
        fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/DatabaseRetrievePanel.tsx",
        lineNumber: 213,
        columnNumber: 13
      }, undefined) }, void 0, false, {
        fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/DatabaseRetrievePanel.tsx",
        lineNumber: 212,
        columnNumber: 11
      }, undefined),
      /* @__PURE__ */ jsxDEV("form", { onSubmit: handleHashLookup, className: "w-full", children: /* @__PURE__ */ jsxDEV("div", { className: "flex flex-wrap gap-2", children: [
        /* @__PURE__ */ jsxDEV(
          "input",
          {
            type: "text",
            value: hashValue,
            onChange: (e) => setHashValue(e.target.value),
            placeholder: "Lookup by hash...",
            className: "flex-1 min-w-0 px-3 py-1 border rounded text-sm"
          },
          void 0,
          false,
          {
            fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/DatabaseRetrievePanel.tsx",
            lineNumber: 233,
            columnNumber: 15
          },
          undefined
        ),
        /* @__PURE__ */ jsxDEV(
          "button",
          {
            type: "submit",
            className: "px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm whitespace-nowrap",
            disabled: loading,
            children: "Lookup"
          },
          void 0,
          false,
          {
            fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/DatabaseRetrievePanel.tsx",
            lineNumber: 240,
            columnNumber: 15
          },
          undefined
        )
      ] }, void 0, true, {
        fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/DatabaseRetrievePanel.tsx",
        lineNumber: 232,
        columnNumber: 13
      }, undefined) }, void 0, false, {
        fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/DatabaseRetrievePanel.tsx",
        lineNumber: 231,
        columnNumber: 11
      }, undefined)
    ] }, void 0, true, {
      fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/DatabaseRetrievePanel.tsx",
      lineNumber: 211,
      columnNumber: 9
    }, undefined) }, void 0, false, {
      fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/DatabaseRetrievePanel.tsx",
      lineNumber: 210,
      columnNumber: 7
    }, undefined),
    /* @__PURE__ */ jsxDEV("div", { className: "flex-none flex items-center justify-between p-2 border-b border-neutral-200 dark:border-neutral-800", children: [
      /* @__PURE__ */ jsxDEV(
        "button",
        {
          onClick: () => {
            setSearchTerm("");
            setHashValue("");
            setPage(1);
            fetchCards({ page: 1, pageSize });
          },
          className: "px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm",
          disabled: loading,
          children: "Reset"
        },
        void 0,
        false,
        {
          fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/DatabaseRetrievePanel.tsx",
          lineNumber: 254,
          columnNumber: 9
        },
        undefined
      ),
      /* @__PURE__ */ jsxDEV("div", { className: "flex items-center", children: [
        /* @__PURE__ */ jsxDEV("span", { className: "mr-2 text-sm", children: "Items:" }, void 0, false, {
          fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/DatabaseRetrievePanel.tsx",
          lineNumber: 268,
          columnNumber: 11
        }, undefined),
        /* @__PURE__ */ jsxDEV(
          "select",
          {
            value: pageSize,
            onChange: (e) => {
              const newSize = Number(e.target.value);
              setPageSize(newSize);
              setPage(1);
              if (searchTerm) {
                fetchCards({ search: searchTerm, page: 1, pageSize: newSize });
              } else {
                fetchCards({ page: 1, pageSize: newSize });
              }
            },
            className: "px-2 py-1 border rounded text-sm",
            children: [
              /* @__PURE__ */ jsxDEV("option", { value: "5", children: "5" }, void 0, false, {
                fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/DatabaseRetrievePanel.tsx",
                lineNumber: 284,
                columnNumber: 13
              }, undefined),
              /* @__PURE__ */ jsxDEV("option", { value: "10", children: "10" }, void 0, false, {
                fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/DatabaseRetrievePanel.tsx",
                lineNumber: 285,
                columnNumber: 13
              }, undefined),
              /* @__PURE__ */ jsxDEV("option", { value: "20", children: "20" }, void 0, false, {
                fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/DatabaseRetrievePanel.tsx",
                lineNumber: 286,
                columnNumber: 13
              }, undefined),
              /* @__PURE__ */ jsxDEV("option", { value: "50", children: "50" }, void 0, false, {
                fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/DatabaseRetrievePanel.tsx",
                lineNumber: 287,
                columnNumber: 13
              }, undefined)
            ]
          },
          void 0,
          true,
          {
            fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/DatabaseRetrievePanel.tsx",
            lineNumber: 269,
            columnNumber: 11
          },
          undefined
        )
      ] }, void 0, true, {
        fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/DatabaseRetrievePanel.tsx",
        lineNumber: 267,
        columnNumber: 9
      }, undefined)
    ] }, void 0, true, {
      fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/DatabaseRetrievePanel.tsx",
      lineNumber: 253,
      columnNumber: 7
    }, undefined),
    error && /* @__PURE__ */ jsxDEV("div", { className: "flex-none bg-red-100 border-l-4 border-red-500 text-red-700 p-2 text-sm", children: /* @__PURE__ */ jsxDEV("p", { children: error }, void 0, false, {
      fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/DatabaseRetrievePanel.tsx",
      lineNumber: 295,
      columnNumber: 11
    }, undefined) }, void 0, false, {
      fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/DatabaseRetrievePanel.tsx",
      lineNumber: 294,
      columnNumber: 9
    }, undefined),
    /* @__PURE__ */ jsxDEV("div", { className: "flex-1 overflow-y-auto", children: [
      loading && /* @__PURE__ */ jsxDEV("div", { className: "flex justify-center p-4", children: /* @__PURE__ */ jsxDEV("div", { className: "animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500" }, void 0, false, {
        fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/DatabaseRetrievePanel.tsx",
        lineNumber: 303,
        columnNumber: 13
      }, undefined) }, void 0, false, {
        fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/DatabaseRetrievePanel.tsx",
        lineNumber: 302,
        columnNumber: 11
      }, undefined),
      cards && cards.items.length > 0 ? /* @__PURE__ */ jsxDEV("div", { className: "p-4", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "mb-2", children: /* @__PURE__ */ jsxDEV("p", { className: "text-sm text-gray-700", children: [
          cards.retrievalMethod === "hash" ? "Card found by hash" : `Showing ${cards.items.length} of ${cards.total_items} cards`,
          cards.serverTimestamp && ` (as of ${formatDate(cards.serverTimestamp)})`
        ] }, void 0, true, {
          fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/DatabaseRetrievePanel.tsx",
          lineNumber: 311,
          columnNumber: 15
        }, undefined) }, void 0, false, {
          fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/DatabaseRetrievePanel.tsx",
          lineNumber: 310,
          columnNumber: 13
        }, undefined),
        /* @__PURE__ */ jsxDEV("div", { className: "space-y-2 mb-4", children: cards.items.map((card) => /* @__PURE__ */ jsxDEV(
          "div",
          {
            className: `border rounded p-3 cursor-pointer hover:bg-gray-50 ${selectedCardHash === card.hash ? "bg-blue-50 border-blue-300" : ""}`,
            onClick: () => handleSelectCard(card),
            children: [
              /* @__PURE__ */ jsxDEV("div", { className: "flex justify-between mb-1", children: [
                /* @__PURE__ */ jsxDEV("span", { className: "font-medium text-blue-600 text-sm", children: [
                  card.hash.substring(0, 8),
                  "..."
                ] }, void 0, true, {
                  fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/DatabaseRetrievePanel.tsx",
                  lineNumber: 327,
                  columnNumber: 21
                }, undefined),
                /* @__PURE__ */ jsxDEV("span", { className: "text-gray-500 text-xs", children: formatDate(getCardTimestamp(card)) }, void 0, false, {
                  fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/DatabaseRetrievePanel.tsx",
                  lineNumber: 330,
                  columnNumber: 21
                }, undefined)
              ] }, void 0, true, {
                fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/DatabaseRetrievePanel.tsx",
                lineNumber: 326,
                columnNumber: 19
              }, undefined),
              /* @__PURE__ */ jsxDEV("div", { className: "text-gray-700 text-sm truncate", children: typeof card.content === "object" ? "{...}" : String(card.content).substring(0, 60) }, void 0, false, {
                fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/DatabaseRetrievePanel.tsx",
                lineNumber: 334,
                columnNumber: 19
              }, undefined)
            ]
          },
          card.hash,
          true,
          {
            fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/DatabaseRetrievePanel.tsx",
            lineNumber: 321,
            columnNumber: 17
          },
          undefined
        )) }, void 0, false, {
          fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/DatabaseRetrievePanel.tsx",
          lineNumber: 319,
          columnNumber: 13
        }, undefined),
        cards.total_pages > 1 && /* @__PURE__ */ jsxDEV("div", { className: "flex justify-center items-center gap-1 text-sm", children: [
          /* @__PURE__ */ jsxDEV(
            "button",
            {
              onClick: () => handlePageChange(page - 1),
              disabled: !cards.has_previous,
              className: `px-2 py-1 rounded ${cards.has_previous ? "bg-blue-100 text-blue-800 hover:bg-blue-200" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`,
              children: "Prev"
            },
            void 0,
            false,
            {
              fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/DatabaseRetrievePanel.tsx",
              lineNumber: 346,
              columnNumber: 17
            },
            undefined
          ),
          getSlidingPageNumbers(page, cards.total_pages, 3).pages.map((pageNumber) => /* @__PURE__ */ jsxDEV(
            "button",
            {
              onClick: () => handlePageChange(pageNumber),
              className: `px-2 py-1 rounded ${pageNumber === page ? "bg-blue-500 text-white" : "bg-blue-100 text-blue-800 hover:bg-blue-200"}`,
              children: pageNumber
            },
            pageNumber,
            false,
            {
              fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/DatabaseRetrievePanel.tsx",
              lineNumber: 359,
              columnNumber: 19
            },
            undefined
          )),
          /* @__PURE__ */ jsxDEV(
            "button",
            {
              onClick: () => handlePageChange(page + 1),
              disabled: !cards.has_next,
              className: `px-2 py-1 rounded ${cards.has_next ? "bg-blue-100 text-blue-800 hover:bg-blue-200" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`,
              children: "Next"
            },
            void 0,
            false,
            {
              fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/DatabaseRetrievePanel.tsx",
              lineNumber: 372,
              columnNumber: 17
            },
            undefined
          )
        ] }, void 0, true, {
          fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/DatabaseRetrievePanel.tsx",
          lineNumber: 345,
          columnNumber: 15
        }, undefined)
      ] }, void 0, true, {
        fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/DatabaseRetrievePanel.tsx",
        lineNumber: 308,
        columnNumber: 11
      }, undefined) : !loading && /* @__PURE__ */ jsxDEV("div", { className: "text-center text-gray-500 p-4", children: cards ? "No cards found" : "Enter search terms or fetch cards" }, void 0, false, {
        fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/DatabaseRetrievePanel.tsx",
        lineNumber: 388,
        columnNumber: 13
      }, undefined)
    ] }, void 0, true, {
      fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/DatabaseRetrievePanel.tsx",
      lineNumber: 300,
      columnNumber: 7
    }, undefined)
  ] }, void 0, true, {
    fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/DatabaseRetrievePanel.tsx",
    lineNumber: 208,
    columnNumber: 5
  }, undefined);
};

export { DatabaseRetrievePanel };
