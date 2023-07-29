const express = require('express')
const router = express.Router()
const { User } = require('../models')
const bcrypt = require('bcryptjs')
const Joi = require('joi')
const jwt = require('jsonwebtoken');
require('dotenv').config()

// Create a new user
router.post('/register', async (req, res) => {
    try {
        const schema = Joi.object({
            name: Joi.string().min(3).max(40).required(),
            email: Joi.string().min(3).max(200).required().email(),
            password: Joi.string().min(6).max(200).required()
        })

        const { error } = schema.validate(req.body)
        if (error) {
            return res.status(400).json({
                message: error.details[0].message
            })
        }
        const { name, email, password } = req.body
        const existingUser = await User.findOne({ where: { email } })
        if (existingUser) {
            return res.status(400).json({
                message: 'User already exists'
            })
        }
        const user = await User.create({ name, email, password })
        res.status(201).json(user)
    } catch (error) {
        res.status(500).json({ message: 'An error occured', error })
    }
})

// Login user
router.post('/login', async (req, res) => {
    try {
        const schema = Joi.object({
            email: Joi.string().min(3).max(200).required().email(),
            password: Joi.string().min(6).max(200).required()
        })
        const { error } = schema.validate(req.body)
        if (error) {
            return res.status(400).json({
                message: error.details[0].message
            })
        }
        const { email, password } = req.body
        const user = await User.findOne({ where: { email } })

        if (!user) {
            return res.status(404).json({
                message: "user not found"
            })
        }
        const passwordMatch = bcrypt.compareSync(password, user.password)

        if (!passwordMatch) {
            return res.status(401).json({ message: 'Invalid credentials' })
        }

        // Generate JWT token
        const token = jwt.sign({ userId: user.id }, process.env.SECRET, {
            expiresIn: '1h'
        })

        res.json({
            message: 'Login successful',
            token
        })
    } catch (error) {
        res.status(500).json({
            message: 'An error occured'
        })
    }
})

// Get a user by ID
router.get('/:id', async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id)
        if (!user) {
            res.status(404).json({
                message: 'User not found'
            })
        } else {
            res.json(user)
        }
    } catch (error) {
        res.status(500).json({
            message: 'An error occured'
        })
    }
})

module.exports = router