const express = require('express')
const router = express.Router()
const { Transaction, Account, User } = require('../models')

// Create a new transaction
router.post('/', async (req, res) => {
    try {
        const { transaction_type, amount, fromAccountId, toAccountId } = req.body
        const fromAccount = await Account.findByPk(fromAccountId)
        const toAccount = await Account.findByPk(toAccountId)

        const fromUser = await User.findByPk(fromAccount.userId)
        const toUser = await User.findByPk(toAccount.userId)

        if (!fromAccount || !toAccount) {
            res.status(404).json({
                message: 'Account not found'
            })
        } else {
            // Update the balances
            console.log('Before balance update:', fromAccount.balance, toAccount.balance);
            fromAccount.balance -= amount;
            toAccount.balance += amount;
            console.log('After balance update:', fromAccount.balance, toAccount.balance);
            await fromAccount.save();
            await toAccount.save();

            // Perform the transaction
            const transaction = await Transaction.create({
                transaction_type, 
                amount,
                fromAccountId,
                toAccountId
            })

            res.status(201).json({
                transaction,
                message: `An amount of ${amount} was transfered from ${fromUser.name} to ${toUser.name}`
            })
        }
    } catch (error) {
        res.status(500).json({
            message: 'An error occured'
        })
    }
})

// Get all transactions
router.get('/', async (req, res) => {
    try {
        const transactions = await Transaction.findAll()
        res.json(transactions)
    } catch (error) {
        res.status(500).json({
            message: 'An error occured'
        })
    }
})

// Get a transaction by ID
router.get('/:id', async (req, res) => {
    try {
        const transaction = await Transaction.findByPk(req.params.id)
        if (!transaction) {
            res.status(404).json({
                message: 'Transaction not found'
            })
        } else {
            res.json(transaction)
        }
    } catch (error) {
        res.status(500).json({
            message: 'An error occured'
        })
    }
})
module.exports = router