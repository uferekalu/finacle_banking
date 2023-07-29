const express = require('express')
const router = express.Router()
const { Account, User, Transaction } = require('../models')
const Joi = require('joi')
const stripe = require('stripe')(process.env.stripeSecretKey)

// Create a new account
router.post('/', async (req, res) => {
    try {
        const schema = Joi.object({
            account_number: Joi.string().min(8).max(10).required(),
            account_type: Joi.string().valid('Savings', 'Checking', 'Loan').required(),
            balance: Joi.number().required(),
            userId: Joi.number().integer().required(),
            stripeAccountId: Joi.string().required()
        })

        const { error } = schema.validate(req.body)
        if (error) {
            return res.status(400).json({
                message: error.details[0].message
            })
        }
        const { account_number, account_type, balance, userId, stripeAccountId } = req.body

        let account = await Account.findOne({
            where: {
                account_number
            }
        })

        if (account) {
            return res.status(400).json({
                message: `Account with account number ${account_number} already exists`
            })
        }

        account = await Account.create({
            account_number,
            account_type,
            balance,
            userId,
            stripeAccountId
        })
        if (account) {
            res.status(201).json(account)
        } else {
            return res.status(400).json({
                message: "Account not created"
            })
        }
    } catch (error) {
        res.status(500).json({
            message: 'An error occured', error
        })
    }
})

// Get all accounts
router.get('/', async (req, res) => {
    try {
        const accounts = await Account.findAll()
        res.json(accounts)
    } catch (error) {
        res.status(500).json({
            message: 'An error occured', error
        })
    }
})

// Get an account by ID
router.get('/:id', async (req, res) => {
    try {
        const account = await Account.findByPk(req.params.id)
        if (!account) {
            res.status(404).json({
                message: 'Account not found'
            })
        } else {
            res.json(account)
        }
    } catch (error) {
        res.status(500).json({
            message: 'An error occured'
        })
    }
})

// Deposit fund
router.post('/deposit', async (req, res) => {
    try {
        const { amount, accountId, paymentMethodId } = req.body
        const account = await Account.findByPk(accountId)
        const user = await User.findByPk(account.userId)

        if (!account) {
            res.status(404).json({
                message: 'Account not found'
            })
        } else {
            // Create a Stripe payment intent
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount * 100, // Stripe requires amount in cents
                currency: 'usd',
                payment_method_types: ['card'],
                description: `Deposit to ${user.name}'s account`,
                payment_method: paymentMethodId,
                confirm: true
            })

            // Perform the deposit
            account.balance += amount
            await account.save()

            // Create a deposit transaction
            const transaction = await Transaction.create({
                transaction_type: 'Deposit',
                amount,
                fromAccountId: null,
                toAccountId: account.id
            })

            res.status(201).json({
                transaction,
                clientSecret: paymentIntent.client_secret,
                message: `Successfully deposited ${amount} to ${user.name}'s account`
            })
        }
    } catch (error) {
        console.log(error)
        res.status(500).json({
            message: 'An error occured'
        })
    }
})

// Withdraw fund
router.post('/withdrawal', async (req, res) => {
    try {
        const { amount, accountId } = req.body
        const account = await Account.findByPk(accountId)
        const user = await User.findByPk(account.userId)

        if (!account) {
            res.status(404).json({
                message: 'Account not found'
            })
        } else if (account.balance < amount) {
            res.status(400).json({
                message: 'Insufficient balance'
            })
        } else {
            // Create a Stripe payout
            const payout = await stripe.payouts.create({
                amount: amount * 100, // Stripe requires amount in cents
                currency: 'usd',
                method: 'instant',
                destination: account.stripeAccountId
            })

            // Perform the withdrawal
            amount.balance -= amount
            await account.save()

            // Create a withdrawal transaction
            const transaction = await Transaction.create({
                transaction_type: 'Withdrawal',
                amount,
                fromAccountId: account.id,
                toAccountId: null
            })

            res.status(201).json({
                transaction,
                payoutId: payout.id,
                message: `Successfully withdrew ${amount} from ${user.name}'s account`
            })
        }
    } catch (error) {
        console.log(error)
        res.status(500).json({
            message: 'An eror occured'
        })
    }
})

module.exports = router