import { getStore } from "@netlify/blobs";

export default async (req, context) => {
  // Only allow POST requests
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const config = await req.json();

    // Validate that we received an object
    if (!config || typeof config !== "object") {
      return new Response(JSON.stringify({ error: "Invalid configuration" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Get the blob store
    const store = getStore("voronoi-config");

    // Save the config with a timestamp
    const savedConfig = {
      ...config,
      savedAt: new Date().toISOString()
    };

    await store.setJSON("current", savedConfig);

    return new Response(JSON.stringify({
      success: true,
      message: "Configuration saved",
      savedAt: savedConfig.savedAt
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error saving config:", error);
    return new Response(JSON.stringify({ error: "Failed to save configuration" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
