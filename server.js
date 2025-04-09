// npm
const dotenv = require('dotenv');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const logger = require('morgan');

// Load environment variables
dotenv.config();
const app = express();

// Routers
const testJwtRouter = require('./controllers/test-jwt');
const authRouter = require('./controllers/auth');
const usersRouter = require('./controllers/users');
const verifyToken = require('./middleware/verify-token');
const urlsRouter = require('./controllers/urls');


// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI);

mongoose.connection.on('connected', () => {
  console.log(`Connected to MongoDB ${mongoose.connection.name}.`);
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(logger('dev'));

// Routes
app.use('/auth', authRouter);
app.use('/users', verifyToken, usersRouter);
app.use('/test-jwt', testJwtRouter);
app.use('/urls', verifyToken, urlsRouter);

// Start the server and listen on port 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 