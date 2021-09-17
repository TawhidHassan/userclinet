/* eslint-disable no-unused-vars */
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cors = require('cors');
const bodyParser = require('body-parser');
//const csrf = require('csurf');
const cookieParser = require('cookie-parser');
//job seduler
const cron = require('node-cron');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./middleware/errorHandler');

const userRouter = require('./routes/userRoutes');
//const csrfProtection = csrf({ cookie: true });
const app = express();

// 1) GLOBAL MIDDLEWARES
app.use(cors());
app.options('*', cors());
// Set security HTTP headers
app.use(helmet());

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(express.json({ limit: '50mb' }));
// app.use(bodyParser.json({limit: '50mb'}));

app.use(
  express.urlencoded({ limit: '50mb', extended: true, parameterLimit: 50000 })
);
app.use(cookieParser());

//app.use(csrfProtection);
// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());


// Serving static files
app.use(express.static(`${__dirname}/public`));

// Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.headers);
  next();
});

// 3) ROUTES
app.use('/api/v1/users', userRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

//make attandance object every day
cron.schedule('0 0 * * *', async () => {
  // console.log('running job');
  try {
    
  } catch (err) {
    console.log(err);
  }
});



app.use(globalErrorHandler);

module.exports = app;
