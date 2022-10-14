const UserAPI = require('./user');
const AuthAPI = require('./auth');
const PeatioAPI = require('./peatio');
const BarongAdminAPI = require('./barongAdmin');
const PeatioAdminAPI = require('./peatioAdmin');
const mysql = require('mysql2');
const config = require('../../../config.json');

let barongPool = null;
let peatioPool = null;

if (config.barongDB) {
	barongPool = mysql.createPool(config.barongDB);
}
if (config.peatioDB) {
	peatioPool = mysql.createPool(config.peatioDB);
}

module.exports = {
	userAPI: new UserAPI(),
	authAPI: new AuthAPI(),
	peatioAPI: new PeatioAPI(),
	barongAdminAPI: new BarongAdminAPI(),
	peatioAdminAPI: new PeatioAdminAPI(),
	barongPool: barongPool.promise(),
	peatioPool: peatioPool.promise()
};
