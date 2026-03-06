const http = require('https');

const options = {
    hostname: 'mvbx0sv4n3.execute-api.us-east-1.amazonaws.com',
    port: 443,
    path: '/prod/apply',
    method: 'OPTIONS',
    headers: {
        'Origin': 'http://localhost:5174',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'authorization,content-type'
    }
};

const req = http.request(options, (res) => {
    console.log('STATUS:', res.statusCode);
    console.log('HEADERS:', res.headers);
});

req.on('error', (e) => {
    console.error('ERROR:', e.message);
});

req.end();
