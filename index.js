// Mpdules
const express = require("express");
const app = express();
const mysql = require('mysql2');

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

const connection = mysql.createConnection(mysqlConfig);

app.use((err, req, res) => {
    res.status(500).send('internal error');
});

app.use((req, res, next) => {
    if (req.method !== 'OPTIONS' && !['/api/app/callBack', '/api/app/alice25323'].includes(req.url)) {
        sign(req, res, next);
    }
    next();
});

app.get("/api/test/getUser", (req, res) => {
    getUser(req, res, connection, api);
});


app.post("/api/test/post", (req, res) => {
   
});

const random = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};
