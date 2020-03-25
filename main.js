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
    if (req.session.username !== undefined)
        return res.redirect('/home');
    
    return next();
}

function isAuthenticated(req, res, next) {
    if (req.session.username !== undefined) {
        res.locals.username = req.session.username;
        res.locals.isAdmin = req.session.isAdmin;
        res.locals.isPremium = req.session.isPremium;
        return next();
    }

    res.redirect('/login');
}


// ROUTES
app.get('/', alreadyAuthenticated, (req, res) => {
    res.render('index');
});

app.get('/login', alreadyAuthenticated, (req, res) => {
    let error = req.query.error;
    if (error == 1) res.locals.error1 = true;
    if (error == 2) res.locals.error2 = true;

    res.render('login');
});

app.get('/register', alreadyAuthenticated, (req, res) => {
    let error = req.query.error;
    if (error == 1) res.locals.error1 = true;
    if (error == 2) res.locals.error2 = true;

    res.render('register');
});

app.post('/login', alreadyAuthenticated, (req, res) => {
    let username = req.body.username;
    let password = req.body.password;

    if (username == "" || password == "")
        return res.redirect('/login?error=1');
    else if (!db.login(username, password))
        return res.redirect('/login?error=2');
    
    req.session.username = username;
    req.session.isAdmin = db.isAdmin(username);
    req.session.isPremium = db.isPremium(username);
    res.redirect('/home/');
});

app.post('/register', alreadyAuthenticated, (req, res) => {
    let username = req.body.username;
    let password = req.body.password;
    let email = req.body.email;

    if (username == "" || password == "" || email == "")
        return res.redirect('/register?error=1');
    if (!db.register(username, password, email))
        return res.redirect('/register?error=2');
    
    req.session.username = username;
    req.session.isAdmin = false;
    req.session.isPremium = false;
    res.redirect('/home/');
});


// AUTHENTICATION REQUIRED UNTIL HERE

app.get('/home/', isAuthenticated, (req, res) => {
    res.render('home/index');
});

app.use((express.static('public_html')));

app.listen(SERVER_PORT, console.log("Server listening on port " + SERVER_PORT));
