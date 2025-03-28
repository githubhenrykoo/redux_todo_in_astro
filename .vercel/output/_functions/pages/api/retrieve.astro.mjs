import { a as SQLiteEngine, C as CardCollection } from '../../chunks/sqlite_engine_GHsfZY5c.mjs';
export { renderers } from '../../renderers.mjs';

const GET = async ({ request }) => {
  console.log("GET /api/retrieve called");
  const url = new URL(request.url);
  const params = {
    hashValue: url.searchParams.get("hash") || void 0,
    pageNumber: parseInt(url.searchParams.get("page") || "1"),
    pageSize: parseInt(url.searchParams.get("pageSize") || "10"),
    searchTerm: url.searchParams.get("search") || void 0
  };
  try {
    const engine = new SQLiteEngine();
    const cardCollection = new CardCollection(engine);
    let result;
    if (params.hashValue) {
      console.log(`Retrieving card with hash: ${params.hashValue}`);
      const card = cardCollection.get(params.hashValue);
      if (!card) {
        return new Response(
          JSON.stringify({ error: "Card not found" }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }
      result = {
        items: [card],
        total_items: 1,
        page_number: 1,
        page_size: 1,
        has_next: false,
        has_previous: false,
        total_pages: 1,
        previous_page: null,
        next_page: null
      };
    } else if (params.searchTerm) {
      console.log(`Searching for cards with term: ${params.searchTerm}`);
      result = cardCollection.search_by_content(
        params.searchTerm,
        params.pageNumber,
        params.pageSize
      );
    } else {
      console.log(`Retrieving all cards, page ${params.pageNumber}, size ${params.pageSize}`);
      result = cardCollection.get_page(params.pageNumber, params.pageSize);
    }
    const responseData = {
      ...result,
      serverTimestamp: (/* @__PURE__ */ new Date()).toISOString(),
      retrievalMethod: params.hashValue ? "hash" : params.searchTerm ? "search" : "all"
    };
    return new Response(
      JSON.stringify(responseData),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error retrieving cards:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to retrieve cards",
        details: error instanceof Error ? error.message : String(error)
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
