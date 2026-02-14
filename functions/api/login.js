export async function onRequestPost(context) {
    const { request, env } = context;
    
    try {
      const { email, password } = await request.json();
  
      // 1. Find user
      const user = await env.DB.prepare("SELECT * FROM users WHERE email = ?")
        .bind(email)
        .first();
  
      if (!user) {
        return new Response(JSON.stringify({ error: "User not found" }), { status: 401 });
      }
  
      // 2. Hash incoming password to check match
      const msgUint8 = new TextEncoder().encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
      const loginHash = Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0')).join('');
  
      if (loginHash !== user.password_hash) {
        return new Response(JSON.stringify({ error: "Wrong password" }), { status: 401 });
      }
  
      // 3. Update visit count in D1
      await env.DB.prepare("UPDATE users SET visits = visits + 1 WHERE id = ?")
        .bind(user.id)
        .run();
  
      // 4. Return success + data
      return new Response(JSON.stringify({ 
        success: true, 
        email: user.email, 
        visits: user.visits + 1,
        pinned: user.pinned_links 
      }), { headers: { "Content-Type": "application/json" } });
  
    } catch (err) {
      return new Response(JSON.stringify({ error: "Server Error: " + err.message }), { status: 500 });
    }
  }