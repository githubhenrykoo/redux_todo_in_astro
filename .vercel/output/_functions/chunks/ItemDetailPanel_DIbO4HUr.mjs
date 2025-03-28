import { jsxDEV, Fragment } from 'react/jsx-dev-runtime';
import { useState, useMemo, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { a as addContent } from './utils_BdwD7BdC.mjs';
import { C as ContentEditor } from './ContentEditor_Bwoh-p5q.mjs';

function ItemDetailPanel() {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const dispatch = useDispatch();
  const selectedHash = useSelector((state) => state?.content?.selectedHash);
  const cards = useSelector((state) => state?.content?.cards || {});
  const selectedContentItem = useMemo(() => {
    return selectedHash ? cards[selectedHash] : null;
  }, [cards, selectedHash]);
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
  const displayContent = isEditing ? editContent : formatContent(selectedContentItem?.content);
  return /* @__PURE__ */ jsxDEV("div", { className: "flex flex-col h-full", children: [
    /* @__PURE__ */ jsxDEV("div", { className: "flex-shrink-0 flex justify-between items-center px-4 py-2 bg-gray-100 border-b", children: [
      /* @__PURE__ */ jsxDEV("h2", { className: "text-lg font-semibold text-gray-700", children: isEditing ? "Edit Content" : "Item Details" }, void 0, false, {
        fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/ItemDetailPanel.jsx",
        lineNumber: 89,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "flex gap-2", children: [
        !isEditing && /* @__PURE__ */ jsxDEV(
          "button",
          {
            onClick: handleNewClick,
            className: "px-4 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors",
            children: "New Item"
          },
          void 0,
          false,
          {
            fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/ItemDetailPanel.jsx",
            lineNumber: 94,
            columnNumber: 13
          },
          this
        ),
        selectedContentItem && !isEditing && /* @__PURE__ */ jsxDEV(
          "button",
          {
            onClick: () => setIsEditing(true),
            className: "px-4 py-1 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors",
            children: "Edit"
          },
          void 0,
          false,
          {
            fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/ItemDetailPanel.jsx",
            lineNumber: 102,
            columnNumber: 13
          },
          this
        ),
        isEditing && /* @__PURE__ */ jsxDEV(Fragment, { children: [
          /* @__PURE__ */ jsxDEV(
            "button",
            {
              onClick: handleCancel,
              className: "px-4 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors",
              children: "Cancel"
            },
            void 0,
            false,
            {
              fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/ItemDetailPanel.jsx",
              lineNumber: 111,
              columnNumber: 15
            },
            this
          ),
          /* @__PURE__ */ jsxDEV(
            "button",
            {
              onClick: handleSubmit,
              className: "px-4 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors",
              children: "Save"
            },
            void 0,
            false,
            {
              fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/ItemDetailPanel.jsx",
              lineNumber: 117,
              columnNumber: 15
            },
            this
          )
        ] }, void 0, true, {
          fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/ItemDetailPanel.jsx",
          lineNumber: 110,
          columnNumber: 13
        }, this)
      ] }, void 0, true, {
        fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/ItemDetailPanel.jsx",
        lineNumber: 92,
        columnNumber: 9
      }, this)
    ] }, void 0, true, {
      fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/ItemDetailPanel.jsx",
      lineNumber: 88,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: "flex-1 overflow-auto", children: /* @__PURE__ */ jsxDEV(
      ContentEditor,
      {
        content: displayContent || "",
        onChange: handleContentChange,
        onSave: isEditing ? handleSubmit : void 0,
        title: isEditing ? "Edit Content" : "Content Viewer",
        isReadOnly: !isEditing,
        showLineNumbers: true,
        language: "Plain Text",
        className: "h-full"
      },
      void 0,
      false,
      {
        fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/ItemDetailPanel.jsx",
        lineNumber: 130,
        columnNumber: 9
      },
      this
    ) }, void 0, false, {
      fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/ItemDetailPanel.jsx",
      lineNumber: 129,
      columnNumber: 7
    }, this)
  ] }, void 0, true, {
    fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/ItemDetailPanel.jsx",
    lineNumber: 86,
    columnNumber: 5
  }, this);
}

export { ItemDetailPanel as default };
