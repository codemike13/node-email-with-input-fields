
const http = require('http') //To set up url 
const logger = require('morgan')
const path = require('path')
const session = require('express-session')
const express = require('express')
const expressValidator = require('express-validator')
const cookieParser = require('cookie-parser')
const Secret = require('./private/secret')
const secret = new Secret()
const nodemailer = require('nodemailer')

const pass = secret.getPass()
let user = {}
let app = express();

//Setup mail handler 
let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'mike.stephens@codeimmersives.com',
        pass: pass
    }
})




//connected to views folder
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

//Connect static folder
app.use(express.static(path.join(__dirname, 'public')))
//Enable req.body so you can grab data from body using html form
app.use(express.urlencoded({ extended: false }))

app.use(logger('dev'))
app.use(express.json())
app.use(cookieParser('super-secret'))


app.use(session({
    secret: 'super-secret',
    saveUninitialized: false,
    resave: false,
    cookie: {
        secure: false,
        maxAge: 365 * 24 * 60 * 1000
    }
}))

app.use(expressValidator({
    errorFormatter: (param, message, value) => {
        let namespace = param.split('.')
        let root = namespace.shift()
        let formParam = root;

        while (namespace.length) {
            formParam += '[' + namespace.shift() + ']'
        }
        return {
            param: formParam,
            message: message,
            value: value
        }
    }
}))

app.get('/', (req, res, next) => {

    if (Object.keys(req.query).length != 0) {
        next()
        return;
    }
    res.send("Yo this is App")
})

app.get('/', (req, res, next) => {
    console.log(req.query)
    req.send(req.query)
})

app.post('/', (req, res) => {
    res.send(req.body)

})

app.get('/users/register', (req, res) => {
    res.render('register', { error_msg: false })//send to register page
})
app.post('/users/register', (req, res) => {
    console.log('req body', req.body);

    req.checkBody('username', 'Between 3 - 15 characters').isLength({ min: 3, max: 15 })
    req.checkBody('username', 'Only use A-Z').notEmpty().blacklist(/<>\//, 'g')
    req.checkBody('email', 'Enter a valid email address').isEmail()
    req.checkBody('password2', "Yo passwords dont match TRYAGAIN").notEmpty().equals(req.body.password)
    let errors = req.validationErrors()
    console.log('errors: ', errors);
    if (errors) {
        res.render('register', { error_msg: true, errors: errors })
    } else {
        user.email = req.body.email
        user.password = req.body.password
        user.username = req.body.username
        req.session.user = user

        res.redirect('/show-me-my-page')
    }
})
app.post('/contact', (req, res) => {
    req.checkBody('name', 'Only use A-Z').isAlpha()
    req.checkBody('email', 'Enter a valid email address').isEmail()
    let errors = req.validationErrors();
    if (errors) {
        res.render('contact', { error_msg: true, errors: errors })
    } else {
        let mailOptions = {
            from: 'mike.stephens@codeimmersives.com',
            to: 'mike.stephens@codeimmersives.com',
            subject: `${req.body.name} sent a comment using Node.js`,
            text: req.body.comment
        }
        transporter.sendMail(mailOptions, (err, info) => {
            if (err) console.log(err)
            else console.log(`Email sent: ${info.response}`)
        })
    }
    res.redirect('/success')
})

app.get('/show-me-my-page', (req, res) => {
    console.log('qwe: ', req.session.user)
    if (req.session.user) {
        res.render('index', { user: req.session.user })
    } else {
        res.render('index', { user: null })
    }
})
app.get('/contact', (req, res) => {
    // res.send("<h1>Test H teee Emm Ell</h1>") //sends html to pages on post
    res.render('contact.ejs', { error_msg: false })// Render this ejs page on post
})
app.get('/test', (req, res) => {
    // res.send("<h1>Test H teee Emm Ell</h1>") //sends html to pages on post
    res.render('index.ejs')// Render this ejs page on post
})
app.get('*', (req, res) => {
    res.send("Wildcard")
})

app.listen(3000, () => {
    console.log('Server is connected on port 3000');

});





