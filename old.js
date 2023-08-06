const express = require("express");
const app = express();
const mysql = require('mysql2');
const axios = require('axios');

const qs = require('querystring');
const crypto = require('crypto');

const {servToken, secret, mysqlUser, mysqlPass, mysqlDB, donateKey} = require('./config.json')

app.use(express.json());

const listener = app.listen(3435, () => {
    console.log("Your app is listening on port " + listener.address().port);
});

var connection = mysql.createConnection({
    host: 'localhost',
    user: mysqlUser,
    password: mysqlPass,
    database: mysqlDB
});

let usersFlood = [];

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

setInterval(() => {
    usersFlood = [];
}, 60000);

const api = async (method, params) => {
    const res = await axios({
        method: 'GET',
        url: `https://api.vk.com/method/${method}?access_token=${servToken}&v=5.124`,
        params
    });
    return res.data.response || res.data;
}

const checkDonate = (data = {}) => {
    axios({
        method: 'GET',
        url: `https://api.vkdonate.ru/?action=donates&count=1&key=${donateKey}`,
        data
    }).then(res => {
        const data = res.data.donates ? res.data.donates[0] : false;
        if (!data) return;

        const {id, uid, sum} = data;

        connection.query('SELECT * FROM donates WHERE uniq = ?', [id], (e, donate) => {
            if (!donate[0]) {
                connection.query('INSERT INTO donates (uniq, vkid, summ) VALUES (?, ?, ?)', [id, uid, sum]);
                connection.query('UPDATE users SET balance = balance + ? WHERE vkid = ?', [parseInt(sum), uid]);
            }
        });
    })

}
//setInterval(checkDonate, 5000);

app.use((err, req, res, next) => {
    res.sendStatus(400);
});

app.get("/api/test/getUser", (req, res) => {
    getUser(req, res);
});


app.post("/api/test/post", async (req, res) => {
    const user = sign(req.headers['x-vk'], res);
    if (!user) return;

    res.seng(user);
});

const getUser = (req, res) => {
    const user = sign(req.headers['x-vk'], res);

    if (!user) return;

    connection.query('SELECT * FROM top LIMIT 200', async (e, top) => {

        const clubs = top.filter(e => e.isClub);
        const users = top.filter(e => !e.isClub);

        const clubsIDs = [];
        const usersIDs = [];

        clubs.forEach(e => clubsIDs.push(e.vkid));
        users.forEach(e => usersIDs.push(e.vkid));

        let clubsData = await api('groups.getById', {
            group_ids: clubsIDs.toString(),
            fields: 'description',
            lang: 'ru'
        });

        let usersData = await api('users.get', {
            user_ids: usersIDs.toString(),
            fields: 'photo_200',
            lang: 'ru'
        });

        const data = [...clubsData, ...usersData];

        connection.query('SELECT * FROM users WHERE vkid = ?', [user], (e, r) => {
                if (!r[0]) {
                    connection.query('INSERT INTO users (vkid) VALUES (?)', [user], () => {
                        res.send({
                            balance: 0,
                            vkid: user,
                            top,
                            data
                        });
                    });
                } else {
                    r[0].top = top;
                    r[0].data = data;
                    res.send(r[0]);
                }
            }
        );
    });
}

const random = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};