/**
 * @author alehuo
 */

//DHT22 sensor library
var dht = require('node-dht-sensor');

const gpio_pin = 4;
const sensor_type = 22;

dht.read(sensor_type, gpio_pin, function(err, temperature, humidity) {
    if (!err) {
        console.log("Temperature: %d, humidity: %d", temperature.toFixed(1), humidity.toFixed(1));
        console.log('Done reading sensor.');
    } else {
        console.error('Error reading sensor: ', err);
    }
});
