import { g as getCardByHash } from '../../chunks/storeAdapter_B5oR1Vf_.mjs';
export { renderers } from '../../renderers.mjs';

const GET = async ({ request }) => {
  console.log("GET /api/get-card called");
  const url = new URL(request.url);
  const hash = url.searchParams.get("hash");
  if (!hash) {
    console.error("Missing required hash parameter");
    return new Response(
      JSON.stringify({
        error: "Missing required hash parameter"
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
  try {
    console.log("Retrieving card with hash:", hash);
    const card = getCardByHash(hash);
    if (!card) {
      console.log("Card not found for hash:", hash);
      return new Response(
        JSON.stringify({
          error: "Card not found"
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    const responseData = {
      ...card,
      serverTimestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
    console.log("Card retrieved successfully");
    return new Response(
      JSON.stringify(responseData),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Error retrieving card:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to retrieve card",
        details: error instanceof Error ? error.message : String(error)
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
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
