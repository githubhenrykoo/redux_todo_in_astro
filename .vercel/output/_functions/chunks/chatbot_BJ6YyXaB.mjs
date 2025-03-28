import { jsxDEV } from 'react/jsx-dev-runtime';
import React, { useState, useRef, useEffect } from 'react';

const ChatbotPanel = ({ className = "" }) => {
  const [mentions, setMentions] = useState([]);
  const [messages, setMessages] = useState([
    {
      role: "system",
      content: `How can I help?

Command:
- "read the testing.txt", "show contents of testing.txt"
- "list files in downloads"
- "where am i"
- "make directory testing"
- "delete file testing.txt"`
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState("llama3");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const terminalSocketRef = useRef(null);
  useEffect(() => {
    fetchModels();
  }, []);
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  const fetchModels = async () => {
    try {
      const response = await fetch("http://localhost:11434/api/tags");
      if (!response.ok) {
        throw new Error("Failed to fetch models");
      }
      const data = await response.json();
      setModels(data.models || []);
    } catch (err) {
      console.error("Error fetching models:", err);
      setError("Failed to connect to Ollama server. Make sure it's running on http://localhost:11434");
    }
  };
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  const handleInputChange = (e) => {
    setInput(e.target.value);
  };
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
  useEffect(() => {
    connectToTerminal();
    return () => {
      if (terminalSocketRef.current) {
        terminalSocketRef.current.close();
      }
    };
  }, []);
  const connectToTerminal = () => {
    try {
      const ws = new WebSocket("ws://localhost:3001");
      terminalSocketRef.current = ws;
      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.type === "output") {
          setMessages((prev) => [...prev, {
            role: "assistant",
            content: message.data
          }]);
        }
      };
    } catch (err) {
      console.error("Terminal connection error:", err);
    }
  };
  const processNaturalLanguageCommand = (text) => {
    const readPattern = /(?:read|show|display|open)\s+(?:contents\s+of\s+|the\s+)?(?:file\s+)?["']?([^"']+?)["']?\s*$/i;
    const listPattern = /(?:list|show)\s+(?:files|directory|contents)\s*(?:in\s+)?(.+)?/i;
    const mkdirPattern = /(?:make|create)\s+(?:a\s+)?(?:new\s+)?directory\s+(?:named\s+)?(.+)/i;
    const removePattern = /(?:remove|delete)\s+(?:the\s+)?(?:file|directory)?\s+(.+)/i;
    let command = "";
    if (readPattern.test(text)) {
      const match = text.match(readPattern);
      const filename = match[1].trim();
      command = `cat "${filename}"`;
    } else if (listPattern.test(text)) {
      const match = text.match(listPattern);
      command = `ls ${match[1] ? `"${match[1].trim()}"` : ""}`.trim();
    } else if (mkdirPattern.test(text)) {
      const match = text.match(mkdirPattern);
      command = `mkdir "${match[1].trim()}"`;
    } else if (removePattern.test(text)) {
      const match = text.match(removePattern);
      command = `rm "${match[1].trim()}"`;
    } else if (text.toLowerCase().includes("current directory") || text.toLowerCase().includes("where am i")) {
      command = "pwd";
    } else if (text.toLowerCase().includes("clear screen")) {
      command = "clear";
    }
    return command;
  };
  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    const userMessage = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setError(null);
    const naturalCommand = processNaturalLanguageCommand(input.trim());
    if (input.trim().startsWith("$") || naturalCommand) {
      const command = input.trim().startsWith("$") ? input.trim().slice(1) : naturalCommand;
      if (terminalSocketRef.current?.readyState === WebSocket.OPEN) {
        terminalSocketRef.current.send(JSON.stringify({
          type: "input",
          data: command + "\n"
        }));
      }
      setIsLoading(false);
      return;
    }
    try {
      setMessages((prev) => [...prev, { role: "assistant", content: "...", isThinking: true }]);
      const response = await fetch("http://localhost:11434/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [...messages.filter((m) => !m.isThinking), userMessage],
          stream: false
        })
      });
      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }
      const data = await response.json();
      setMessages((prev) => [
        ...prev.filter((m) => !m.isThinking),
        { role: "assistant", content: data.message?.content || "No response from model" }
      ]);
    } catch (err) {
      console.error("Error sending message:", err);
      setMessages((prev) => [
        ...prev.filter((m) => !m.isThinking),
        { role: "error", content: `Error: ${err.message}. Make sure Ollama is running with llama3 model.` }
      ]);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  const clearChat = () => {
    setMessages([
      { role: "system", content: "How can I help?" }
    ]);
  };
  const handleModelChange = (e) => {
    setSelectedModel(e.target.value);
  };
  const [selectedText, setSelectedText] = useState("");
  const handleMentionClick = (word) => {
    const selection = window.getSelection().toString().trim();
    const textToAdd = selection || word;
    setInput((prev) => prev + (prev ? " " : "") + textToAdd);
    inputRef.current?.focus();
  };
  const [isWordSelectEnabled, setIsWordSelectEnabled] = useState(true);
  const toggleWordSelect = () => {
    setIsWordSelectEnabled((prev) => !prev);
  };
  return /* @__PURE__ */ jsxDEV("div", { className: `h-full w-full flex flex-col bg-gray-900 text-gray-200 ${className}`, children: [
    /* @__PURE__ */ jsxDEV("div", { className: "p-2 bg-gray-800 border-b border-gray-700 flex items-center", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "flex space-x-2 mr-4", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "w-3 h-3 rounded-full bg-red-500" }, void 0, false, {
          fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/chatbot.jsx",
          lineNumber: 250,
          columnNumber: 11
        }, undefined),
        /* @__PURE__ */ jsxDEV("div", { className: "w-3 h-3 rounded-full bg-yellow-500" }, void 0, false, {
          fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/chatbot.jsx",
          lineNumber: 251,
          columnNumber: 11
        }, undefined),
        /* @__PURE__ */ jsxDEV("div", { className: "w-3 h-3 rounded-full bg-green-500" }, void 0, false, {
          fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/chatbot.jsx",
          lineNumber: 252,
          columnNumber: 11
        }, undefined)
      ] }, void 0, true, {
        fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/chatbot.jsx",
        lineNumber: 249,
        columnNumber: 9
      }, undefined),
      /* @__PURE__ */ jsxDEV("div", { className: "text-center flex-grow", children: "ChatBot - MCP Server with Ollama Integration" }, void 0, false, {
        fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/chatbot.jsx",
        lineNumber: 254,
        columnNumber: 9
      }, undefined),
      /* @__PURE__ */ jsxDEV(
        "button",
        {
          onClick: toggleWordSelect,
          className: `mr-2 px-2 py-1 text-xs rounded ${isWordSelectEnabled ? "bg-green-600 hover:bg-green-700" : "bg-gray-600 hover:bg-gray-700"}`,
          children: [
            "Word Select: ",
            isWordSelectEnabled ? "On" : "Off"
          ]
        },
        void 0,
        true,
        {
          fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/chatbot.jsx",
          lineNumber: 255,
          columnNumber: 9
        },
        undefined
      ),
      /* @__PURE__ */ jsxDEV(
        "select",
        {
          value: selectedModel,
          onChange: handleModelChange,
          className: "mr-2 px-2 py-1 text-xs bg-gray-700 text-white rounded",
          children: models.length > 0 ? models.map((model) => /* @__PURE__ */ jsxDEV("option", { value: model.name, children: model.name }, model.name, false, {
            fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/chatbot.jsx",
            lineNumber: 272,
            columnNumber: 15
          }, undefined)) : /* @__PURE__ */ jsxDEV("option", { value: "llama3", children: "llama3" }, void 0, false, {
            fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/chatbot.jsx",
            lineNumber: 277,
            columnNumber: 13
          }, undefined)
        },
        void 0,
        false,
        {
          fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/chatbot.jsx",
          lineNumber: 265,
          columnNumber: 9
        },
        undefined
      ),
      /* @__PURE__ */ jsxDEV(
        "button",
        {
          onClick: clearChat,
          className: "px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded",
          children: "Clear"
        },
        void 0,
        false,
        {
          fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/chatbot.jsx",
          lineNumber: 280,
          columnNumber: 9
        },
        undefined
      )
    ] }, void 0, true, {
      fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/chatbot.jsx",
      lineNumber: 248,
      columnNumber: 7
    }, undefined),
    error && /* @__PURE__ */ jsxDEV("div", { className: "bg-red-900 text-red-100 p-2 text-sm", children: [
      error,
      /* @__PURE__ */ jsxDEV(
        "button",
        {
          onClick: fetchModels,
          className: "ml-2 px-2 py-0.5 bg-red-800 hover:bg-red-700 rounded text-xs",
          children: "Retry"
        },
        void 0,
        false,
        {
          fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/chatbot.jsx",
          lineNumber: 291,
          columnNumber: 11
        },
        undefined
      )
    ] }, void 0, true, {
      fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/chatbot.jsx",
      lineNumber: 289,
      columnNumber: 9
    }, undefined),
    /* @__PURE__ */ jsxDEV("div", { className: "flex-1 p-4 overflow-y-auto", children: [
      messages.map((message, index) => /* @__PURE__ */ jsxDEV("div", { className: `mb-4 ${message.role === "user" ? "text-right" : message.role === "error" ? "text-center" : "text-left"}`, children: /* @__PURE__ */ jsxDEV("div", { className: `inline-block px-4 py-2 rounded-lg max-w-[80%] ${message.role === "user" ? "bg-blue-600 text-white rounded-br-none" : message.role === "system" ? "bg-gray-700 text-gray-200" : message.role === "error" ? "bg-red-600 text-white" : "bg-gray-800 text-gray-200 rounded-bl-none"} ${message.isThinking ? "animate-pulse" : ""}`, children: [
        /* @__PURE__ */ jsxDEV(
          "div",
          {
            className: "whitespace-pre-wrap",
            onMouseUp: () => {
              if (!isWordSelectEnabled) return;
              const selection = window.getSelection().toString().trim();
              if (selection) {
                setInput((prev) => prev + (prev ? " " : "") + selection);
                inputRef.current?.focus();
              }
            },
            children: message.role === "assistant" && !message.isThinking ? message.content.split(" ").map((word, i) => /* @__PURE__ */ jsxDEV(React.Fragment, { children: [
              /* @__PURE__ */ jsxDEV(
                "span",
                {
                  className: `${isWordSelectEnabled ? "cursor-pointer hover:text-yellow-400" : ""} transition-colors`,
                  onClick: () => isWordSelectEnabled && handleMentionClick(word),
                  children: word
                },
                void 0,
                false,
                {
                  fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/chatbot.jsx",
                  lineNumber: 327,
                  columnNumber: 23
                },
                undefined
              ),
              " "
            ] }, i, true, {
              fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/chatbot.jsx",
              lineNumber: 326,
              columnNumber: 21
            }, undefined)) : message.content
          },
          void 0,
          false,
          {
            fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/chatbot.jsx",
            lineNumber: 313,
            columnNumber: 15
          },
          undefined
        ),
        message.role !== "user" && message.role !== "system" && message.role !== "error" && /* @__PURE__ */ jsxDEV("div", { className: "text-xs text-gray-400 mt-1", children: "System" }, void 0, false, {
          fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/chatbot.jsx",
          lineNumber: 341,
          columnNumber: 17
        }, undefined)
      ] }, void 0, true, {
        fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/chatbot.jsx",
        lineNumber: 307,
        columnNumber: 13
      }, undefined) }, index, false, {
        fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/chatbot.jsx",
        lineNumber: 302,
        columnNumber: 11
      }, undefined)),
      /* @__PURE__ */ jsxDEV("div", { ref: messagesEndRef }, void 0, false, {
        fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/chatbot.jsx",
        lineNumber: 348,
        columnNumber: 9
      }, undefined)
    ] }, void 0, true, {
      fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/chatbot.jsx",
      lineNumber: 300,
      columnNumber: 7
    }, undefined),
    /* @__PURE__ */ jsxDEV("div", { className: "p-4 border-t border-gray-700", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "flex items-start", children: [
        /* @__PURE__ */ jsxDEV(
          "textarea",
          {
            ref: inputRef,
            value: input,
            onChange: handleInputChange,
            onKeyDown: handleKeyDown,
            placeholder: "Type your message here...",
            className: "flex-grow p-2 bg-gray-800 text-white rounded-lg resize-none h-12 max-h-32 min-h-[3rem]",
            rows: 1,
            disabled: isLoading
          },
          void 0,
          false,
          {
            fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/chatbot.jsx",
            lineNumber: 353,
            columnNumber: 11
          },
          undefined
        ),
        /* @__PURE__ */ jsxDEV(
          "button",
          {
            onClick: sendMessage,
            disabled: isLoading || !input.trim(),
            className: `ml-2 px-4 py-2 rounded-lg ${isLoading || !input.trim() ? "bg-gray-700 text-gray-500 cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700"}`,
            children: isLoading ? /* @__PURE__ */ jsxDEV("svg", { className: "animate-spin h-5 w-5", xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", children: [
              /* @__PURE__ */ jsxDEV("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }, void 0, false, {
                fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/chatbot.jsx",
                lineNumber: 374,
                columnNumber: 17
              }, undefined),
              /* @__PURE__ */ jsxDEV("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" }, void 0, false, {
                fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/chatbot.jsx",
                lineNumber: 375,
                columnNumber: 17
              }, undefined)
            ] }, void 0, true, {
              fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/chatbot.jsx",
              lineNumber: 373,
              columnNumber: 15
            }, undefined) : /* @__PURE__ */ jsxDEV("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-5 w-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: /* @__PURE__ */ jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 19l9 2-9-18-9 18 9-2zm0 0v-8" }, void 0, false, {
              fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/chatbot.jsx",
              lineNumber: 379,
              columnNumber: 17
            }, undefined) }, void 0, false, {
              fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/chatbot.jsx",
              lineNumber: 378,
              columnNumber: 15
            }, undefined)
          },
          void 0,
          false,
          {
            fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/chatbot.jsx",
            lineNumber: 363,
            columnNumber: 11
          },
          undefined
        )
      ] }, void 0, true, {
        fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/chatbot.jsx",
        lineNumber: 352,
        columnNumber: 9
      }, undefined),
      /* @__PURE__ */ jsxDEV("div", { className: "text-xs text-gray-500 mt-2", children: "Press Enter to send, Shift+Enter for new line" }, void 0, false, {
        fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/chatbot.jsx",
        lineNumber: 384,
        columnNumber: 9
      }, undefined)
    ] }, void 0, true, {
      fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/chatbot.jsx",
      lineNumber: 351,
      columnNumber: 7
    }, undefined)
  ] }, void 0, true, {
    fileName: "/Users/Henrykoo/Documents/redux_todo_in_astro/src/components/panels/chatbot.jsx",
    lineNumber: 247,
    columnNumber: 5
  }, undefined);
};

export { ChatbotPanel as default };
