export async function onRequestPost(context) {
    const { request, env } = context;
    const { email, password } = await request.json();
  
    const user = await env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(email).first();
  
    if (!user || !password) return new Response(JSON.stringify({ error: "Failed" }), { status: 401 });
  
    // [Include your hashing logic here from previous steps]
    
    // If password is correct, update the visit count in the database
    await env.DB.prepare("UPDATE users SET visits = visits + 1 WHERE id = ?")
      .bind(user.id)
      .run();
  
    return new Response(JSON.stringify({ message: "Welcome back!", visits: user.visits + 1 }), {
      headers: { "Content-Type": "application/json" }
    });
  }