// Quick error catcher - run with: node scratch/error_check.js
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5173,
  path: '/',
  method: 'GET',
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Content length:', data.length);
    if (data.includes('Vite Error')) {
      console.log('VITE ERROR FOUND IN HTML');
    }
    if (data.includes('Error')) {
      const lines = data.split('\n');
      lines.forEach((line, i) => {
        if (line.includes('Error')) console.log(`Line ${i}: ${line.trim().substring(0, 200)}`);
      });
    }
    console.log('\n=== First 500 chars ===');
    console.log(data.substring(0, 500));
  });
});

req.on('error', (e) => {
  console.error('Connection error:', e.message);
});

req.setTimeout(3000, () => {
  console.log('Request timed out');
  req.destroy();
});

req.end();
