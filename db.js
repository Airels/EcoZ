"use strict"
const sqlite = require('better-sqlite3');
const db = new sqlite('db.sqlite');
// to encrypt password
const bcrypt = require('bcrypt');
const saltRounds = 10;

exports.login = (username, password) => {
    let salt = bcrypt.genSaltSync(saltRounds);
    let passwordHashed = bcrypt.hashSync(password, salt);

    let found = db.prepare("SELECT id FROM users WHERE username = ? AND password = ?").get([username, passwordHashed]);

    return (found !== undefined);
}

exports.register = (username, password, email) => {
    let salt = bcrypt.genSaltSync(saltRounds);
    let passwordHashed = bcrypt.hashSync(password, salt);

    let today = Date.now();

    let found = db.prepare("SELECT id FROM users WHERE username = ? AND email = ?").get([username, email]);
    
    if (found !== undefined) {
        db.prepare("INSERT INTO users (username, password, email, hereSince) VALUES(?, ?, ?, ?)").run([
            username,
            passwordHashed,
            email,
            today
        ]);

        return true;
    }

    return false;
}

exports.isAdmin = ((username) => {
    return (db.prepare("SELECT isAdmin FROM users WHERE username = ?").get(username));
});

exports.isPremium = ((username) => {
    return (db.prepare("SELECT isPremium FROM users WHERE username = ?").get(username));
});
