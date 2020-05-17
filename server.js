const express = require('express');
const dotenv = require('dotenv');

const app = express();

// Load env variables
dotenv.config({ path: './config/config.env' });

// Body parser
app.use(express.json());

const PORT = process.env.PORT || 5000;

app.listen(
  PORT,
  console.log(
    `${process.env.NODE_ENV} Server is running on port ${process.env.PORT}`
  )
);
