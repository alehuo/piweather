### Raspberry Pi Weather Service

A Node.js application that runs on a Raspberry Pi.

The app polls sensors plugged into the Pi in 5 minute intervals and saves the data for later use. Currently we only log temperature and humidity.
At the end of the day the Pi analyzes the captured data and sends emails to predefined e-mail addresses.
The email message will include day's minimum, maximum and average temperatures and humidity.

* Data is stored on an SQLite database and Redis is used to cache it to improve performance
* Express is used with Twig to represent the current readings on a webpage
* Measurements are scheduled with node-schedule
* The DHT22 sensor is used to log outdoor temperature & humidity. In addition, an MCP3002 (d2a converter) chip is wired to a TMP36 analog temperature sensor to log indoor temperature.

* Currently only the DHT22 sensor is used. *

## Steps ##

* Install Redis server
* Use a DHT22 sensor with Raspberry Pi
* Clone the repo & install the dependencies
* Configure the sensor settings to point to the correct GPIO pin & sensor type
