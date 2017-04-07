/**
 * @author alehuo
 */

//DHT22 sensor library
var dht = require('node-dht-sensor');

const gpio_pin = 4;
const sensor_type = 22;

dht.read(gpio_pin, sensor_type, function(err, temperature, humidity) {
    if (!err) {
        console.log("Temperature: %d, humidity: %d", temp.toFixed(1), humid.toFixed(1));
        console.log('Done reading sensor.');
    } else {
        console.err('Error reading sensor.');
    }
});
