const express = require("express");
const app = express();
const mysql = require('mysql2');
const axios = require('axios');

const qs = require('querystring');
const crypto = require('crypto');

const {servToken, secret, mysqlUser, mysqlPass, mysqlDB} = require('./config.json')

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
    return ([paramsHash === urlParams.sign, urlParams.vk_user_id]);
}

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
        url: `https://api.vkdonate.ru/?action=donates&count=1&key=687cd18fff00b26e0554`,
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
setInterval(checkDonate, 5000);

app.use((err, req, res, next) => {
    res.sendStatus(400);
});

app.get("/api/king/getUser", (req, res) => {
    getUser(req, res);
});


app.post("/api/king/buyPlace", async (req, res) => {
    const data = sign(req.headers['x-vk']);
    const user = data[1];
    const access = data[0];

    const payGroup = 2;
    const payUser = 1;

    let club = req.body.club;

    if (!access) {
        res.send({error: 403});
        return;
    }

    if (club) {
        const responce = await api('groups.getById', {
            group_id: club,
        });
        if (responce[0]) {
            club = responce[0].id;
        } else {
            return res.send('Ссылка на группу указана неверно');
        }
    }

    connection.query('SELECT * FROM users WHERE vkid = ?', [user], (e, r) => {
            if (!r[0]) {
                res.send({error: 'User don`t registered'});
            } else {
                if (r[0].balance < (club ? payGroup : payUser)) {
                    res.send({error: 'balance error'});
                } else {
                    connection.query('UPDATE users SET balance = balance - ? WHERE vkid = ?', [club ? payGroup : payUser, user]);
                    connection.query('DELETE FROM top WHERE vkid = ? AND isClub = ?', [club || user, club ? 1 : 0]);
                    connection.query('INSERT INTO top (vkid, isClub) VALUES (?, ?)', [club || user, club ? 1 : 0], (e, r) => {
                        if (e) return res.send(e);
                        getUser(req, res);
                    });
                }
            }
        }
    );
});

const random = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

const getUser = (req, res) => {
    const data = sign(req.headers['x-vk']);
    const user = data[1];
    const access = data[0];

    if (!access) {
        res.send({error: 403});
        return;
    }

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