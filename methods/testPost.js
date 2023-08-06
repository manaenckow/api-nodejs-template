const testPost = (req, res, sign, connection, api) => {
    const user = sign(req.headers['x-vk'], res);
    if (!user) return;

    connection.query('SELECT * FROM users WHERE vkid = ?', [user], (e, r) => {
            if (!r[0]) {
                connection.query('INSERT INTO users (vkid) VALUES (?)', [user], () => {
                    res.send({
                        balance: 0,
                        vkid: user
                    });
                });
            } else {
                return r[0];
            }
        }
    );
}

module.exports = testPost;