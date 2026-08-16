async function run() {
  try {
    console.log('Sending request-otp request to http://localhost:3001...');
    const res = await fetch('http://localhost:3001/api/deals/test-token-123/request-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email: 'test-client@example.com' })
    });
    console.log('Status:', res.status);
    const text = await res.text();
    console.log('Response body:', text);
  } catch (err) {
    console.error('Error hitting localhost:3001:', err);
  }
}

run();
