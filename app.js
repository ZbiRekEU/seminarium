var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
var bodyParser = require('body-parser');
var multer = require("multer");
var cors = require('cors');
var cronShedule = require('./workplace/cron')

//TEMPLATE
var bCrypt = require('bcryptjs');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var adminRouter = require('./routes/admin');
var emailSend = require('./workplace/email');

var app = express();


// cors policy
app.use(cors({
  origin: 'https://verniro-trans.pl'
}));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({ secret: 'secretKeyVerniro', saveUninitialized: true, resave: true }));

app.use('/', usersRouter);

// view engine setup
var expressLayouts = require('express-ejs-layouts');
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);

app.use('/public', express.static('public'));
app.use('/', indexRouter);
app.use('/', adminRouter);


// automatyczne odrzucanie terminu dostawy o 8:00, jeśli status jest równy "Nie potwierdzono"
cronShedule.autoRejectDeliveryDateStatus()

// app.use(express.static(path.join(__dirname, 'public')));


// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
