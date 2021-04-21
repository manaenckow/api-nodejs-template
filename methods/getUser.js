let response;
const getUser = (req, res, connection, api, user, ref) => {
    connection.query('SELECT * FROM users WHERE vk_id = ?', [user], async (e, r) => {
            if (!r[0]) {
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

                connection.query(
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
                    ], (e, r) => {
                        if (e) return e;
                        response = {
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
                    });
            } else {
                response = r[0];
            }
        }
    );
    return response;
}

module.exports = getUser;
