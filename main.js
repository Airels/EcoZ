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
        return next();
    }

    res.redirect('/login');
}

function isInQuestionSession() {
    if (req.session.inQuestionSession === undefined)
        return res.redirect('/home/');

    return next();
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
    res.render('home/index');
});

app.get('/home/startQuestions', isAuthenticated, (req, res) => {
    if (req.session.inQuestionSession !== undefined)
        return res.redirect('/home/q');
        
    req.session.inQuestionSession = true;
    req.session.idQuestionsDone = [];
    req.session.actualIDQuestion = utils.getRandomInt(db.getNbOfQuestions());

    res.redirect('/home/q/1');
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

    let answersString = question.listIDAnswers.split(',');
    let answersArray = [];

    answersString.array.forEach(idAnswer => {
        answersArray.push(db.getAnswer);
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

    res.render('question', data);
});

app.post('/home/q/:answerID', isAuthenticated, isInQuestionSession, (req, res) => {
    if (db.isGoodAnswer(req.session.actualIDQuestion, req.params.answerID))
        req.session.points += 1;
    else
        req.session.points -= 1;

    if (req.session.idQuestionsDone.length >= 2)
        return res.redirect("/home/endQuestions");


    req.session.idQuestionsDone.push(req.params.id); // ADDING ACTUAL QUESTION

    let nbOfQuestions = db.getNbOfQuestions();

    do {
        req.session.actualIDQuestion = utils.getRandomInt(nbOfQuestions);
    } while (req.session.idQuestionsDone.includes(randomInt)); // CONTINUE UNTIL FOUND QUESTION NOT ASKED BEFORE

    res.render('/home/q');
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
    res.render('endQuestions', data);

    db.setPoints(req.session.username, req.session.points);
});


// STATIC FILES
app.use((express.static('public_html')));


// ERRORS
app.use((req, res) => {
    res.setHeader(404).send("404 Error - Not found");
});


app.listen(SERVER_PORT, console.log("Server listening on http://localhost:" + SERVER_PORT));
