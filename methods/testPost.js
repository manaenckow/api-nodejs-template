const testPost = (req, res, api) => {
    const user = req.signedUser;

    mysql.query('SELECT * FROM users WHERE vkid = ?', [user]);
    mysql.query('INSERT INTO users (vkid) VALUES (?)', [user]);
}

module.exports = testPost;