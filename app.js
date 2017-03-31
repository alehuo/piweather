/**
 * @author alehuo
 */

//Express
var express = require('express');
//Twig
var twig = require('twig');
//Path
var path = require('path')
//Schedule
var schedule = require('node-schedule');

//Initialize application
var app = express();

//App configuration
app.set('views', './templates');
app.set('view engine', 'twig');
app.use(express.static(path.join(__dirname, 'public')));

//App port
var port = 3000

//PostgreSQl pool
var pool = require('./lib/database.js');

function currentReading() {}

//Routes

/**
 * Default route
 */
app.get('/', (request, response) => {
    pool.connect(function(err, client, done) {
        if (err) {
            return console.error('Error fetching client', err);
        }

        client.query('SELECT * FROM data ORDER BY id DESC LIMIT 1', [], function(err, result) {
            done(err);

            if (err) {
                return console.error('Query error', err);
            }
            response.render('index', result.rows[0]);
        });
    });
});

//Poll sensors every x minutes
var sensorPoll = schedule.scheduleJob('*/5 * * * *', function() {
    console.log('Logging sensor data');
});

/**
 * Start server
 */
app.listen(port, (err) => {
    if (err) {
        return console.log('Error', err);
    }

    console.log('Listening on ' + port);
})

/*

FUNCTIONS

 */

/**
 * Log a reading from the sensors.
 * @param  {[type]} temperature [description]
 * @param  {[type]} humidity    [description]
 * @param  {[type]} pressure    [description]
 * @return {[type]}             [description]
 */
function log(temperature, humidity, pressure) {
    pool.connect(function(err, client, done) {
        if (err) {
            return console.error('Error fetching client', err);
        }

        client.query('INSERT INTO data (unixtimestamp, temperature, humidity, pressure) VALUES($1, $2, $3, $4)', [
            '1', temperature, humidity, pressure
        ], function(err, result) {
            done(err);

            if (err) {
                return console.error('Query error', err);
            }
            console.log(result);
        });
    });
}
