// Sample Website
// Created by by Hashim Hayat (hh1316)
// New York University
// creating fansite using miniWeb framework

const App = require('./miniWeb.js').App;
const app = new App();

// ------ Angry Birds Fansite ------ //

const [PORT, HOST] = [8080, '127.0.0.1'];

// Homepage
// a homepage that has an image and that uses a stylesheet

app.get('/', function(req, res) {
	res.sendFile('/html/index.html');
});

// About
// a page that has an h1 header somewhere in the markup

app.get('/about', function(req, res) {
	res.sendFile('/html/about.html');
});

// Stylesheet
// the css that the homepage (and other pages optionally) should use

app.get('/css/base.css', function(req, res) {
	res.sendFile('/css/base.css');
});

// Random Image Generator
// a page that displays a random image; this must be an html page with no client side JavaScript… 
// the server will generate a random image url to be displayed

app.get('/rando', function(req, res) {
	const images = ['image3.gif', 'image4.gif', 'image5.gif'];
	const randImage = images[Math.floor(Math.random() * images.length)];
	res.sendFile('/img/' + randImage);
});

// Redirect to Home
// should issue a permanent redirect (301) to /

app.get('/home', function(req, res) {
	res.redirect(302, '/');
});

// Images
// JPG image

app.get('/image1.jpg', function(req, res) {
	res.sendFile('/img/image1.jpg');
});

// PNG image

app.get('/image2.png', function(req, res) {
	res.sendFile('/img/image2.png');
});

// GIF images

app.get('/image3.gif', function(req, res) {
	res.sendFile('/img/image3.gif');
});

app.get('/image4.gif', function(req, res) {
	res.sendFile('/img/image3.gif');
});

app.get('/image5.gif', function(req, res) {
	res.sendFile('/img/image3.gif');
});

// Title Image

app.get('/title.png', function(req, res) {
	res.sendFile('/img/title.png');
});

app.get('/favicon.png', function(req, res) {
	res.sendFile('/img/favicon.png');
});

app.listen(PORT, HOST);











