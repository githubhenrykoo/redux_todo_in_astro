import { jsxDEV } from 'react/jsx-dev-runtime';
import { useState, useRef, useEffect } from 'react';

const XtermPanel = ({ className = "" }) => {
  const [output, setOutput] = useState([
    { text: "Terminal", type: "header" },
    { text: "Connecting to terminal server...", type: "info" }
  ]);
  const [input, setInput] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const socketRef = useRef(null);
  const outputRef = useRef(null);
  const inputRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  useEffect(() => {
    connectToServer();
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);
  const connectToServer = () => {
    try {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      const ws = new WebSocket("ws://localhost:3001");
      socketRef.current = ws;
      ws.onopen = () => {
        setIsConnected(true);
        setError(null);
        setOutput((prev) => [
          ...prev,
          { text: "Connected to terminal server", type: "success" }
        ]);
      };
      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.type === "output") {
          const lines = message.data.split("\n");
          lines.forEach((line) => {
            if (line.trim()) {
              setOutput((prev) => [...prev, {
                text: line,
                type: "terminal"
              }]);
            }
          });
        }
      };
      ws.onerror = () => {
        setIsConnected(false);
        setError("Failed to connect to terminal server. Make sure the server is running.");
        setOutput((prev) => [
          ...prev,
          { text: "Error: Failed to connect to terminal server", type: "error" },
          { text: "Make sure the server is running at ws://localhost:3001", type: "error" },
          { text: "Attempting to reconnect in 5 seconds...", type: "info" }
        ]);
        reconnectTimeoutRef.current = setTimeout(() => {
          setOutput((prev) => [...prev, { text: "Attempting to reconnect...", type: "info" }]);
          connectToServer();
        }, 5e3);
      };
      ws.onclose = () => {
        setIsConnected(false);
        setOutput((prev) => [
          ...prev,
          { text: "Disconnected from terminal server", type: "error" },
          { text: "Attempting to reconnect in 5 seconds...", type: "info" }
        ]);
        reconnectTimeoutRef.current = setTimeout(() => {
          setOutput((prev) => [...prev, { text: "Attempting to reconnect...", type: "info" }]);
          connectToServer();
        }, 5e3);
      };
    } catch (err) {
      console.error("Terminal connection error:", err);
      setError(`Terminal connection error: ${err.message}`);
      reconnectTimeoutRef.current = setTimeout(() => {
        setOutput((prev) => [...prev, { text: "Attempting to reconnect...", type: "info" }]);
        connectToServer();
      }, 5e3);
    }
  };
  const handleInputChange = (e) => {
    setInput(e.target.value);
  };
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      sendCommand();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      navigateHistory(-1);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      navigateHistory(1);
    }
  };
  const navigateHistory = (direction) => {
    if (commandHistory.length === 0) return;
    const newIndex = historyIndex + direction;
    if (newIndex >= -1 && newIndex < commandHistory.length) {
      setHistoryIndex(newIndex);
      if (newIndex === -1) {
        setInput("");
      } else {
        setInput(commandHistory[commandHistory.length - 1 - newIndex]);
      }
    }
  };
  const sendCommand = () => {
    if (!input.trim() || !isConnected) return;
    setCommandHistory((prev) => [...prev, input]);
    setHistoryIndex(-1);
    setOutput((prev) => [...prev, { text: `$ ${input}`, type: "command" }]);
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: "input",
        data: input + "\n"
      }));
    }
    setInput("");
  };
  const clearTerminal = () => {
    setOutput([{ text: "Terminal cleared", type: "info" }]);
  };
  return /* @__PURE__ */ jsxDEV("div", { className: `h-full w-full flex flex-col bg-gray-900 text-gray-200 font-mono ${className}`, children: [
    /* @__PURE__ */ jsxDEV("div", { className: "p-2 bg-gray-800 border-b border-gray-700 flex items-center", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "flex space-x-2 mr-4", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "w-3 h-3 rounded-full bg-red-500" }, void 0, false, {
          fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/xterm.jsx",
          lineNumber: 180,
          columnNumber: 11
        }, undefined),
        /* @__PURE__ */ jsxDEV("div", { className: "w-3 h-3 rounded-full bg-yellow-500" }, void 0, false, {
          fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/xterm.jsx",
          lineNumber: 181,
          columnNumber: 11
        }, undefined),
        /* @__PURE__ */ jsxDEV("div", { className: "w-3 h-3 rounded-full bg-green-500" }, void 0, false, {
          fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/xterm.jsx",
          lineNumber: 182,
          columnNumber: 11
        }, undefined)
      ] }, void 0, true, {
        fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/xterm.jsx",
        lineNumber: 179,
        columnNumber: 9
      }, undefined),
      /* @__PURE__ */ jsxDEV("div", { className: "text-center flex-grow", children: "Terminal" }, void 0, false, {
        fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/xterm.jsx",
        lineNumber: 184,
        columnNumber: 9
      }, undefined),
      /* @__PURE__ */ jsxDEV(
        "button",
        {
          onClick: clearTerminal,
          className: "px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded",
          children: "Clear"
        },
        void 0,
        false,
        {
          fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/xterm.jsx",
          lineNumber: 185,
          columnNumber: 9
        },
        undefined
      )
    ] }, void 0, true, {
      fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/xterm.jsx",
      lineNumber: 178,
      columnNumber: 7
    }, undefined),
    error && /* @__PURE__ */ jsxDEV("div", { className: "bg-red-900 text-red-100 p-2 text-sm", children: [
      error,
      /* @__PURE__ */ jsxDEV(
        "button",
        {
          onClick: connectToServer,
          className: "ml-2 px-2 py-0.5 bg-red-800 hover:bg-red-700 rounded text-xs",
          children: "Retry"
        },
        void 0,
        false,
        {
          fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/xterm.jsx",
          lineNumber: 196,
          columnNumber: 11
        },
        undefined
      )
    ] }, void 0, true, {
      fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/xterm.jsx",
      lineNumber: 194,
      columnNumber: 9
    }, undefined),
    /* @__PURE__ */ jsxDEV(
      "div",
      {
        ref: outputRef,
        className: "flex-1 p-2 overflow-y-auto",
        children: output.map((line, index) => /* @__PURE__ */ jsxDEV(
          "div",
          {
            className: `mb-1 ${line.type === "error" ? "text-red-400" : line.type === "info" ? "text-blue-400" : line.type === "success" ? "text-green-400" : line.type === "command" ? "text-yellow-400 font-bold" : line.type === "header" ? "text-white font-bold text-lg mb-2" : "text-gray-200"}`,
            children: line.text
          },
          index,
          false,
          {
            fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/xterm.jsx",
            lineNumber: 210,
            columnNumber: 11
          },
          undefined
        ))
      },
      void 0,
      false,
      {
        fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/xterm.jsx",
        lineNumber: 205,
        columnNumber: 7
      },
      undefined
    ),
    /* @__PURE__ */ jsxDEV("div", { className: "p-2 border-t border-gray-700 flex items-center", children: [
      /* @__PURE__ */ jsxDEV("span", { className: "text-green-400 mr-2", children: "$" }, void 0, false, {
        fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/xterm.jsx",
        lineNumber: 227,
        columnNumber: 9
      }, undefined),
      /* @__PURE__ */ jsxDEV(
        "input",
        {
          ref: inputRef,
          type: "text",
          value: input,
          onChange: handleInputChange,
          onKeyDown: handleKeyDown,
          className: "flex-grow bg-transparent outline-none text-white",
          placeholder: isConnected ? "Enter command..." : "Connecting...",
          disabled: !isConnected,
          autoFocus: true
        },
        void 0,
        false,
        {
          fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/xterm.jsx",
          lineNumber: 228,
          columnNumber: 9
        },
        undefined
      )
    ] }, void 0, true, {
      fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/xterm.jsx",
      lineNumber: 226,
      columnNumber: 7
    }, undefined),
    /* @__PURE__ */ jsxDEV("div", { className: "p-1 bg-gray-800 text-xs text-gray-500 flex justify-between", children: [
      /* @__PURE__ */ jsxDEV("span", { children: isConnected ? "Connected" : "Disconnected" }, void 0, false, {
        fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/xterm.jsx",
        lineNumber: 242,
        columnNumber: 9
      }, undefined),
      /* @__PURE__ */ jsxDEV("span", { children: "Use ↑↓ for history" }, void 0, false, {
        fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/xterm.jsx",
        lineNumber: 243,
        columnNumber: 9
      }, undefined)
    ] }, void 0, true, {
      fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/xterm.jsx",
      lineNumber: 241,
      columnNumber: 7
    }, undefined)
  ] }, void 0, true, {
    fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/xterm.jsx",
    lineNumber: 177,
    columnNumber: 5
  }, undefined);
};

export { XtermPanel as default };
