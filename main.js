"use strict"
const express = require('express');
const mustache = require('mustache-express');
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const SERVER_PORT = 3000;

const db = require('./db')
const utils = require('./utils');

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
        res.locals.connected = true;
        return next();
    }

    res.redirect('/login');
}

function isInQuestionSession(req, res, next) {
    if (req.session.inQuestionSession !== undefined)
        return next();
    
    res.redirect('/home/');
}

function isPremium(req, res, next) {
    if (req.session.isPremium)
        return next();

    res.send(403);
}

function isAdmin(req, res, next) {
    if (req.session.isAdmin)
        return next();

    res.send(404); // To hide to non-admin users admin pages
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
    req.session.points = db.getPoints(username);
    req.session.isAdmin = db.isAdmin(username);
    req.session.isPremium = db.isPremium(username);
    res.redirect('/home/');
});


// AUTHENTICATION REQUIRED UNTIL HERE
app.get('/home/', isAuthenticated, (req, res) => {
    let data = {};

    res.render('home/index', data);
});

// QUESTIONS
app.get('/home/startQuestions', isAuthenticated, (req, res) => {
    if (req.session.inQuestionSession !== undefined)
        return res.redirect('/home/q');

    req.session.inQuestionSession = true;
    req.session.idQuestionsDone = [];
    req.session.actualIDQuestion = utils.getRandomInt(db.getNbOfQuestions())+1;

    res.redirect('/home/q');
});

app.get('/home/q', isAuthenticated, isInQuestionSession, (req, res) => {
    let questionResult = db.getQuestion(req.session.actualIDQuestion);
    /*
        QUESTION OBJECT :
        question.id,
        question.title,
        question.creator,
        question.creationDate <- (timestamp),
        question.listIDAnswers <- (must be splitted by ','),
        question.idCorrectAnswer
    */

    let answersString = questionResult.listIDAnswers.split(',');
    let answersArray = [];

    answersString.forEach(idAnswer => {
        answersArray.push(db.getAnswer(idAnswer));
    });
    /*
        ANSWER OBJECT :
        answer.id,
        answer.content
    */

    let data = {
        question: questionResult,
        answers: answersArray
    }

    res.render('home/question', data);
});

app.get('/home/a', isAuthenticated, isInQuestionSession, (req, res) => {
    req.session.idQuestionsDone.push(req.session.actualIDQuestion);

    if (db.isGoodAnswer(req.session.actualIDQuestion, req.query.id)) // req.query.a = ID Answer
        req.session.points += 1;
    else
        req.session.points -= 1;

    if (req.session.idQuestionsDone.length >= 2)
        return res.redirect("endQuestions");


    req.session.idQuestionsDone.push(req.params.id); // ADDING ACTUAL QUESTION

    let nbOfQuestions = db.getNbOfQuestions();

    do {
        req.session.actualIDQuestion = utils.getRandomInt(nbOfQuestions)+1;
    } while (req.session.idQuestionsDone.includes(req.session.actualIDQuestion)); // CONTINUE UNTIL FOUND QUESTION NOT ASKED BEFORE

    res.redirect('/home/q');
});

app.get('/home/endQuestions', isAuthenticated, isInQuestionSession, (req, res) => {
    req.session.inQuestionSession = undefined;
    req.session.idQuestionsDone = undefined;

    let data = {
        oldPoints: db.getPoints(req.session.username),
        newPoints: req.session.points,
        questionsAsked: req.session.idQuestionsDone,
        goodAnswers: [] // TODO
    }
    res.render('home/endQuestions', data);

    db.setPoints(req.session.username, req.session.points);
});

// USER PROFILE SETTINGS
app.get('/home/profile', isAuthenticated, (req, res) => {

});

app.get('/home/profile/changePassword', isAuthenticated, (req, res) => {

});

app.post('/home/profile/changePassword', isAuthenticated, (req, res) => {

});

app.get('/home/profile/deleteProfile', isAuthenticated, (req, res) => {

});

app.post('/home/profile/deleteProfile', isAuthenticated, (req, res) => { // Have to enter password to confirm deletion

});

app.get('/home/addQuestion', isAuthenticated, isPremium, (req, res) => {

});

app.post('/home/addQuestion', isAuthenticated, isPremium, (req, res) => {

});

app.get('/home/addQuestion/:status', isAuthenticated, isPremium, (req, res) => {
    let status = req.params.status;

    switch (status) {
        case 'done':
            // RENDER OK
            break;
        case 'error':
            // RENDER ERROR
            break;
        default:
            res.redirect('/home');
    }
});


// STATIC FILES
app.use((express.static('public_html')));


// ERRORS
app.use((req, res) => {
    res.send(404);
});


app.listen(SERVER_PORT, console.log("Server listening on http://localhost:" + SERVER_PORT));
