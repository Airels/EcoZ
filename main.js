"use strict"
const express = require('express');
const mustache = require('mustache-express');
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const SERVER_PORT = 3000;

const db = require('./db')

const app = express();

app.engine('html', mustache());
app.use(bodyParser.urlencoded({ extended: false}));
app.use(cookieSession({ secret: Math.floor(Math.random()*100).toString() }));

app.set('view engine', 'html');
app.set('views', './public_html');

// MIDDLEWARES
function alreadyAuthenticated(req, res, next) {
    if (req.session.user !== undefined)
        res.redirect('/home');
    
    return next();
}


// ROUTES
app.get('/', (req, res) => {
    res.render('index');
});

app.get('/login', alreadyAuthenticated, (req, res) => {
    res.render('login');
});

app.get('/register', alreadyAuthenticated, (req, res) => {
    res.render('register');
});

app.post('/login', alreadyAuthenticated, (req, res) => {
    let username = req.body.username;
    let password = req.body.password;

    if (username === undefined || password === undefined)
        res.redirect('/login?error=1');

    if (!db.login(username, password))
        res.redirect('/login?error=2');

    req.session.username = username;
    req.session.isAdmin = db.isAdmin(username);
    req.session.isPremium = db.isPremium(username);

    res.redirect('/home/');
});

app.post('/register', alreadyAuthenticated, (req, res) => {

});


// AUTHENTICATION REQUIRED UNTIL HERE
app.use((req, res, next) => {
    if (req.session.user !== undefined) {
        res.locals.auth = true;
        return next();
    }

    res.redirect('/login');
});


app.get('/home/', (req, res) => {
    res.render('home/index');
});

app.use((express.static('public_html')));

app.listen(SERVER_PORT, console.log("Server listening on port " + SERVER_PORT));
