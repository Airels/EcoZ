let db = require('./db');

db.setAdmin('Airels', 'true');
db.setAdmin('admin2', 'true');

console.log("Is commmand executed ?");
console.log(db.isAdmin('Airels'));
console.log(db.isPremium('Airels'));
console.log();
console.log(db.isAdmin('admin2'));
console.log(db.isPremium('admin2'));