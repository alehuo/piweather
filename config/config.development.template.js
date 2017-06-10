module.exports = {
    server: {
        SERVER_PORT: process.env.PORT ||  3000
    },
    db: {
        DB_NAME: 'weatherdata.sqlite'
    },
    rpi: {
        GPIO_PIN: 4,
        SENSOR_TYPE: 22
    },
    weather: {
        API_URL: 'https://query.yahooapis.com/v1/public/yql',
        QUERY: 'select * from weather.forecast where woeid = 565346 and u="c"'
    }
};