import { a as SQLiteEngine, C as CardCollection } from '../../chunks/sqlite_engine_GHsfZY5c.mjs';
import { g as getCardByHash } from '../../chunks/storeAdapter_B5oR1Vf_.mjs';
export { renderers } from '../../renderers.mjs';

const POST = async ({ request }) => {
  console.log("POST /api/update-card called");
  try {
    const data = await request.json();
    console.log("Received update request:", { hash: data.hash, contentType: typeof data.content });
    if (!data.hash || data.content === void 0) {
      return new Response(
        JSON.stringify({
          error: "Invalid request. Hash and content are required.",
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    let updatedContent = data.content;
    if (typeof updatedContent === "object" && updatedContent !== null) {
      updatedContent = {
        ...updatedContent,
        __stateTimestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
    }
    const engine = new SQLiteEngine();
    const cardCollection = new CardCollection(engine);
    const existingCard = cardCollection.get(data.hash);
    if (!existingCard) {
      return new Response(
        JSON.stringify({
          error: "Card not found",
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    const success = cardCollection.update(data.hash, updatedContent);
    if (!success) {
      throw new Error("Failed to update card in database");
    }
    const updatedCard = getCardByHash(data.hash);
    return new Response(
      JSON.stringify({
        success: true,
        hash: data.hash,
        updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
        cardData: {
          hash: updatedCard?.hash,
          contentType: typeof updatedCard?.content,
          updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
          content: updatedCard?.content
        }
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Error updating card:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to update card",
        details: error instanceof Error ? error.message : String(error),
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
