# Raspberry Pi Weather Service back end

## Introduction

A Node.js application that runs on a Raspberry Pi.

The app polls sensors plugged into the Pi in 5 minute intervals and saves the data for later use. It also fetches local weather forecast data from Yahoo!'s weather API.

## Technical stuff

* Data is stored on an SQLite database and Redis is used to cache it to improve performance
* Measurements are scheduled with node-schedule
* The DHT22 sensor is used to log indoor temperature & humidity. In addition, a MCP3002 D2A converter is wired to a TMP36 analog temperature sensor to provide a 'backup' incase the DHT22 fails.

## Requirements ##

* A Raspberry Pi (Any model will do)
* BCM2835 library
* A suitable temperature sensor that can interact with the Node.js backend
* Redis server
* Node.js


## Installation instructions ##

* Install Redis server, Node.js and the BCM2835 library
* Connect your temperature sensor to your Raspberry Pi
* Clone the repo & npm install
* Configure the sensor settings to point to the correct GPIO pin & sensor type (if you use a sensor that is not DHT22, with a few modifications you will get it working).
* redis-server && npm start