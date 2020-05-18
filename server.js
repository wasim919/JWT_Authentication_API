const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const errorHandler = require('./middleware/errorHandler');
const auth = require('./routes/auth');
const connectDB = require('./config/db');
const cookieParser = require('cookie-parser');
const app = express();

// Load env variables
dotenv.config({ path: './config/config.env' });

// Connect DB
connectDB();

// Dev loggin middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Body parser
app.use(express.json());

// Cookie parser
app.use(cookieParser());

// Mount routes
app.use('/api/v1/auth', auth);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(
  PORT,
  console.log(
    `${process.env.NODE_ENV} Server is running on port ${process.env.PORT}`
      .green.inverse
  )
);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(err.message);
  server.close(() => process.exit(1));
});
