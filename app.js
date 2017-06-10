//Configuration
if (process.env.NODE_ENV === 'production') {
    var cfg = require('./config/config.production');
} else if (process.env.NODE_ENV === 'development') {
    var cfg = require('./config/config.development');
} else {
    console.error('No configuration ENV variable set!');
    process.exit(1);
}

const gpio_pin = cfg.rpi.GPIO_PIN;
const sensor_type = cfg.rpi.SENSOR_TYPE;
const database_name = cfg.db.DB_NAME;
const city_id = cfg.weather.WOEID;
const api_url = cfg.weather.API_URL;

console.log('Detected app environment: %s', process.env.NODE_ENV);
console.log('The app is set to read GPIO pin #%d with sensor type of %d', gpio_pin, sensor_type);

//Express
var express = require('express');
//Body parser
var bodyParser = require('body-parser');
//Twig
var twig = require('twig');
//Path
var path = require('path')
//Schedule
var schedule = require('node-schedule');
//SQLite3
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.cached.Database(database_name);
//Redis
var redis = require('redis');
var redisClient = redis.createClient();
//Response time
var rt = require('response-time');
//Axios
var axios = require('axios');

//DHT22 sensor library
var dht = require('node-dht-sensor');

//Connect to a redis server
redisClient.on('connect', function () {
    console.log('Redis client connected');
    //Poll RPi & Weather API
    poll();
});

//Initialize database structure
db.serialize(function () {
    db.run('CREATE TABLE if not exists data (id SERIAL PRIMARY_KEY, tstamp INTEGER, outerTemperature DECIMAL, outerHumidity DECIMAL, outerPressure DECIMAL, weatherCode INTEGER, innerTemperature DECIMAL, innerHumidity DECIMAL)');
    db.run('INSERT INTO data (tstamp, outerTemperature, outerHumidity, outerPressure, weatherCode, innerTemperature, innerHumidity) VALUES(' + Math.floor(new Date().getTime() / 1000) + ', 25, 95, 1020, 5, 10, 50)');
});

//Initialize the application
var app = express();

//App configuration
app.use(rt()); //Response time header
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.use(bodyParser.text());

//App port
var port = process.env.PORT | 3000;

/**
 * Schedule a new task to poll the sensors every 5 minutes. Update variables as needed
 * @return {[type]} [description]
 */
var sensorPoll = schedule.scheduleJob('*/5 * * * *', function () {
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
    dht.read(sensor_type, gpio_pin, function (error, temperature, humidity) {
        if (!error) {
            //Use axios to fetch from Yahoo!
            axios.get(cfg.weather.API_URL, {
                params: {
                    q: cfg.weather.QUERY,
                    format: 'json'
                }
            }).then((res) => {
                var atmosphere = res.data.query.results.channel.atmosphere;
                var outerTemperature = res.data.query.results.channel.item.condition.temp;
                var outerHumidity = atmosphere.humidity;
                var pressure = atmosphere.pressure;
                var weatherCode = res.data.query.results.channel.item.condition.code;
                var lastUpdate = res.data.query.results.channel.lastBuildDate;
                var city = res.data.query.results.channel.location.city;
                var region = res.data.query.results.channel.location.region;
                var innerTemperature = temperature.toFixed(1);
                var innerHumidity = humidity.toFixed(1);
                log(outerTemperature, outerHumidity, pressure, weatherCode, innerTemperature, innerHumidity);
                console.log('Weather data updated');
            }).catch((err) => {
                console.log(err);
            });
            console.log('Done logging sensor data.');
        } else {
            console.error('Error logging sensor data: ', error);
        }
    });
}

/**
 * Log a reading from the sensors.
 * @param {*} outerTemperature 
 * @param {*} outerHumidity 
 * @param {*} outerPressure 
 * @param {*} weatherCode 
 * @param {*} innerTemperature 
 * @param {*} innerHumidity 
 */
function log(outerTemperature, outerHumidity, outerPressure, weatherCode, innerTemperature, innerHumidity) {
    console.log(outerTemperature, outerHumidity, outerPressure, weatherCode, innerTemperature, innerHumidity);
    var stmt = db.prepare('INSERT INTO data (tstamp, outerTemperature, outerHumidity, outerPressure, weatherCode, innerTemperature, innerHumidity) VALUES(?, ?, ?, ?, ?, ?, ?)');
    stmt.run(Math.floor(new Date().getTime() / 1000), outerTemperature, outerHumidity, outerPressure, weatherCode, innerTemperature, innerHumidity);
    stmt.finalize();
}

/**
 * Returns the current reading of the sensors.
 * Redis is used to cache the result to speed things up.
 * @param  {Function} fn [description]
 * @return [type]        [description]
 */
function currentReading(fn) {
    redisClient.get('reading', function (err, reply) {
        //if the key exists, return int from redis
        if (reply) {
            fn(reply);
        } else {
            //Else, fetch it from database
            console.log('Fetching reading from database (Redis key has expired)');
            getCurrentReadingFromDatabase(function (res) {
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
    db.serialize(function () {
        db.all('SELECT * FROM data ORDER BY id DESC LIMIT 1', function (err, res) {
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
    db.serialize(function () {
        db.all('SELECT * FROM data', function (err, res) {
            fn(res);
        });
    });

}

//Routes
/**
 * Return current weather as a JSON string
 */
app.get('/', (request, response) => {
    currentReading(function (res) {
        response.type('json');
        response.send(res);
    });
});

/**
 * Start server
 */
app.listen(cfg.server.SERVER_PORT, (err) => {
    if (err) {
        return console.log('Error', err);
    }
    console.log('Back end is listening on port %d', cfg.server.SERVER_PORT);
})