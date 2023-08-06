const axios = require('axios');
const config = require('../../configs/config.json');
const qs = require('querystring');
const crypto = require('crypto');
const secure = require("crypto-js");

const {secret, secretWeb} = config;

const sign = (req, res, next, connection) => {
    const auth_data = req.get('x-vk');

    // if (!auth_data && !req.query.code) {
    //     return res.redirect('https://vk.com/kino');
    // }

    let URL_PARAMS = auth_data ? auth_data.split('?')[1] : [];
    if (URL_PARAMS && URL_PARAMS.includes('#')) {
        URL_PARAMS = URL_PARAMS.split('#')[0]
    }

    const urlParams = qs.parse(URL_PARAMS);

    const ordered = {};
    Object.keys(urlParams).sort().forEach((key) => {
        if (key.slice(0, 3) === 'vk_') {
            ordered[key] = urlParams[key]
        }
    });

    const stringParams = qs.stringify(ordered);
    const paramsHash = crypto
        .createHmac('sha256', secret)
        .update(stringParams)
        .digest()
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=$/, '');
    if ([paramsHash].includes(urlParams.sign)) {
        req.signedUser = parseInt(urlParams.vk_user_id);
    } else {
        res.status(403).send({success: false, sign_error: true});
    }
}

module.exports = sign;