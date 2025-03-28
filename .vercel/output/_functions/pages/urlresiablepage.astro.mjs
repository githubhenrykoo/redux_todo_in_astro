import { c as createComponent, m as maybeRenderHead, d as renderComponent, r as renderTemplate } from '../chunks/astro/server_cUnz5K5q.mjs';
import 'kleur/colors';
import { jsxDEV } from 'react/jsx-dev-runtime';
import React, { useState } from 'react';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';
export { renderers } from '../renderers.mjs';

function UrlResizablePanel({
  urls = [],
  direction = "horizontal"
}) {
  const processUrl = (inputUrl) => {
    const youtubeWatchRegex = /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/;
    const youtubeWatchMatch = inputUrl.match(youtubeWatchRegex);
    if (youtubeWatchMatch && youtubeWatchMatch[1]) {
      return `https://www.youtube.com/embed/${youtubeWatchMatch[1]}`;
    }
    return inputUrl;
  };
  const renderNestedPanel = (config, currentDirection, depth = 0) => {
    if (typeof config === "string") {
      return renderSinglePanel(config);
    }
    if (Array.isArray(config)) {
      const nextDirection = depth % 2 === 0 ? "vertical" : "horizontal";
      const defaultSize = 100 / config.length;
      return /* @__PURE__ */ jsxDEV(
        PanelGroup,
        {
          direction: currentDirection,
          style: {
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: currentDirection === "horizontal" ? "row" : "column"
          },
          children: config.map((subConfig, index) => /* @__PURE__ */ jsxDEV(React.Fragment, { children: [
            /* @__PURE__ */ jsxDEV(
              Panel,
              {
                defaultSize,
                minSize: 10,
                maxSize: 90,
                style: {
                  backgroundColor: "#2d2d2d",
                  overflow: "hidden",
                  height: "100%",
                  width: "100%"
                },
                children: renderNestedPanel(subConfig, nextDirection, depth + 1)
              },
              void 0,
              false,
              {
                fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/urlResizablePanel.tsx",
                lineNumber: 60,
                columnNumber: 15
              },
              this
            ),
            index < config.length - 1 && /* @__PURE__ */ jsxDEV(
              PanelResizeHandle,
              {
                style: currentDirection === "horizontal" ? styles.resizeHandle : styles.verticalResizeHandle
              },
              void 0,
              false,
              {
                fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/urlResizablePanel.tsx",
                lineNumber: 74,
                columnNumber: 17
              },
              this
            )
          ] }, `panel-${depth}-${index}`, true, {
            fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/urlResizablePanel.tsx",
            lineNumber: 59,
            columnNumber: 13
          }, this))
        },
        void 0,
        false,
        {
          fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/urlResizablePanel.tsx",
          lineNumber: 49,
          columnNumber: 9
        },
        this
      );
    }
    return /* @__PURE__ */ jsxDEV("div", { children: "Invalid configuration" }, void 0, false, {
      fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/urlResizablePanel.tsx",
      lineNumber: 89,
      columnNumber: 12
    }, this);
  };
  const renderSinglePanel = (url) => {
    const [iframeError, setIframeError] = useState(false);
    const processedUrl = processUrl(url);
    const handleIframeError = () => {
      setIframeError(true);
    };
    if (iframeError) {
      return /* @__PURE__ */ jsxDEV("div", { style: styles.errorContainer, children: [
        /* @__PURE__ */ jsxDEV("p", { children: "Unable to embed the website directly." }, void 0, false, {
          fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/urlResizablePanel.tsx",
          lineNumber: 104,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ jsxDEV("div", { style: styles.buttonContainer, children: /* @__PURE__ */ jsxDEV(
          "a",
          {
            href: url,
            target: "_blank",
            rel: "noopener noreferrer",
            style: styles.link,
            children: "Open in New Tab"
          },
          void 0,
          false,
          {
            fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/urlResizablePanel.tsx",
            lineNumber: 106,
            columnNumber: 13
          },
          this
        ) }, void 0, false, {
          fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/urlResizablePanel.tsx",
          lineNumber: 105,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/urlResizablePanel.tsx",
        lineNumber: 103,
        columnNumber: 9
      }, this);
    }
    return /* @__PURE__ */ jsxDEV(
      "iframe",
      {
        src: processedUrl,
        width: "100%",
        height: "100%",
        frameBorder: "0",
        allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
        allowFullScreen: true,
        title: "Embedded Website",
        onError: handleIframeError
      },
      void 0,
      false,
      {
        fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/urlResizablePanel.tsx",
        lineNumber: 120,
        columnNumber: 7
      },
      this
    );
  };
  const styles = {
    panelContainer: {
      display: "flex",
      height: "100%",
      width: "100%",
      backgroundColor: "#1a1a1a"
    },
    errorContainer: {
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      height: "100%",
      width: "100%",
      backgroundColor: "#2d2d2d",
      color: "#ffffff",
      textAlign: "center",
      padding: "20px"
    },
    buttonContainer: {
      display: "flex",
      gap: "20px",
      marginTop: "20px"
    },
    link: {
      color: "#4da6ff",
      textDecoration: "underline",
      padding: "10px",
      backgroundColor: "#3a3a3a",
      borderRadius: "5px"
    },
    resizeHandle: {
      width: "4px",
      backgroundColor: "#404040",
      cursor: "col-resize"
    },
    verticalResizeHandle: {
      height: "4px",
      backgroundColor: "#404040",
      cursor: "row-resize"
    }
  };
  return /* @__PURE__ */ jsxDEV("div", { style: styles.panelContainer, children: renderNestedPanel(urls, direction) }, void 0, false, {
    fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/urlResizablePanel.tsx",
    lineNumber: 177,
    columnNumber: 5
  }, this);
}

const $$Urlresiablepage = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${maybeRenderHead()}<div style="height: 100vh; width: 100vw;"> ${renderComponent($$result, "UrlResizablePanel", UrlResizablePanel, { "urls": [
    "https://www.youtube.com/watch?v=1WWweyBaWZk",
    [
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      "https://www.youtube.com/watch?v=oHg5SJYRHA0"
    ],
    [
      "https://www.britannica.com/",
      [
        "https://en.wikipedia.org/wiki/Open_Library",
        "https://en.wikipedia.org/wiki/Digital_library"
      ]
    ]
  ], "direction": "horizontal", "client:load": true, "client:component-hydration": "load", "client:component-path": "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/urlResizablePanel", "client:component-export": "default" })} </div>`;
}, "/Users/Henrykoo/Documents/redux_todo_in_astro/src/pages/urlresiablepage.astro", void 0);

const $$file = "/Users/Henrykoo/Documents/redux_todo_in_astro/src/pages/urlresiablepage.astro";
const $$url = "/urlresiablepage";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Urlresiablepage,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
