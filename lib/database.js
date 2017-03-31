//PostgreSQL
var pg = require('pg');

//Database configuration
var dbConfiguration = require('./../config/database.json');
const pool = new pg.Pool(dbConfiguration);

pool.on('error', function(err, client) {
    console.error('Client error', err.message, err.stack);
});

module.exports.query = function(text, values, callback) {
    console.log('query: ', text, values);
    return pool.query(text, values, callback);
}

module.exports.connect = function(callback) {
    return pool.connect(callback);
};
