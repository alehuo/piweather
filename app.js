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
//SQLite3
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.cached.Database('weatherdata.db');

//Create tables
db.serialize(function() {
    db.run('CREATE TABLE if not exists data (id INTEGER PRIMARY KEY, unixtimestamp INTEGER, temperature DECIMAL, humidity DECIMAL, pressure DECIMAL)');
});

//Initialize the application
var app = express();

//App configuration
app.set('views', './templates');
app.set('view engine', 'twig');
app.use(express.static(path.join(__dirname, 'public')));

//App port
var port = 3000

//Routes

/**
 * Default route
 */
app.get('/', (request, response) => {
    currentReading(function(res) {
        response.render('index', res);
    });
});

/**
 * Schedule a new task to poll the sensors every 5 minutes. Update variables as needed
 * @return {[type]} [description]
 */
var sensorPoll = schedule.scheduleJob('*/5 * * * *', function() {
    console.log('Logging sensor data (timestamp: %d)', Math.floor(new Date().getTime() / 1000));
    //Just for testing purposes
    var temp = parseFloat(Math.random() * 20 + 10).toFixed(2); //Between 10 and 30
    var humid = parseFloat(Math.random() * 60 + 40).toFixed(2); //Between 40 and 100
    var press = 1020;
    log(temp, humid, press);
    console.log('Done logging sensor data.');
});

/**
 * Start server
 */
app.listen(port, (err) => {
    if (err) {
        return console.log('Error', err);
    }

    console.log('Listening on port %d', port);
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
    console.log('temp: %d, humidity: %d, pressure: %d', temperature, humidity, pressure);
    var db = new sqlite3.Database('weatherdata.db');
    var stmt = db.prepare('INSERT INTO data (unixtimestamp, temperature, humidity, pressure) VALUES(?, ?, ?, ?)');
    stmt.run(Math.floor(new Date().getTime() / 1000), temperature, humidity, pressure);
    stmt.finalize();
}

/*getAll(function(res) {
    console.log(JSON.stringify(res));
});*/

/**
 * Returns the current reading of the sensors
 * @param  {Function} fn callback
 * @return String      Error
 */
function currentReading(fn) {
    db.serialize(function() {
        db.all('SELECT * FROM data ORDER BY id DESC LIMIT 1', function(err, res) {
            fn(res[0]);
        });
    });

}

function getAll(fn) {
    db.serialize(function() {
        db.all('SELECT * FROM data', function(err, res) {
            fn(res);
        });
    });

}
