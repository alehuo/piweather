### Raspberry Pi Weather Service

A Node.js application that runs on a Raspberry Pi.

The app polls sensors plugged into the Pi in 5 minute intervals and saves the data for later use. Currently we only log temperature and humidity.
At the end of the day the Pi analyzes the captured data and sends emails to predefined e-mail addresses.
The email message will include day's minimum, maximum and average temperatures and humidity.

* Data is stored on an SQLite database and Redis is used to cache it to improve performance
* Express is used with Twig to represent the current readings on a webpage
* Measurements are scheduled with node-schedule
