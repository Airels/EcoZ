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
        db.prepare("INSERT INTO users (username, password, mail, hereSince, description, totalScore) VALUES(?, ?, , ?, ?, 0)").run([
            username,
            password,
            email,
            today,
            "Ajoutez une description !"
        ]);

        return true;
    }

    return false;
}

// modifications
exports.changePassword = (username, password) => {
    db.prepare("UPDATE users SET password = ? WHERE username = ?").run(password, username);
}

exports.changeDescription = (username, description) => {
    db.prepare("UPDATE users SET description = ? WHERE username = ?").run(description, username);
}

exports.deleteUser = (username) => {
    db.prepare('DELETE FROM users WHERE username = ?').run(username);
}

// permissions
exports.isAdmin = (username) => {
    return (db.prepare("SELECT isAdmin FROM users WHERE username = ?").get(username)).isAdmin;
};

exports.isPremium = (username) => {
    return (db.prepare("SELECT isPremium FROM users WHERE username = ?").get(username)).isPremium;
};

exports.setAdmin = (username, bool) => {
    db.prepare("UPDATE users SET isAdmin = ? WHERE username = ?").run(bool, username);
    this.setPremium(username, bool);
}

exports.setPremium = (username, bool) => {
    db.prepare("UPDATE users SET isPremium = ? WHERE username = ?").run(bool, username);
}

// get user
exports.getUser = (username) => {
    return (db.prepare("SELECT * FROM users WHERE username = ?").get(username));
}


// points
exports.getPoints = (username) => {
    return (db.prepare("SELECT totalScore FROM users WHERE username = ?").get(username)).totalScore;
}

exports.setPoints = (username, points) => {
    if (points < 0) points = 0;

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
    return (idAnswer == this.getQuestion(idQuestion).idCorrectAnswer);
}

exports.getNbOfQuestions = () => {
    return (db.prepare("SELECT COUNT(id) nb FROM questions").get().nb);
}

exports.getQuestions = () => {
    return (db.prepare("SELECT * FROM questions").all());
}

// sets
exports.addQuestion = (question, creator, answers, goodAnswer) => {
    let today = Date.now();

    db.prepare("INSERT INTO questions (title, creator, creationDate, listIDAnswers, idCorrectAnswer) VALUES(?, ?, ?, ?, ?)").run(question, creator, today, answers, goodAnswer);
}

exports.addAnswer = (answer) => {
    db.prepare("INSERT INTO answers (content) VALUES(?)").run(answer);

    return (db.prepare("SELECT id FROM answers WHERE content = ?").get(answer).id);
}

exports.deleteQuestion = (idQuestion) => {
    this.getQuestion(idQuestion).listIDAnswers.split(',').forEach((idAnswer) => {
        db.prepare("DELETE FROM answers WHERE id = ?").run(idAnswer);
    });

    db.prepare("DELETE FROM questions WHERE id = ?").run(idQuestion);
}