const { Sequelize, DataTypes } = require('sequelize')
const bcrypt = require('bcryptjs')
require('dotenv').config()

const sequelize = new Sequelize(process.env.DB, process.env.USERNAME, process.env.PASSWORD, {
    host: process.env.HOST,
    dialect: 'mysql'
})

// Define User model
const User = sequelize.define('User', {
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
        set(value) {
            const salt = bcrypt.genSaltSync(10)
            const hashedPassword = bcrypt.hashSync(value, salt)
            this.setDataValue('password', hashedPassword)
        }
    }
})

// Define Account model
const Account = sequelize.define('Account', {
    account_number: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    account_type: {
        type: DataTypes.ENUM('Savings', 'Checking', 'Loan'),
        allowNull: false,
    },
    balance: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'userId' // Specify the correct column name
    },
    stripeAccountId: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    createdAt: {
        type: DataTypes.DATE,
        field: 'createdAt' // Specify the correct column name
    },
    updatedAt: {
        type: DataTypes.DATE,
        field: 'updatedAt' // Specify the correct column name
    }
});

// Define Transaction model
const Transaction = sequelize.define('Transaction', {
    transaction_type: {
        type: DataTypes.ENUM('Deposit', 'Withdrawal', 'Transfer'),
        allowNull: false,
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    date: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    fromAccountId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: "fromAccountId"
    },
    toAccountId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: "toAccountId"
    },
    createdAt: {
        type: DataTypes.DATE,
        field: 'createdAt' // Specify the correct column name
    },
    updatedAt: {
        type: DataTypes.DATE,
        field: 'updatedAt' // Specify the correct column name
    }
})

// Define associations
User.hasMany(Account)
Account.belongsTo(User, { foreignKey: 'userId' });
Transaction.belongsTo(Account, { foreignKey: 'fromAccountId' })
Transaction.belongsTo(Account, { foreignKey: 'toAccountId' })

// Sync the models with the database
sequelize.sync()

module.exports = {
    User,
    Account,
    Transaction
}