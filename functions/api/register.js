export async function onRequestPost(context) {
    const { request, env } = context;
    
    try {
      const { email, password } = await request.json();
  
      // Simple Hash (For production, use a more robust helper or library)
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const passwordHash = Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0')).join('');
  
      // Insert into D1
      await env.DB.prepare(
        "INSERT INTO users (email, password_hash) VALUES (?, ?)"
      ).bind(email, passwordHash).run();
  
      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" }
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: "User already exists or invalid data" }), { 
        status: 400 
      });
    }
  }