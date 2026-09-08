const http = require('http');

async function testFlow() {
  // 1. Request OTP
  const reqRes = await fetch('http://localhost:3000/api/deals/DLT-16YXCQG3/request-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'client@example.com' })
  });
  console.log("Request OTP status:", reqRes.status);
  
  // 2. We need the OTP from the database to verify it.
  // I will just use the admin client directly to fetch the OTP.
}

testFlow();
