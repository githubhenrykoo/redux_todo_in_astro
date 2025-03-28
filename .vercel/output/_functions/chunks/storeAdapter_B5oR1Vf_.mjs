import { M as MCard, S as SQLiteConnection, a as SQLiteEngine } from './sqlite_engine_GHsfZY5c.mjs';
import { C as CARDS_DB_PATH } from './cryptoPolyfill_D9Y5yeZG.mjs';

let engineInstance = null;
function getStoreEngine() {
  if (!engineInstance) {
    try {
      console.log("Initializing SQLiteEngine with database path:", CARDS_DB_PATH);
      const connection = SQLiteConnection.getInstance(CARDS_DB_PATH);
      engineInstance = new SQLiteEngine(connection);
      console.log("SQLiteEngine initialized successfully");
    } catch (error) {
      console.error("Error initializing SQLiteEngine:", error);
      throw error;
    }
  }
  return engineInstance;
}
function storeData(data) {
  try {
    console.log("storeData called with full data keys:", Object.keys(data));
    const fullData = JSON.parse(JSON.stringify(data));
    const slicesToLog = [
      "theme",
      "user",
      "content",
      "search",
      "system",
      "todo",
      "panellayout",
      "activePanel",
      "resizeable",
      "__stateTimestamp"
    ];
    slicesToLog.forEach((slice) => {
      if (fullData[slice]) {
        console.log(
          `Detailed ${slice} slice:`,
          slice === "todo" ? {
            todos: fullData[slice].todos?.length,
            actionHistory: fullData[slice].actionHistory?.length,
            searchQuery: fullData[slice].searchQuery,
            selectedContent: fullData[slice].selectedContent
          } : fullData[slice]
        );
      }
    });
    if (fullData.todo) {
      console.log("Todos preservation check:", {
        todosCount: fullData.todo.todos?.length,
        actionHistoryCount: fullData.todo.actionHistory?.length,
        actionHistoryDetails: fullData.todo.actionHistory
      });
    }
    const mcard = new MCard(fullData);
    console.log("Created MCard successfully with complete state");
    const engine = getStoreEngine();
    const hash = engine.add(mcard);
    console.log("Added card to engine, received hash:", hash);
    const storedCard = getCardByHash(hash);
    console.log("Verification - Stored card details:", {
      hash: storedCard?.hash,
      contentKeys: Object.keys(storedCard?.content || {}),
      todoCount: storedCard?.content?.todo?.todos?.length,
      actionHistoryCount: storedCard?.content?.todo?.actionHistory?.length
    });
    return hash;
  } catch (error) {
    console.error("Critical error in storeData:", error);
    throw error;
  }
}
function getCardByHash(hash) {
  try {
    console.log("getCardByHash called with hash:", hash);
    const engine = getStoreEngine();
    const card = engine.get(hash);
    if (!card) {
      console.log("No card found for hash:", hash);
      return null;
    }
    return {
      hash: card.hash,
      content: card.content,
      timestamp: card.g_time,
      retrievedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
  } catch (error) {
    console.error("Error in getCardByHash:", error);
    return null;
  }
}

export { getCardByHash as g, storeData as s };
