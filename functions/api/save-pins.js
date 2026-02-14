export async function onRequestPost(context) {
    const { request, env } = context;
    const { email, pinned_links } = await request.json();
  
    try {
      await env.DB.prepare("UPDATE users SET pinned_links = ? WHERE email = ?")
        .bind(pinned_links, email)
        .run();
      return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
  }