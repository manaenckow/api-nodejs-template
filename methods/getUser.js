const getUser = async (req, res, api) => {

    const user = req.signedUser;

    const [user_data] = await mysql.query('SELECT * FROM users WHERE vk_id = ?', [user]);

    if (!user_data[0]) {
        const {first_name, last_name, photo_200} = (await api('users.get', {
            user_id: user,
            lang: 'ru',
            fields: 'photo_200'
        }))[0];

        let ref_name, ref_vk_id, ref_photo_200 = '';

        if (parseInt(ref)) {
            const refUserData = (await api('users.get', {
                user_id: parseInt(ref),
                lang: 'ru',
                fields: 'photo_200',
                name_case: 'acc'
            }))[0];

            ref_name = `${refUserData.first_name} ${refUserData.last_name}`;
            ref_vk_id = refUserData.id;
            ref_photo_200 = refUserData.photo_200;
        }

        const [insert_user] = await mysql.query(
            'INSERT INTO users (vk_id, name, photo_200, owner_name, owner_vk_id, owner_photo, is_infected) ' +
            'VALUES (?, ?, ?, ?, ?, ?, ?)',
            [
                user,
                `${first_name} ${last_name}`,
                photo_200,
                ref_name,
                ref_vk_id || 0,
                ref_photo_200,
                ref_vk_id ? 1 : 0
            ]);
            let response = {
                coins: 10,
                is_infected: ref_vk_id ? 1 : 0,
                virus_instance: 1,
                owner_name: ref_name,
                owner_vk_id: ref_vk_id || 0,
                owner_photo_200: ref_photo_200,
                vk_id: user,
                heals: 0,
                vip: 0
            };

            res.send(insert_user.affectedRows ? response : {success: false});
    } else {
        res.send(user_data[0]);
    }
}

module.exports = getUser;
