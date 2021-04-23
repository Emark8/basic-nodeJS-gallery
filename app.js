/* 
   Heroku Link: https://mark-anunciacion-gallery.herokuapp.com
*/

const HTTP_PORT = process.env.PORT || 3000;
const express = require('express');
const exphbs = require('express-handlebars');
const path = require('path');
const bodyParser = require('body-parser');
const fs = require('fs');
const randomString = require('randomstring');
const session = require('client-sessions');
const mongoose = require('mongoose');
const Photo = require('./models/gallery');
let strRandom = randomString.generate();
const app = express();

//connect to database
const dbConnect = 'your mongodb connection string';
mongoose
	.connect(dbConnect, { useNewUrlParser: true, useUnifiedTopology: true }) // additional argument to stop the depracation warning
	.then((result) => server) //listen for request once connection to database is complete.
	.catch((err) => console.log(err));

//register view engine
app.engine(
	'hbs',
	exphbs({
		extname: '.hbs',
		runtimeOptions: {
			allowProtoPropertiesByDefault: true,
			allowProtoMethodsByDefault: true
		},
		defaultLayout: false,
		layoutsDir: path.join(__dirname, '/views')
	})
);

app.set('view engine', '.hbs');
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
	session({
		cookieName: 'mySession',
		secret: strRandom,
		duration: 10 * 60 * 1000,
		activeDuration: 5 * 60 * 1000,
		httpOnly: true,
		secure: true,
		ephemeral: true
	})
);

app.use((req, res, next) => {
	res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
	next();
});

//landing page route
app.get('/', (req, res) => {
	res.redirect('/login');
});

//home route redirects to this route
app.get('/login', (req, res) => {
	req.mySession.reset();
	Photo.updateMany({ status: 'S' }, { status: 'A' })
		.then((result) => {
			res.render('login', {
				message: false,
				title: 'Please Log in'
			});
			console.log('All photos are available');
		})
		.catch((err) => {
			console.log(err);
		});
	//reset session each time user goes to login page
});

//gallery route
app.get('/gallery', (req, res) => {
	//allow user to continue access to /gallery route as long as session is still valid
	if (req.mySession.user) {
		Photo.find({ status: 'A' })
			.sort({ description: 1 })
			.then((result) => {
				// let myResult = result.map((myObj) => {
				//   return myObj.description;
				// });
				res.render('index', {
					title: 'Gallery',
					data: result,
					label: '',
					main: false,
					username: req.mySession.user
				});
			})
			.catch((err) => {
				console.log(err);
			});
	} else {
		req.mySession.reset();
		res.redirect('/login');
	}
});

app.get('/gallery/:id', (req, res) => {
	const id = req.params.id;

	Photo.find({ description: id })
		.then((result) => {
			//if no radio button was selected, default image to be loaded
			res.render('purchase', {
				data: result,
				title: 'Purchase'
			});
		})
		.catch((err) => {
			console.log(err);
		});
});

app.put('/gallery/:id', (req, res) => {
	const id = req.params.id;
	Photo.updateMany({ description: id }, { status: 'S' })
		.then((result) => {
			res.json({ redirect: '/gallery' });
		})
		.catch((err) => {
			console.log(err);
		});
});

app.post('/login', (req, res) => {
	let userEmail = req.body.email;
	let pass = req.body.password;
	fs.readFile('user.json', 'utf-8', (err, data) => {
		if (err) throw err;

		let confirmObject = JSON.parse(data);

		if (!confirmObject.hasOwnProperty(userEmail)) {
			res.render('login', {
				message: 'Not a registered username.'
			});
		} else if (confirmObject[userEmail] != pass) {
			res.render('login', {
				message: 'Invalid password.'
			});
		} else {
			delete req.body.password;
			req.mySession.user = userEmail;
			return res.redirect('/gallery');
		}
	});
});

app.post('/gallery', (req, res) => {
	let clicked = req.body.submit;
	Photo.find({ status: 'A' })
		.sort({ description: 1 })
		.then((result) => {
			if (req.mySession.user) {
				if (clicked == 'submit' && !req.body.myList) {
					//if no radio button was selected, default image to be loaded
					res.render('index', {
						data: result,
						main: false,
						label: '',
						username: req.mySession.user,
						title: 'Gallery'
					});

					//if a selection was made..
				} else if (clicked == 'submit' && req.body.myList) {
					res.render('index', {
						title: 'Gallery',
						data: result,
						main: req.body.myList,
						label: req.body.myList,
						username: req.mySession.user
					});
				} else {
					//if the button clicked was the logout button, redirect to login page
					res.redirect('/login');
				}
			}
		})
		.catch((err) => {
			console.log(err);
		});
});

//unknown or invalid route
app.get('*', (req, res) => {
	res.send('<h1>404 not found</h1><h1>This site cannot be reached.</h1>');
});

const server = app.listen(HTTP_PORT, () => {
	console.log('Successfully connected to DB');
	console.log(`Listening on port ${HTTP_PORT}`);
});
