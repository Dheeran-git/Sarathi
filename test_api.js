const axios = require('axios');
const BASE = 'https://mvbx0sv4n3.execute-api.us-east-1.amazonaws.com/prod';

// Fix: API Gateway returns Lambda proxy response { statusCode, headers, body }
// Must parse r.data.body (JSON string) to get the actual data array
axios.get(`${BASE}/scheme/all`)
  .then(r => {
    const data = typeof r.data.body === 'string' ? JSON.parse(r.data.body) : r.data;
    const schemes = Array.isArray(data) ? data : [];
    console.log('Schemes returned:', schemes.length);
    if (schemes.length > 0) console.log('First scheme:', schemes[0].nameEnglish);
  })
  .catch(e => console.error(e.response ? e.response.data : e.message));
