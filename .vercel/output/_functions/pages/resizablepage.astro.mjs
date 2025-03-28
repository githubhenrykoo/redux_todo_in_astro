import { c as createComponent, r as renderTemplate, e as renderSlot, d as renderComponent, f as renderHead, h as defineScriptVars, g as addAttribute } from '../chunks/astro/server_cUnz5K5q.mjs';
import 'kleur/colors';
/* empty css                                */
import { jsxDEV } from 'react/jsx-dev-runtime';
import React, { Suspense } from 'react';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { b as store, g as cn, n as changeLayout, _ as __variableDynamicImportRuntimeHelper } from '../chunks/utils_BdwD7BdC.mjs';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';
import { configureStore } from '@reduxjs/toolkit';
/* empty css                                         */
export { renderers } from '../renderers.mjs';

const layouts = {"default":{"components":["DemoMainPanel",["SearchAndTodos",["DemoRightPanel","DemoRightPanel"],"DemoRightPanel"],"GeneratePanel"]},"compact":{"components":["DemoLeftPanel","SearchAndTodos","DemoRightPanel","SearchAndTodos","DemoRightPanel"]},"expanded":{"components":["DemoMainPanel",["SearchAndTodos","DemoRightPanel"],"SearchAndTodos"]},"minimal":{"components":["DatabaseRetrievePanel","ContentDetailPanel"]},"expandedtest":{"components":[["DemoMainPanel",["SearchAndTodos","DemoRightPanel","DemoRightPanel","DemoRightPanel","DemoRightPanel"],"SearchAndTodos","DemoMainPanel",["SearchAndTodos","DemoRightPanel"],"SearchAndTodos"],"DemoMainPanel",["SearchAndTodos","DemoRightPanel","DemoRightPanel","DemoRightPanel","DemoRightPanel"],"SearchAndTodos","DemoMainPanel",["SearchAndTodos","DemoRightPanel"],"SearchAndTodos","DemoMainPanel",["SearchAndTodos","DemoRightPanel","DemoRightPanel","DemoRightPanel","DemoRightPanel"],"SearchAndTodos","DemoMainPanel",["SearchAndTodos","DemoRightPanel"],"SearchAndTodos","DemoMainPanel",["SearchAndTodos","DemoRightPanel","DemoRightPanel","DemoRightPanel","DemoRightPanel"],"SearchAndTodos","DemoMainPanel",["SearchAndTodos","DemoRightPanel"],"SearchAndTodos","DemoMainPanel",["SearchAndTodos","DemoRightPanel","DemoRightPanel","DemoRightPanel","DemoRightPanel"],"SearchAndTodos","DemoMainPanel",["SearchAndTodos","DemoRightPanel"],"SearchAndTodos","DemoMainPanel",["SearchAndTodos","DemoRightPanel","DemoRightPanel","DemoRightPanel","DemoRightPanel"],"SearchAndTodos","DemoMainPanel",["SearchAndTodos","DemoRightPanel"],"SearchAndTodos","DemoMainPanel",["SearchAndTodos","DemoRightPanel","DemoRightPanel","DemoRightPanel","DemoRightPanel"],"SearchAndTodos","DemoMainPanel",["SearchAndTodos","DemoRightPanel"],"SearchAndTodos"]},"expandedtesttwo":{"components":["SearchAndTodos","DemoMainPanel",["SearchAndTodos","DemoRightPanel"],"SearchAndTodos"]},"test2":{"components":[["SearchAndTodos","DemoRightPanel"]]}};
const resizeableConfig = {
  layouts,
};

const JsonSidebarContent = () => {
  const dispatch = useDispatch();
  const layoutNames = Object.keys(resizeableConfig.layouts);
  const currentLayout = useSelector((state) => state.resizeable?.currentLayout || layoutNames[0]);
  const handleLayoutChange = (layout) => {
    dispatch(changeLayout(layout));
  };
  return /* @__PURE__ */ jsxDEV("div", { className: "flex flex-col h-screen bg-muted border-r border-neutral-200 dark:border-neutral-800 p-4", children: [
    /* @__PURE__ */ jsxDEV("h2", { className: "text-lg font-bold mb-6 text-center", children: "Layouts" }, void 0, false, {
      fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/JsonSidebar.tsx",
      lineNumber: 19,
      columnNumber: 7
    }, undefined),
    /* @__PURE__ */ jsxDEV("div", { className: "flex-1 flex flex-col space-y-4", children: layoutNames.map((layout, index) => /* @__PURE__ */ jsxDEV(
      "button",
      {
        "data-layout": layout,
        onClick: () => handleLayoutChange(layout),
        className: cn(
          "text-left px-4 py-2 rounded transition-colors duration-200",
          currentLayout === layout ? "bg-primary text-primary-foreground" : "hover:bg-muted-foreground/10 text-muted-foreground"
        ),
        children: layout.charAt(0).toUpperCase() + layout.slice(1)
      },
      layout,
      false,
      {
        fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/JsonSidebar.tsx",
        lineNumber: 22,
        columnNumber: 11
      },
      undefined
    )) }, void 0, false, {
      fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/JsonSidebar.tsx",
      lineNumber: 20,
      columnNumber: 7
    }, undefined)
  ] }, void 0, true, {
    fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/JsonSidebar.tsx",
    lineNumber: 18,
    columnNumber: 5
  }, undefined);
};
const JsonSidebar = () => {
  return /* @__PURE__ */ jsxDEV(Provider, { store, children: /* @__PURE__ */ jsxDEV(JsonSidebarContent, {}, void 0, false, {
    fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/JsonSidebar.tsx",
    lineNumber: 44,
    columnNumber: 7
  }, undefined) }, void 0, false, {
    fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/JsonSidebar.tsx",
    lineNumber: 43,
    columnNumber: 5
  }, undefined);
};

function IslandFactory({ component: Component, sliceName, slot, ...props }) {
  console.log(`[IslandFactory] Rendering for slice: ${sliceName}, slot: ${slot}, component:`, Component?.name);
  if (!Component) {
    console.error("[IslandFactory] No component provided!");
    return null;
  }
  const store = configureStore({
    reducer: {
      [sliceName]: (state = {}, action) => state
      // Placeholder reducer
    }
  });
  try {
    return /* @__PURE__ */ jsxDEV(Provider, { store, children: /* @__PURE__ */ jsxDEV("div", { "data-slice": sliceName, "data-slot": slot, style: { height: "100%" }, children: /* @__PURE__ */ jsxDEV(Component, { ...props }, void 0, false, {
      fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/factories/IslandFactory.tsx",
      lineNumber: 32,
      columnNumber: 11
    }, this) }, void 0, false, {
      fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/factories/IslandFactory.tsx",
      lineNumber: 31,
      columnNumber: 9
    }, this) }, void 0, false, {
      fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/factories/IslandFactory.tsx",
      lineNumber: 30,
      columnNumber: 7
    }, this);
  } catch (error) {
    console.error("[IslandFactory] Error rendering component:", error);
    return /* @__PURE__ */ jsxDEV("div", { style: {
      padding: "1rem",
      color: "red",
      backgroundColor: "#fee",
      border: "1px solid #fcc",
      borderRadius: "4px",
      margin: "0.5rem"
    }, children: [
      "Error rendering component: ",
      error instanceof Error ? error.message : "Unknown error"
    ] }, void 0, true, {
      fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/factories/IslandFactory.tsx",
      lineNumber: 39,
      columnNumber: 7
    }, this);
  }
}

function DynamicPanel({ panelType, slot, sliceName, props = {} }) {
  const renderPanel = () => {
    const Component = React.lazy(
      () => (
        // Try both .tsx and .jsx extensions
        Promise.any([
          __variableDynamicImportRuntimeHelper((/* #__PURE__ */ Object.assign({"./panels/DatabaseRetrievePanel.tsx": () => import('../chunks/DatabaseRetrievePanel_ClzDMoKI.mjs'),"./panels/DemoLeftPanel.tsx": () => import('../chunks/DemoLeftPanel_DRcA3k5w.mjs'),"./panels/DemoMainPanel.tsx": () => import('../chunks/DemoMainPanel_CGBMGGfF.mjs'),"./panels/DemoRightPanel.tsx": () => import('../chunks/DemoRightPanel_xoBLA28t.mjs'),"./panels/PanelSystem.tsx": () => import('../chunks/PanelSystem_BEoXn74P.mjs'),"./panels/TopBar.tsx": () => import('../chunks/TopBar_BYBexgE8.mjs')})), `./panels/${panelType}.tsx`, 3).then((module) => {
            console.log(`Successfully loaded .tsx component for: ${panelType}`);
            return { default: module.default || module[panelType] };
          }),
          __variableDynamicImportRuntimeHelper((/* #__PURE__ */ Object.assign({"./panels/ActionLogPanelReact.jsx": () => import('../chunks/ActionLogPanelReact_CNm-UdTo.mjs'),"./panels/ContentDetailPanel.jsx": () => import('../chunks/ContentDetailPanel_DFitjRZF.mjs'),"./panels/GeneratePanel.jsx": () => import('../chunks/GeneratePanel_CouTBjBt.mjs'),"./panels/ItemDetailPanel.jsx": () => import('../chunks/ItemDetailPanel_DIbO4HUr.mjs'),"./panels/SearchANDPrompts.jsx": () => import('../chunks/SearchANDPrompts_QOwflrJL.mjs'),"./panels/SearchAndContent.jsx": () => import('../chunks/SearchAndContent_EairH3D9.mjs'),"./panels/SearchAndTodos.jsx": () => import('../chunks/SearchAndTodos_DVMAPM7C.mjs'),"./panels/chatbot.jsx": () => import('../chunks/chatbot_BJ6YyXaB.mjs'),"./panels/xterm.jsx": () => import('../chunks/xterm_D_yTOjhB.mjs')})), `./panels/${panelType}.jsx`, 3).then((module) => {
            console.log(`Successfully loaded .jsx component for: ${panelType}`);
            return { default: module.default || module[panelType] };
          })
        ]).catch((error) => {
          console.error(`Failed to load component for panel type: ${panelType}`, error);
          throw new Error(`No component found for panel type: ${panelType}`);
        })
      )
    );
    return /* @__PURE__ */ jsxDEV(Suspense, { fallback: /* @__PURE__ */ jsxDEV("div", { style: {
      padding: "1rem",
      backgroundColor: "#f5f5f5",
      border: "1px solid #ddd",
      borderRadius: "4px",
      margin: "0.5rem",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }, children: [
      "Loading ",
      panelType,
      "..."
    ] }, void 0, true, {
      fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/DynamicPanel.tsx",
      lineNumber: 32,
      columnNumber: 9
    }, this), children: /* @__PURE__ */ jsxDEV(
      IslandFactory,
      {
        slot,
        component: Component,
        sliceName,
        hydration: "load",
        ...props
      },
      void 0,
      false,
      {
        fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/DynamicPanel.tsx",
        lineNumber: 45,
        columnNumber: 9
      },
      this
    ) }, void 0, false, {
      fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/DynamicPanel.tsx",
      lineNumber: 31,
      columnNumber: 7
    }, this);
  };
  try {
    return renderPanel();
  } catch (error) {
    console.error(`Error rendering panel ${panelType}:`, error);
    return /* @__PURE__ */ jsxDEV("div", { style: {
      padding: "1rem",
      color: "red",
      backgroundColor: "#fee",
      border: "1px solid #fcc",
      borderRadius: "4px",
      margin: "0.5rem"
    }, children: [
      "Error rendering panel: ",
      error instanceof Error ? error.message : "Unknown error"
    ] }, void 0, true, {
      fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/DynamicPanel.tsx",
      lineNumber: 61,
      columnNumber: 7
    }, this);
  }
}

const renderNestedPanel = (component, config, depth = 0) => {
  if (Array.isArray(component)) {
    const direction = depth % 2 === 0 ? "vertical" : "horizontal";
    const defaultSize = 100 / component.length;
    return /* @__PURE__ */ jsxDEV("div", { style: { height: "100%", width: "100%", display: "flex" }, children: /* @__PURE__ */ jsxDEV(
      PanelGroup,
      {
        direction,
        style: {
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: direction === "horizontal" ? "row" : "column"
        },
        children: component.map((subComponent, subIndex) => /* @__PURE__ */ jsxDEV(React.Fragment, { children: [
          /* @__PURE__ */ jsxDEV(
            Panel,
            {
              defaultSize,
              minSize: 10,
              maxSize: 90,
              style: {
                ...styles.panel,
                display: "1",
                flexDirection: direction === "vertical" ? "column" : "row"
              },
              children: renderNestedPanel(
                subComponent,
                {
                  ...config,
                  id: `${config.id}-d${depth}-${subIndex}`,
                  sliceName: `${config.sliceName}-d${depth}-${subIndex}`
                },
                depth + 1
              )
            },
            void 0,
            false,
            {
              fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/ResizablePanel.tsx",
              lineNumber: 39,
              columnNumber: 15
            },
            undefined
          ),
          subIndex < component.length - 1 && /* @__PURE__ */ jsxDEV(
            PanelResizeHandle,
            {
              style: direction === "horizontal" ? styles.resizeHandle : styles.verticalResizeHandle
            },
            void 0,
            false,
            {
              fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/ResizablePanel.tsx",
              lineNumber: 60,
              columnNumber: 17
            },
            undefined
          )
        ] }, `${config.id}-d${depth}-${subIndex}`, true, {
          fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/ResizablePanel.tsx",
          lineNumber: 38,
          columnNumber: 13
        }, undefined))
      },
      void 0,
      false,
      {
        fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/ResizablePanel.tsx",
        lineNumber: 28,
        columnNumber: 9
      },
      undefined
    ) }, void 0, false, {
      fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/ResizablePanel.tsx",
      lineNumber: 27,
      columnNumber: 7
    }, undefined);
  }
  return /* @__PURE__ */ jsxDEV(
    DynamicPanel,
    {
      panelType: component,
      slot: config.id,
      sliceName: config.sliceName,
      props: {}
    },
    void 0,
    false,
    {
      fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/ResizablePanel.tsx",
      lineNumber: 72,
      columnNumber: 5
    },
    undefined
  );
};
function ResizablePanelComponent({
  panelCount,
  useDefaultContent = true
}) {
  const currentLayout = useSelector((state) => state.resizeable?.currentLayout || "default");
  console.error("===== RESIZABLE PANEL DIAGNOSTIC START =====");
  console.error(`FORCED Redux Layout: ${currentLayout}`);
  console.error(`Available Layouts: ${JSON.stringify(Object.keys(resizeableConfig.layouts))}`);
  const normalizedLayout = String(currentLayout).toLowerCase().trim();
  console.error(`FORCED Normalized Layout: ${normalizedLayout}`);
  const validLayouts = Object.keys(resizeableConfig.layouts).map((l) => l.toLowerCase());
  console.error(`FORCED Normalized Available Layouts: ${JSON.stringify(validLayouts)}`);
  if (!validLayouts.includes(normalizedLayout)) {
    console.error(`CRITICAL: Invalid layout detected!`);
    console.error(`FORCED Attempted Layout: ${normalizedLayout}`);
    console.error(`FORCED Available Layouts: ${validLayouts.join(", ")}`);
    throw new Error(`Invalid layout: ${normalizedLayout}. Available layouts are: ${validLayouts.join(", ")}`);
  }
  const exactLayoutKey = Object.keys(resizeableConfig.layouts).find((l) => l.toLowerCase() === normalizedLayout);
  console.error(`FORCED Exact Layout Key: ${exactLayoutKey}`);
  const layoutConfig = resizeableConfig.layouts[exactLayoutKey];
  console.error(`FORCED Layout Config: ${JSON.stringify(layoutConfig)}`);
  if (!layoutConfig || !layoutConfig.components) {
    console.error("CRITICAL: No components found for the selected layout!");
    throw new Error(`No components defined for layout: ${exactLayoutKey}`);
  }
  const finalPanelCount = layoutConfig.components.length;
  console.error(`FORCED Panel Count: ${finalPanelCount}`);
  console.error(`FORCED Specific Components: ${JSON.stringify(layoutConfig.components)}`);
  console.error("===== RESIZABLE PANEL DIAGNOSTIC END =====");
  const onLayout = (sizes) => {
    console.log("Layout changed:", sizes);
  };
  const generatePanels = (count) => {
    const defaultSize = Math.floor(100 / count);
    return layoutConfig.components.map((component, index) => ({
      id: `panel-${index + 1}`,
      defaultSize,
      minSize: 10,
      maxSize: 90,
      defaultComponent: component,
      sliceName: `panel-${index + 1}`
    }));
  };
  return /* @__PURE__ */ jsxDEV("div", { style: styles.panelContainer, children: /* @__PURE__ */ jsxDEV(
    PanelGroup,
    {
      direction: "horizontal",
      onLayout,
      style: {
        height: "100%",
        width: "100%"
      },
      children: generatePanels(finalPanelCount).map((config, index) => /* @__PURE__ */ jsxDEV(React.Fragment, { children: [
        /* @__PURE__ */ jsxDEV(
          Panel,
          {
            defaultSize: config.defaultSize,
            minSize: config.minSize,
            maxSize: config.maxSize,
            style: styles.panel,
            children: Array.isArray(config.defaultComponent) ? renderNestedPanel(config.defaultComponent, config) : /* @__PURE__ */ jsxDEV(
              DynamicPanel,
              {
                panelType: config.defaultComponent,
                slot: config.id,
                sliceName: config.sliceName,
                props: {}
              },
              void 0,
              false,
              {
                fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/ResizablePanel.tsx",
                lineNumber: 173,
                columnNumber: 17
              },
              this
            )
          },
          void 0,
          false,
          {
            fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/ResizablePanel.tsx",
            lineNumber: 164,
            columnNumber: 13
          },
          this
        ),
        index < finalPanelCount - 1 && /* @__PURE__ */ jsxDEV(PanelResizeHandle, { style: styles.resizeHandle }, void 0, false, {
          fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/ResizablePanel.tsx",
          lineNumber: 182,
          columnNumber: 15
        }, this)
      ] }, config.id, true, {
        fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/ResizablePanel.tsx",
        lineNumber: 163,
        columnNumber: 11
      }, this))
    },
    void 0,
    false,
    {
      fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/ResizablePanel.tsx",
      lineNumber: 154,
      columnNumber: 7
    },
    this
  ) }, void 0, false, {
    fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/ResizablePanel.tsx",
    lineNumber: 153,
    columnNumber: 5
  }, this);
}
function ResizablePanel(props) {
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      React.startTransition(() => {
        const state = store.getState();
        console.log("Redux state initialized in ResizablePanel:", {
          theme: state.theme?.mode,
          content: state.content ? "Available" : "Not available",
          todo: state.todo ? "Available" : "Not available",
          panels: state.panellayout ? "Available" : "Not available",
          resizeable: state.resizeable?.currentLayout || "default"
        });
        store.dispatch({ type: "panels/initialized", payload: { timestamp: Date.now() } });
      });
    }
  }, []);
  return /* @__PURE__ */ jsxDEV(React.StrictMode, { children: /* @__PURE__ */ jsxDEV(Provider, { store, children: /* @__PURE__ */ jsxDEV(ResizablePanelComponent, { ...props }, void 0, false, {
    fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/ResizablePanel.tsx",
    lineNumber: 217,
    columnNumber: 9
  }, this) }, void 0, false, {
    fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/ResizablePanel.tsx",
    lineNumber: 216,
    columnNumber: 7
  }, this) }, void 0, false, {
    fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/ResizablePanel.tsx",
    lineNumber: 215,
    columnNumber: 5
  }, this);
}
const styles = {
  panelContainer: {
    display: "flex",
    height: "100%",
    width: "100%",
    backgroundColor: "#1a1a1a"
  },
  panel: {
    backgroundColor: "#2d2d2d",
    overflow: "hidden",
    height: "100%",
    width: "100%"
  },
  resizeHandle: {
    width: "4px",
    backgroundColor: "#404040",
    cursor: "col-resize",
    "&:hover": {
      backgroundColor: "#666"
    }
  },
  verticalResizeHandle: {
    height: "4px",
    backgroundColor: "#404040",
    cursor: "row-resize",
    "&:hover": {
      backgroundColor: "#666"
    }
  }
};

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$FlexablePanelLayout = createComponent(($$result, $$props, $$slots) => {
  const initialState = store.getState();
  const initialTheme = initialState.theme?.mode || "light";
  initialState.resizeable?.currentLayout || "default";
  initialState.content || {};
  initialState.todo || {};
  initialState.panellayout || {};
  return renderTemplate(_a || (_a = __template(['<html lang="en"', ' data-astro-cid-qoo7q6rl> <head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Resizable Panel Layout</title><script>(function(){', "\n      // Ensure consistent theme on initial load\n      document.documentElement.classList.remove('light', 'dark');\n      document.documentElement.classList.add(initialTheme);\n    })();<\/script>", '</head> <body class="min-h-screen bg-background text-foreground antialiased" data-astro-cid-qoo7q6rl> <div class="app-container" data-astro-cid-qoo7q6rl> <div class="sidebar-container" data-astro-cid-qoo7q6rl> ', ' </div> <div class="main-content" id="panel-container" data-astro-cid-qoo7q6rl> ', " ", ` </div> </div> <!-- Use the is:inline type="module" syntax to properly define this as a module --> <script type="module">
      // Ensure Redux state is properly initialized
      import { store } from '/src/store.js';
      
      // Apply initial theme and set up theme subscription
      const initialTheme = store.getState().theme?.mode || 'light';
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(initialTheme);
      
      // Subscribe to state changes using startTransition to prevent hydration errors
      let isHydrated = false;
      
      // Wait for hydration to complete
      setTimeout(() => {
        isHydrated = true;
        console.log('Hydration complete, safe to update state now');
      }, 100);
      
      store.subscribe(() => {
        // Only process state updates after hydration
        if (!isHydrated) return;
        
        const state = store.getState();
        
        // Handle theme changes
        const theme = state.theme?.mode;
        if (theme) {
          document.documentElement.classList.remove('light', 'dark');
          document.documentElement.classList.add(theme);
        }
        
        // Log state changes to help with debugging
        console.log('Redux state updated', {
          theme: state.theme?.mode,
          content: state.content?.selectedHash ? 'Has selected content' : 'No selected content',
          todo: Object.keys(state.todo || {}).length > 0 ? 'Has todos' : 'No todos',
          layout: state.resizeable?.currentLayout
        });
      });
    <\/script> </body> </html>`])), addAttribute([initialTheme, "min-h-screen"], "class:list"), defineScriptVars({ initialTheme }), renderHead(), renderComponent($$result, "JsonSidebar", JsonSidebar, { "client:load": true, "client:component-hydration": "load", "client:component-path": "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/JsonSidebar", "client:component-export": "default", "data-astro-cid-qoo7q6rl": true }), renderComponent($$result, "ResizablePanel", ResizablePanel, { "client:load": true, "useDefaultContent": true, "client:component-hydration": "load", "client:component-path": "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/ResizablePanel", "client:component-export": "default", "data-astro-cid-qoo7q6rl": true }), renderSlot($$result, $$slots["default"]));
}, "/Users/Henrykoo/Documents/redux_todo_in_astro/src/layouts/flexablePanelLayout.astro", void 0);

const $$ResizablePage = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "ResizablePanelLayout", $$FlexablePanelLayout, {})}`;
}, "/Users/Henrykoo/Documents/redux_todo_in_astro/src/pages/resizablePage.astro", void 0);

const $$file = "/Users/Henrykoo/Documents/redux_todo_in_astro/src/pages/resizablePage.astro";
const $$url = "/resizablePage";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$ResizablePage,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
