/**
 * Created by dbroqua on 8/16/16.
 */

module.exports.env = {
    env: 'development'
};

module.exports.mongodb = {
    url: process.env.MONGO_URL,
    collection: 'PiCam',
    user: process.env.MONGO_USER,
    pass: process.env.MONGO_PASSWORD,
    port: process.env.MONGO_PORT
};

module.exports.autoInstall = {
    user: {
        first_name: 'admin',
        last_name: 'admin',
        mail: 'pi@raspberry',
        password: 'admin',
        apikey: 'Phe6ZaexiereiLaiqueimahthei7pahcouch2eeTohshiezai6tec7Om6deeghaichahw6ongiewa3einoe3uoth9einga4cieGah3daaD0seePhais6vahd',
        active: true
    }
};