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
    req.session.points = db.getPoints(username);
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
    req.session.idQuestionsDone.push(req.session.actualIDQuestion); // ADDING ACTUAL QUESTION

    if (db.isGoodAnswer(req.session.actualIDQuestion, req.query.id)) // req.query.a = ID Answer
        req.session.points += 1;
    else
        req.session.points -= 1;

    if (req.session.idQuestionsDone.length >= 2)
        return res.redirect("endQuestions");

    let nbOfQuestions = db.getNbOfQuestions();

    do {
        req.session.actualIDQuestion = utils.getRandomInt(nbOfQuestions)+1;
    } while (req.session.idQuestionsDone.includes(req.session.actualIDQuestion)); // CONTINUE UNTIL FOUND QUESTION NOT ASKED BEFORE

    res.redirect('/home/q');
});

app.get('/home/endQuestions', isAuthenticated, isInQuestionSession, (req, res) => {
    let arrayQuestionsAsked = [];
    let arrayAnswers = [];

    req.session.idQuestionsDone.forEach((id) => {
        let question = db.getQuestion(id);

        console.log(question);

        arrayQuestionsAsked.push(question);
        arrayAnswers.push(db.getAnswer(question.idCorrectAnswer));
    });

    let data = {
        oldPoints: db.getPoints(req.session.username),
        newPoints: req.session.points,
        questionsAsked: arrayQuestionsAsked,
        goodAnswers: arrayAnswers
    }
    res.render('home/endQuestions', data);

    db.setPoints(req.session.username, req.session.points);

    req.session.inQuestionSession = undefined;
    req.session.idQuestionsDone = undefined;
});

// USER PROFILE SETTINGS
app.get('/home/profile', isAuthenticated, (req, res) => {
    res.render('home/profile');
});

app.get('/home/profile/changePassword', isAuthenticated, (req, res) => {
    let data = {};

    if (req.query.error == 1)
        data.wrongPassword = true;
    if (req.query.error == 2)
        data.samePassword = true;
    if (req.query.error == 3)
        data.error1 == true;
    if (req.query.success == 1)
        data.success = true;

    res.render('home/changePassword', data);
});

app.post('/home/profile/changePassword', isAuthenticated, (req, res) => {
    let password = req.body.password;
    let newPassword = req.body.newPassword;

    if (password == undefined || newPassword == undefined)
        return res.redirect('/home/profile/changePassword?error=3');
    if (!db.login(req.session.username, password))
        return res.redirect('/home/profile/changePassword?error=1');
    if (password == newPassword)
        return res.redirect('/home/profile/changePassword?error=2');


    db.changePassword(req.session.username, newPassword);
    // res.redirect('/home/changePassword?success=1');
    res.redirect('/home/profile');
});

app.get('/home/profile/deleteProfile', isAuthenticated, (req, res) => {
    let data = {};

    if (req.query.error == 1)
        data.wrongPassword = true;
    if (req.query.error == 2)
        data.notSamePassword = true;
    if (req.query.error == 3)
        data.error1 = true;

    res.render('home/deleteProfile', data);
});

app.post('/home/profile/deleteProfile', isAuthenticated, (req, res) => { // Have to enter password to confirm deletion
    let password = req.body.password;
    let confirmPassword = req.body.confirmPassword;

    if (password == undefined || confirmPassword == undefined)
        return res.redirect('/home/profile/deleteProfile?error=3');
    if (!db.login(req.session.username, password))
        return res.redirect('/home/profile/deleteProfile?error=1');
    if (password != confirmPassword)
        return res.redirect('/home/profile/deleteProfile?error=2');

    db.deleteUser(req.session.username);
    req.session = undefined;
    res.redirect('/');
});

// ADDING QUESTION
app.get('/home/addQuestion', isAuthenticated, isPremium, (req, res) => {
    res.render('home/addQuestion');
});

app.post('/home/addQuestion', isAuthenticated, isPremium, (req, res) => {
    let question = req.body.question;
    let answers = [
        req.body.firstAnswer,
        req.body.secondAnswer,
        req.body.thirdAnswer,
        req.body.fourthAnswer
    ]
    let goodAnswer = req.body.goodAnswer;

    let answersID = [];

    answers.forEach(answer => {
        if (answer !== undefined)
            answersID.push(db.addAnswer(answer));
    });

    if (answersID.length < 2)
        return res.redirect('/home/addQuestion/answersError')
    if (!(/^[1-4]$/.test(goodAnswer)) || goodAnswer > answersID.length)
        return res.redirect('/home/addQuestion/idAnswerError');

    console.log(answersID[goodAnswer-1]);
    db.addQuestion(question, req.session.username, utils.arrayToString(answersID), answersID[goodAnswer-1]);
    res.redirect('/home/addQuestion/done');
});

app.get('/home/addQuestion/:status', isAuthenticated, isPremium, (req, res) => {
    let status = req.params.status;
    let data = {};

    switch (status) {
        case 'done':
            data.done = true;
            console.log("Question added!");
            break;
        case 'answersError':
            data.answersError = true;
            console.log("Answers error");
            break;
        case 'idAnswerError':
            data.idAnswerError = true;
            console.log("idAnswerError");
            break;
    }
    
    res.render('home/addQuestionAfter', data);
});

// ADMIN ROUTES
app.get('/admin/getQuestions', isAuthenticated, isAdmin, (req, res) => {
    let data = db.getQuestions;

    res.render('admin/allQuestions', data);
});

app.get('/admin/getQuestion/:id', isAuthenticated, isAdmin, (req, res) => {
    let data = {
        question: db.getQuestion(req.params.id),
    }
    let answersArray = [];

    data.question.listIDAnswers.split(',').forEach((answerID) => {
        answers.push(db.getAnswer(answerID));
    });

    data.answers = answersArray;

    res.render('admin/question', data); // TODO : Highlight good answer. Get with data.question.idCorrectAnswer
});

app.get('/admin/questionAction/:action/:id', isAuthenticated, isAdmin, (req, res) => {
    let action = req.params.action;
    let id = req.params.id;

    let data = {};

    switch (action) {
        case "delete":
            if (db.getQuestion(id) === undefined)
                data.wrongID = true;
            else {
                db.deleteQuestion(id);
                data.deleted = true;
            }
            break;
        default:
            data.wrongAction = true;
            break;
    }

    res.render("admin/questionAction", data);
});


// STATIC FILES
app.use((express.static('public_html')));


// IF NO FILES FOUND
app.use((req, res) => {
    res.send(404);
});


app.listen(SERVER_PORT, console.log("Server listening on http://localhost:" + SERVER_PORT));
