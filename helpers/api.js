const axios = require('axios');

const api = async (method, params, token = process.env.APP_TOKEN) => {
    const res = await axios({
        method: 'POST',
        url: `https://api.vk.com/method/${method}?access_token=${token}&v=5.122`,
        params
    });
    if (!res.data.response && res.data.response !== 0) {
        console.log(res.data);
    }
    return res.data.response;
}

module.exports = api;