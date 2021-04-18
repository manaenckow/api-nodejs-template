const {secret} = require('../config.json');

const sign = (e, res) => {
    let URL_PARAMS = e ? e.split('?')[1] : [];
    if (URL_PARAMS && URL_PARAMS.includes('#')) {
        URL_PARAMS = URL_PARAMS.split('#')[0]
    }
    const urlParams = qs.parse(URL_PARAMS);
    const ordered = {};
    Object.keys(urlParams).sort().forEach((key) => {
        if (key.slice(0, 3) === 'vk_') {
            ordered[key] = urlParams[key];
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
    if(paramsHash === urlParams.sign){
        if (usersFlood[urlParams.vk_user_id] !== undefined) {
            if (usersFlood[urlParams.vk_user_id] > 10) {
                res.send('Слишком много запросов за минуту. Попробуйте позже.');
                return;
            }
            usersFlood[urlParams.vk_user_id] = usersFlood[urlParams.vk_user_id] + 1;
        } else {
            usersFlood[urlParams.vk_user_id] = 0
        }
        return parseInt(urlParams.vk_user_id);
    } else {
        res.send({error: 403});
    }
}

let usersFlood = [];

setInterval(() => {
    usersFlood = [];
}, 60000);


module.exports = sign;