const {botToken} = require('../config.json');
const api = require('./api.js');

const reply = (message, peer_id) => {
    api('messages.send', {
        message,
        peer_id,
        random_id: 0
    }, botToken);
};

module.exports = reply;