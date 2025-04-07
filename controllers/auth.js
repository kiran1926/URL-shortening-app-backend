const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const saltRounds = 12;
// POST /sign-up
router.post('/sign-up', async (req, res) => {
    try {
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
            _id: user._id
        };

        const token = jwt.sign(
            {payload},
            process.env.JWT_SECRET
        )

        res.status(201).json({ token });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error.message })
    }
});

router.post('/sign-in', async (req, res) => {
    try {
        const user = await User.findOne({
            email: req.body.email
        });

        if(!user) {
            return res.status(401).json({
                error: 'Invalid Credentials'
            });
        }

        const isPasswordCorrect = await user.comparePassword(req.body.password);

        if(!isPasswordCorrect) {
            return res.status(401).json({
                error: 'Invalid Credentials'
            });
        }

        const payload = {
            email: user.email,
            _id: user._id
        };

        const token = jwt.sign(
            { payload },
            process.env.JWT_SECRET
        );

        res.status(200).json({ token });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error.message })   
    }
});

module.exports = router;
