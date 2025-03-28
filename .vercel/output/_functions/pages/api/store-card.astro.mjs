import { s as storeData, g as getCardByHash } from '../../chunks/storeAdapter_B5oR1Vf_.mjs';
export { renderers } from '../../renderers.mjs';

const POST = async ({ request }) => {
  console.log("POST /api/store-card called");
  try {
    const data = await request.json();
    console.log("Received data to store:", Object.keys(data || {}));
    const stateTimestamp = (/* @__PURE__ */ new Date()).toISOString();
    const dataWithTimestamp = {
      ...data,
      __stateTimestamp: stateTimestamp
    };
    const hash = storeData(dataWithTimestamp);
    console.log("Data stored successfully with hash:", hash);
    const storedCard = getCardByHash(hash);
    return new Response(
      JSON.stringify({
        success: true,
        hash,
        stateTimestamp,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        cardData: {
          hash: storedCard?.hash,
          contentType: typeof storedCard?.content,
          createdAt: storedCard?.timestamp,
          stateTimestamp: storedCard?.content?.__stateTimestamp,
          size: typeof storedCard?.content === "string" ? storedCard.content.length : JSON.stringify(storedCard?.content).length
        }
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Error storing data:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to store data",
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
