let db = require('./db');

db.setAdmin('Airels', 'true');

console.log("Is commmand executed ?");
console.log(db.isAdmin('Airels'));
console.log(db.isPremium('Airels'));