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
var db = new sqlite3.cached.Database('weatherdata.sqlite');
//Redis
var redis = require('redis');
var redisClient = redis.createClient();
//Response time
var rt = require('response-time');

//DHT22 sensor library
var dht = require('node-dht-sensor');
//GPIO pin and sensor type
const gpio_pin = 4;
const sensor_type = 22;

//Connect to a redis server
redisClient.on('connect', function() {
    console.log('Redis client connected');
    //Poll the sensors
    poll();
});

//Initialize database structure
db.serialize(function() {
    db.run('CREATE TABLE if not exists data (id SERIAL PRIMARY KEY, timestamp INTEGER, temperature DECIMAL, humidity DECIMAL, pressure DECIMAL)');
});

//Initialize the application
var app = express();

//App configuration
app.set('views', './templates'); //Template folder
app.set('view engine', 'twig'); //Twig
app.use(express.static(path.join(__dirname, 'public'))); //Set a static path for resources (js, css, etc..)
app.use(rt()); //Response time header

//App port
var port = 3000

/**
 * Schedule a new task to poll the sensors every 5 minutes. Update variables as needed
 * @return {[type]} [description]
 */
var sensorPoll = schedule.scheduleJob('*/5 * * * *', function() {
    poll();
});

/*

FUNCTIONS

 */

/**
 * Polling function.
 * @return {[type]} [description]
 */
function poll() {
    console.log('Logging sensor data (timestamp: %d)', Math.floor(new Date().getTime() / 1000));

    dht.read(gpio_pin, sensor_type, function(err, temperature, humidity) {
        if (!err) {
            var press = 1020;
            log(temp.toFixed(1), humid.toFixed(1), press);
            console.log('Done logging sensor data.');
        } else {
            console.err('Error logging sensor data.');
        }
    });

    //Just for testing purposes
    //var temp = parseFloat(Math.random() * 20 + 10).toFixed(2); //Between 10 and 30
    //var humid = parseFloat(Math.random() * 60 + 40).toFixed(2); //Between 40 and 100

}

/**
 * Log a reading from the sensors.
 * @param  {[type]} temperature [description]
 * @param  {[type]} humidity    [description]
 * @param  {[type]} pressure    [description]
 * @return {[type]}             [description]
 */
function log(temperature, humidity, pressure) {
    console.log('temp: %d, humidity: %d, pressure: %d', temperature, humidity, pressure);
    var stmt = db.prepare('INSERT INTO data (timestamp, temperature, humidity, pressure) VALUES(?, ?, ?, ?)');
    stmt.run(Math.floor(new Date().getTime() / 1000), temperature, humidity, pressure);
    stmt.finalize();
}

/**
 * Returns the current reading of the sensors.
 * Redis is used to cache the result to speed things up.
 * @param  {Function} fn [description]
 * @return [type]        [description]
 */
function currentReading(fn) {
    redisClient.get('reading', function(err, reply) {
        //if the key exists, return int from redis
        if (reply) {
            fn(reply);
        } else {
            console.log('Fetching reading from database (Redis key expired)');
            //Else, fetch it from database
            getCurrentReadingFromDatabase(function(res) {
                var data = JSON.stringify(res);
                redisClient.set('reading', data);
                //Redis expire time is 5 minutes.
                redisClient.expire('reading', 360);
                fn(data);
            });
        }
    });
}

/**
 * Fetches the current reading from the database.
 * @param  {Function} fn [description]
 * @return [type]        [description]
 */
function getCurrentReadingFromDatabase(fn) {
    db.serialize(function() {
        db.all('SELECT timestamp, temperature, pressure, humidity FROM data ORDER BY id DESC LIMIT 1', function(err, res) {
            fn(res[0]);
        });
    });
}

/**
 * Fetches all results from the database.
 * @param  {Function} fn [description]
 * @return [type]        [description]
 */
function getAll(fn) {
    db.serialize(function() {
        db.all('SELECT * FROM data', function(err, res) {
            fn(res);
        });
    });

}

//Routes

/**
 * Status page
 */
app.get('/', (request, response) => {
    currentReading(function(res) {
        var obj = JSON.parse(res);
        response.render('index', obj);
    });
});

/**
 * Return as a JSON string instead
 */
app.get('/api', (request, response) => {
    currentReading(function(res) {
        response.type('json');
        response.send(res);
    });
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
