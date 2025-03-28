import { jsxDEV, Fragment } from 'react/jsx-dev-runtime';
import { useState, useMemo, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { a as addContent, d as deleteContent } from './utils_BdwD7BdC.mjs';
import { C as ContentEditor } from './ContentEditor_Bwoh-p5q.mjs';

function ContentDetailPanel() {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const dispatch = useDispatch();
  const selectedHash = useSelector((state) => state?.content?.selectedHash);
  const cardsMap = useSelector((state) => state?.content?.cards || {});
  const selectedContentItem = useMemo(() => {
    if (selectedHash && cardsMap) {
      return Object.values(cardsMap).find((c) => c && c.hash === selectedHash) || null;
    }
    return null;
  }, [cardsMap, selectedHash]);
  const formatContent = (content) => {
    if (!content) return "";
    if (typeof content === "string") return content;
    if (typeof content === "object") {
      try {
        return JSON.stringify(content, null, 2);
      } catch (e) {
        console.error("Error stringifying content:", e);
      }
    }
    return String(content);
  };
  useEffect(() => {
    if (selectedContentItem) {
      setEditContent(formatContent(selectedContentItem.content));
      setIsEditing(false);
    } else {
      setEditContent("");
    }
  }, [selectedContentItem]);
  const handleContentChange = (newContent) => {
    setEditContent(newContent);
  };
  const handleSubmit = () => {
    if (editContent.trim()) {
      dispatch(addContent(editContent));
      setEditContent("");
      setIsEditing(false);
    }
  };
  const handleNewClick = () => {
    setIsEditing(true);
    setEditContent("");
  };
  const handleCancel = () => {
    if (selectedContentItem) {
      setEditContent(formatContent(selectedContentItem.content));
    }
    setIsEditing(false);
  };
  const handleDelete = () => {
    if (selectedContentItem?.hash) {
      dispatch(deleteContent(selectedContentItem.hash));
    }
  };
  const displayContent = isEditing ? editContent : formatContent(selectedContentItem?.content);
  return /* @__PURE__ */ jsxDEV("div", { className: "flex flex-col h-full max-h-full bg-background overflow-hidden", children: [
    /* @__PURE__ */ jsxDEV("div", { className: "flex-none flex justify-between items-center px-3 py-2 bg-muted border-b border-neutral-200 dark:border-neutral-800", children: [
      /* @__PURE__ */ jsxDEV("h2", { className: "text-base font-semibold text-foreground truncate max-w-[60%]", children: isEditing ? "Push New Content" : "Content Details" }, void 0, false, {
        fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/ContentDetailPanel.jsx",
        lineNumber: 102,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "flex gap-1 overflow-x-auto max-w-[40%]", children: [
        !isEditing && /* @__PURE__ */ jsxDEV(
          "button",
          {
            onClick: handleNewClick,
            className: "px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors whitespace-nowrap",
            children: "New"
          },
          void 0,
          false,
          {
            fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/ContentDetailPanel.jsx",
            lineNumber: 107,
            columnNumber: 13
          },
          this
        ),
        selectedContentItem && !isEditing && /* @__PURE__ */ jsxDEV(Fragment, { children: [
          /* @__PURE__ */ jsxDEV(
            "button",
            {
              onClick: () => setIsEditing(true),
              className: "px-2 py-1 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors whitespace-nowrap",
              children: "Edit"
            },
            void 0,
            false,
            {
              fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/ContentDetailPanel.jsx",
              lineNumber: 116,
              columnNumber: 15
            },
            this
          ),
          /* @__PURE__ */ jsxDEV(
            "button",
            {
              onClick: handleDelete,
              className: "px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors whitespace-nowrap",
              children: "Delete"
            },
            void 0,
            false,
            {
              fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/ContentDetailPanel.jsx",
              lineNumber: 122,
              columnNumber: 15
            },
            this
          )
        ] }, void 0, true, {
          fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/ContentDetailPanel.jsx",
          lineNumber: 115,
          columnNumber: 13
        }, this),
        isEditing && /* @__PURE__ */ jsxDEV(Fragment, { children: [
          /* @__PURE__ */ jsxDEV(
            "button",
            {
              onClick: handleCancel,
              className: "px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors whitespace-nowrap",
              children: "Cancel"
            },
            void 0,
            false,
            {
              fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/ContentDetailPanel.jsx",
              lineNumber: 132,
              columnNumber: 15
            },
            this
          ),
          /* @__PURE__ */ jsxDEV(
            "button",
            {
              onClick: handleSubmit,
              className: "px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors whitespace-nowrap",
              children: "Save"
            },
            void 0,
            false,
            {
              fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/ContentDetailPanel.jsx",
              lineNumber: 138,
              columnNumber: 15
            },
            this
          )
        ] }, void 0, true, {
          fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/ContentDetailPanel.jsx",
          lineNumber: 131,
          columnNumber: 13
        }, this)
      ] }, void 0, true, {
        fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/ContentDetailPanel.jsx",
        lineNumber: 105,
        columnNumber: 9
      }, this)
    ] }, void 0, true, {
      fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/ContentDetailPanel.jsx",
      lineNumber: 101,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: "flex-1 overflow-auto p-2", children: /* @__PURE__ */ jsxDEV("div", { className: "w-full h-full max-w-full", children: /* @__PURE__ */ jsxDEV(
      ContentEditor,
      {
        content: displayContent || "",
        onChange: handleContentChange,
        onSave: isEditing ? handleSubmit : void 0,
        title: isEditing ? "Edit Content" : "Content Viewer",
        isReadOnly: !isEditing,
        showLineNumbers: true,
        language: "Plain Text",
        className: "w-full h-full"
      },
      void 0,
      false,
      {
        fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/ContentDetailPanel.jsx",
        lineNumber: 152,
        columnNumber: 11
      },
      this
    ) }, void 0, false, {
      fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/ContentDetailPanel.jsx",
      lineNumber: 151,
      columnNumber: 9
    }, this) }, void 0, false, {
      fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/ContentDetailPanel.jsx",
      lineNumber: 150,
      columnNumber: 7
    }, this)
  ] }, void 0, true, {
    fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/ContentDetailPanel.jsx",
    lineNumber: 99,
    columnNumber: 5
  }, this);
}

export { ContentDetailPanel as default };
