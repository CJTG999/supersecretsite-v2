export default {
    async fetch(request, env) {
      const url = new URL(request.url);
  
      // 1. Serve the API Route
      if (url.pathname === "/api/chat" && request.method === "POST") {
        const { prompt } = await request.json();
  
        // Calling Llama 3 via Cloudflare Workers AI with streaming enabled
        const stream = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
          prompt: prompt,
          stream: true, 
        });
  
        return new Response(stream, {
          headers: { "content-type": "text/event-stream" },
        });
      }
  
      // 2. Serve your HTML file (if you aren't using Pages)
      // If you are using GitLab + Cloudflare Pages, you don't need this part.
      return new Response("Use the API or check your Pages deployment.", { status: 404 });
    },
  };