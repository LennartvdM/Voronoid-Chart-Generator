import { getStore } from "@netlify/blobs";

export default async (req, context) => {
  // Only allow GET requests
  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    // Get the blob store
    const store = getStore("voronoi-config");

    // Load the config
    const config = await store.get("current", { type: "json" });

    if (!config) {
      return new Response(JSON.stringify({
        success: true,
        config: null,
        message: "No saved configuration found"
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      config
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error loading config:", error);
    return new Response(JSON.stringify({ error: "Failed to load configuration" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
