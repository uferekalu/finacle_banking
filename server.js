const express = require('express')
const app = express()
const port = 8000

// Import the routes
const userRoutes = require('./routes/user')
const accountRoutes = require('./routes/account')
const transactionRoutes = require('./routes/transaction')

// Set up middleware
app.use(express.json())

// Set up routes
app.use('/users', userRoutes)
app.use('/accounts', accountRoutes)
app.use('/transactions', transactionRoutes)

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`)
})