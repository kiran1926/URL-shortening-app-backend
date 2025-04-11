require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Url = require('./models/url');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Test user details
const testUser = {
  email: 'test@example.com',
  password: 'password123'
};

async function resetDatabase() {
  try {
    console.log('Starting database reset...');
    
    // Delete all URLs
    console.log('Deleting all URLs...');
    await Url.deleteMany({});
    console.log('All URLs deleted successfully');
    
    // Delete all users
    console.log('Deleting all users...');
    await User.deleteMany({});
    console.log('All users deleted successfully');
    
    // Create test user
    console.log('Creating test user...');
    
    // Create user - let the model handle password hashing via pre('save') hook
    const user = await User.create({
      email: testUser.email,
      password: testUser.password
    });
    
    console.log(`Test user created with email: ${testUser.email} and password: ${testUser.password}`);
    
    console.log('Database reset complete!');
    console.log('\nTest user credentials:');
    console.log(`Email: ${testUser.email}`);
    console.log(`Password: ${testUser.password}`);
    
    // Close database connection
    mongoose.connection.close();
    console.log('Database connection closed');
    
  } catch (error) {
    console.error('Error resetting database:', error);
    process.exit(1);
  }
}

// Run the reset function
resetDatabase(); 