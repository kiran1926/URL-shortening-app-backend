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
const Url = require('./models/url');

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

// Redirect route - public access without token
app.get('/:shortUrl', async (req, res) => {
  try {
    const { shortUrl } = req.params;
    console.log(`Redirect request received for shortUrl: ${shortUrl}`);
    
 
    if (shortUrl === 'auth' || shortUrl === 'users' || shortUrl === 'urls' || shortUrl === 'test-jwt') {
      return res.status(404).json({ error: 'Not found' });
    }
    
    const url = await Url.findOne({ shortUrl });
    
    if (!url) {
      console.log(`URL not found for shortUrl: ${shortUrl}`);
      return res.status(404).json({ error: 'URL not found' });
    }
    
    console.log(`URL found: ${url.originalUrl}`);
    console.log(`Current click count: ${url.clicks}`);
    
    
    const currentClicks = url.clicks || 0;
    const newClicks = currentClicks + 1;
    
    await Url.updateOne(
      { _id: url._id },
      { $set: { clicks: newClicks } }
    );
    
    console.log(`Updated click count: ${newClicks}`);
    
    
    let redirectUrl = url.originalUrl;
    if (!redirectUrl.startsWith("http://") && !redirectUrl.startsWith("https://")) {
      redirectUrl = "https://" + redirectUrl;
      console.log(`Added https:// protocol. New redirect URL: ${redirectUrl}`);
    }
    
    console.log(`Redirecting to: ${redirectUrl}`);
    
   
    const wantsJson = req.headers.accept && req.headers.accept.includes('application/json');
    
    if (wantsJson) {
      
      return res.json({ redirectUrl, clicks: newClicks });
    } else {
    
      return res.redirect(redirectUrl);
    }
  } catch (error) {
    console.error("Error redirecting:", error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 