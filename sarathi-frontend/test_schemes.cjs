const axios = require('axios');

async function testSchemes() {
    try {
        const res = await axios.get('https://mvbx0sv4n3.execute-api.us-east-1.amazonaws.com/prod/scheme/all');
        console.log(res.data);
    } catch (e) {
        console.error(e.response?.status, e.response?.data);
    }
}

testSchemes();
