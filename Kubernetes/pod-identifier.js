// Simple script to identify which pod is handling requests
import http from 'http';

function makeRequest() {
  http.get('http://localhost:4324/', (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      console.log(`Request received response with status: ${res.statusCode}`);
      // You'll see different results as requests get distributed across pods
    });
  }).on('error', (err) => {
    console.error(`Error: ${err.message}`);
  });
}

// Make 10 requests with a small delay between them
for (let i = 0; i < 10; i++) {
  setTimeout(() => makeRequest(), i * 500);
}
