# Database Setup Script

This directory contains a script to set up test data for the URL shortener application.

## setup-test-data.js

This script will:
1. Delete all existing URLs in the database
2. Delete all existing users in the database
3. Create a test user with the following credentials:
   - Email: test@example.com
   - Password: password123

## How to Run

To run the setup script, use the following command from the backend directory:

```bash
node setup-test-data.js
```

## Warning

**CAUTION**: This script will delete all existing data in your database. Only use it in development or testing environments, never in production.

## Notes

- The script connects to the MongoDB database specified in your `.env` file
- After running the script, you can log in with the test user credentials
- The script will output confirmation messages to the console when completed 