const axios = require('axios');

const BASE_URL = 'https://mvbx0sv4n3.execute-api.us-east-1.amazonaws.com/prod';

async function testApply() {
    try {
        const res = await axios.post(`${BASE_URL}/apply`, {
            citizenId: 'testuser',
            schemeId: 'foo',
            schemeName: 'Foo Scheme'
        });
        console.log('Success:', res.data);
    } catch (err) {
        console.error('Error status:', err.response?.status);
        console.error('Error data:', err.response?.data);
    }
}

testApply();
