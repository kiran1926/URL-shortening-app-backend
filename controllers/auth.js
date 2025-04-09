const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const saltRounds = 12;

// POST /sign-up
router.post('/sign-up', async (req, res) => {
    try {
        // Validate input
        if (!req.body.email || !req.body.password) {
            return res.status(400).json({
                error: 'Email and password are required'
            });
        }

        // checking if the email already exists
        const userInDatabase = await User.findOne({ 
            email: req.body.email 
        });
        
        if(userInDatabase) {
            return res.status(409).json({
                error: 'Email already taken'
            });
        }

        const user = await User.create({
            email: req.body.email,
            password: req.body.password
        });

        const payload = {
            email: user.email,
            id: user._id
        };

        // Create token with 24 hour expiration
        const token = jwt.sign(
            { payload },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({ 
            token,
            user: {
                id: user._id,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Sign-up error:', error);
        res.status(500).json({ error: 'Error creating user' });
    }
});

// POST /sign-in
router.post('/sign-in', async (req, res) => {
    try {
        // Validate input
        if (!req.body.email || !req.body.password) {
            return res.status(400).json({
                error: 'Email and password are required'
            });
        }

        const user = await User.findOne({
            email: req.body.email
        });

        if(!user) {
            return res.status(401).json({
                error: 'Invalid credentials'
            });
        }

        const isPasswordCorrect = await user.comparePassword(req.body.password);

        if(!isPasswordCorrect) {
            return res.status(401).json({
                error: 'Invalid credentials'
            });
        }

        const payload = {
            email: user.email,
            id: user._id
        };

        // Create token with 24 hour expiration
        const token = jwt.sign(
            { payload },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(200).json({ 
            token,
            user: {
                id: user._id,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Sign-in error:', error);
        res.status(500).json({ error: 'Error signing in' });
    }
});

// GET /verify-token
router.get('/verify-token', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.payload.id).select('-password');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({ user });
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token has expired' });
        }
        res.status(401).json({ error: 'Invalid token' });
    }
});

module.exports = router;
