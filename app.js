/**
 * @author alehuo
 */

//Express
var express = require('express');
//Twig
var twig = require('twig');
//Path
var path = require('path')
//MySQL
var mysql = require('mysql');

//Initialize app
var app = express();

//App configuration
app.set('views', './templates');
app.set('view engine', 'twig');
app.use(express.static(path.join(__dirname, 'public')));

//App port
var port = 3000

//Database configuration
var dbConfiguration = require('./config/database.json');
var connection = mysql.createConnection(dbConfiguration);
connection.connect();

//We should use pooling to improve database performance.


//Routes

/**
 * Default route
 */
app.get('/', (request, response) => {
    //Returns all users from the database
    response.render('index');
});

/**
 * List all users from database
 */
app.get('/users', (request, response) => {
    //Returns all users from the database
    connection.query('SELECT * FROM users', function(error, results, fields) {
        if (error)
            throw error;
        response.render('users', {users: results});
    });

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
