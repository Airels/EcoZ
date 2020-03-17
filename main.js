const express = require('express');
const bodyParser = require('body-parser');
const mustache = require('mustache-express');
const SERVER_PORT = 3000;

const app = express();

app.engine('html', mustache());
app.use(bodyParser.urlencoded({ extended: false}));

app.set('view engine', 'html');
app.set('views', './public_html');

app.get('/', (req, res) => {
    res.render('index');
});

app.listen(SERVER_PORT, console.log("Server listening on port " + SERVER_PORT));
