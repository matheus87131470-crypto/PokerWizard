const http = require('http');

const data = JSON.stringify({ user: 'me', position: 'BTN' });

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/trainer/generate',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data),
  },
  timeout: 5000,
};

const req = http.request(options, (res) => {
  let body = '';
  res.setEncoding('utf8');
  res.on('data', (chunk) => (body += chunk));
  res.on('end', () => {
    try {
      const parsed = JSON.parse(body);
      console.log(JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.log('Invalid JSON response:');
      console.log(body);
    }
  });
});

req.on('error', (e) => {
  console.error('Request error:', e.message);
});
req.on('timeout', () => {
  console.error('Request timed out');
  req.destroy();
});

req.write(data);
req.end();
