import { s as storeData } from '../../chunks/storeAdapter_B5oR1Vf_.mjs';
export { renderers } from '../../renderers.mjs';

const POST = async ({ request }) => {
  console.log("API: Submit endpoint hit");
  try {
    const bodyText = await request.text();
    console.log("API: Request body length:", bodyText.length);
    if (bodyText && bodyText.trim()) {
      try {
        const jsonData = JSON.parse(bodyText);
        console.log("API: Successfully parsed JSON with keys:", Object.keys(jsonData));
        const hash = storeData(jsonData);
        console.log("API: Successfully stored data with hash:", hash);
        return new Response(
          JSON.stringify({
            success: true,
            message: "Data stored successfully",
            hash
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json"
            }
          }
        );
      } catch (error) {
        console.error("API: Error parsing JSON:", error);
        return new Response(
          JSON.stringify({
            success: false,
            error: "Invalid JSON data",
            message: "Could not parse request body as JSON"
          }),
          {
            status: 400,
            headers: {
              "Content-Type": "application/json"
            }
          }
        );
      }
    } else {
      console.log("API: No data provided in request body");
      return new Response(
        JSON.stringify({
          success: false,
          error: "No data provided",
          message: "Request body is empty"
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }
  } catch (error) {
    console.error("API: Unexpected error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Server error",
        message: error instanceof Error ? error.message : "Unknown error"
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json"
        }
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
