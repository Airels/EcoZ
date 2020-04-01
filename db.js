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
    return (db.prepare("SELECT isAdmin FROM users WHERE username = ?").get(username)).isAdmin;
});

exports.isPremium = ((username) => {
    return (db.prepare("SELECT isPremium FROM users WHERE username = ?").get(username)).isAdmin;
});

// points
exports.getPoints = (username) => {
    return (db.prepare("SELECT totalScore FROM users WHERE username = ?").get(username)).totalScore;
}

exports.setPoints = (username, points) => {
    db.prepare("UPDATE users SET totalScore = ? WHERE username = ?").run(points, username);
}


// QUESTIONS MANAGEMENTS

// gets
exports.getQuestion = (idQuestion) => {
    return (db.prepare("SELECT * FROM questions WHERE id = ?").get(idQuestion));
}

exports.getAnswer = (idAnswer) => {
    return (db.prepare("SELECT * FROM answers WHERE id = ?").get(idAnswer));
}

exports.isGoodAnswer = (idQuestion, idAnswer) => {
    return (idAnswer == this.getQuestion(idQuestion));
}

exports.getNbOfQuestions = () => {
    return (db.prepare("SELECT COUNT(id) FROM questions").get());
}

// sets
exports.addQuestion = (question, creator, answers, goodAnswer) => {

}

exports.addAnswer = (answer) => {

}