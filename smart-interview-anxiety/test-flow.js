const http = require('http');

async function testFlow() {
  console.log("1. Testing Forgot Password...");
  const res = await fetch('http://localhost:3000/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'nancyflora804@gmail.com' })
  });
  
  const text = await res.text();
  console.log("Forgot Password Response:", text);
}

testFlow().catch(console.error);
