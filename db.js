"use strict"
const sqlite = require('better-sqlite3');
const db = new sqlite('db.sqlite');

// USERS MANAGEMENT

// access
exports.login = (username, password) => {
    let found = db.prepare("SELECT id FROM users WHERE username = ? AND password = ?").get([username, password]);

    return (found !== undefined);
}

exports.register = (username, password, email) => {
    let today = Date.now();

    let found = db.prepare("SELECT id FROM users WHERE username = ? OR mail = ?").get([username, email]);
    
    if (found === undefined) {
        db.prepare("INSERT INTO users (username, password, mail, hereSince) VALUES(?, ?, ?, ?)").run([
            username,
            password,
            email,
            today
        ]);

        return true;
    }

    return false;
}

// permissions
exports.isAdmin = ((username) => {
    return (db.prepare("SELECT isAdmin FROM users WHERE username = ?").get(username));
});

exports.isPremium = ((username) => {
    return (db.prepare("SELECT isPremium FROM users WHERE username = ?").get(username));
});

// points
exports.getPoints = (username) => {
    return;
}

exports.setPoints = (username, points) => {

}


// QUESTIONS MANAGEMENTS

// gets
exports.getQuestion = () => {

    return idQuestion;
}

exports.getAnswers = (idQuestion) => {
    var answers = {};
}

exports.isGoodAnswer = (idQuestion, isAnswer) => {
    
    return true;
}

// sets
exports.addQuestion = (question, answers) => {

}

exports.addAnswer = (answer) => {

}