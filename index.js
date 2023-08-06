// Mpdules
const express = require("express");
const app = express();
const mysql2 = require('mysql2');
const dotenv = require('dotenv');
dotenv.config();

// Configs
const mysqlConfig = require('./mysqlConfig.json')

//Helpers
const sign = require('./helpers/sign.js');
const api = require('./helpers/api.js');
const reply = require('./helpers/reply.js');

//Methods
const getUser = require('./methods/getUser.js');
const testPost = require('./methods/testPost.js');
app.use(express.json());

const listener = app.listen(3435, () => {
    console.log("Your app is listening on port " + listener.address().port);
});

global.mysql2 = mysql2.createConnection(mysqlConfig);

app.use((req, res, error, next) => {
    res.send('internal error');
});

app.use(async (req, res, next) => {
    if (
        req.method !== 'OPTIONS'
        && !['/api/asb/getCloniumBannerInfo', '/api/asb/callBack', '/api/asb/alice25323', '/api/asb/getClonServer'].includes(req.url)
    ) {
        await sign(req, res, next);
        next();
    } else {
        next();
    }
});

app.get("/api/test/getUser", getUser);


app.post("/api/test/post", testPost);

const random = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};
