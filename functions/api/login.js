export async function onRequestPost(context) {
    const { request, env } = context;
    const { email, password } = await request.json();
  
    // 1. Look up the user by email
    const user = await env.DB.prepare("SELECT * FROM users WHERE email = ?")
      .bind(email)
      .first();
  
    if (!user) {
      return new Response(JSON.stringify({ error: "Invalid email or password" }), { status: 401 });
    }
  
    // 2. Hash the provided password to see if it matches the stored one
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const loginHash = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0')).join('');
  
    // 3. Compare hashes
    if (loginHash !== user.password_hash) {
      return new Response(JSON.stringify({ error: "Invalid email or password" }), { status: 401 });
    }
  
    // Replace the return in login.js with this:
return new Response(JSON.stringify({ message: "Login successful!" }), {
    headers: { 
      "Content-Type": "application/json",
      "Set-Cookie": `session=${user.id}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=3600`
    }
  });
  }