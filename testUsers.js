// A exécuter pour pouvoir créer tout les comptes utilisateurs pour tester toutes les fonctionnalités

let db = require("./db");

db.register("admin", "admin", "admin@localhost");
db.register("premium", "premium", "premium@localhost");
db.register("user", "user", "user@localhost");

console.log("Is accounts created ?");
console.log(db.login("admin", "admin"));
console.log(db.login("premium", "premium"));
console.log(db.login("user", "user"));

db.setAdmin("admin", true);
db.setPremium("premium", true);

console.log("Is accounts creditations successful ?");
console.log(db.isAdmin("admin"));
console.log(db.isPremium("premium"));

console.log("Have a good day!");