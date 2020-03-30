"use strict"

// MIDDLEWARES
function isAuthenticated(req, res, next) {
    if (req.session.username !== undefined) {
        res.locals.username = req.session.username;
        res.locals.isAdmin = req.session.isAdmin;
        res.locals.isPremium = req.session.isPremium;
        return next();
    }

    res.redirect('/login');
}


// ROUTES
app.get('/home/', isAuthenticated, (req, res) => {
    res.render('home/index');
});