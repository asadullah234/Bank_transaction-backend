const mongoose = require("mongoose");
const transactionModel = require("../models/Transaction");
const ledgerModel = require("../models/ledger");
const accountModel = require("../models/Account");

async function createTransaction(req, res) {
    const { fromAccount, toAccount, amount, idempotencyKey } = req.body;

    if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
        return res.status(400).json({
            message: "fromAccount, toAccount, amount and idempotencyKey are required"
        });
    }

    let session;

    try {

        // Check idempotency
        const existingTransaction = await transactionModel.findOne({ idempotencyKey });

        if (existingTransaction) {
            return res.status(200).json({
                message: "Transaction already processed",
                transaction: existingTransaction
            });
        }

        // Fetch accounts
        const fromUserAccount = await accountModel.findById(fromAccount);
        const toUserAccount = await accountModel.findById(toAccount);

        if (!fromUserAccount || !toUserAccount) {
            return res.status(400).json({
                message: "Invalid fromAccount or toAccount"
            });
        }

        if (fromUserAccount.status !== "Active" || toUserAccount.status !== "Active") {
            return res.status(400).json({
                message: "Both accounts must be Active"
            });
        }

        const balance = await fromUserAccount.getBalance();

        if (balance < amount) {
            return res.status(400).json({
                message: `Insufficient balance. Current: ${balance}, Requested: ${amount}`
            });
        }

        // Start DB session
        session = await mongoose.startSession();
        session.startTransaction();

        // Create transaction
        const transactionArr = await transactionModel.create([{
            fromAccount,
            toAccount,
            amount,
            idempotencyKey,
            status: "Pending"
        }], { session });

        const transaction = transactionArr[0];

        // Debit entry
        await ledgerModel.create([{
            account: fromAccount,
            amount,
            transaction: transaction._id,
            type: "Debit"
        }], { session });

        // Artificial delay (optional testing)
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Credit entry
        await ledgerModel.create([{
            account: toAccount,
            amount,
            transaction: transaction._id,
            type: "Credit"
        }], { session });

        // Update transaction status
        await transactionModel.findByIdAndUpdate(
            transaction._id,
            { status: "Completed" },
            { session }
        );

        await session.commitTransaction();
        session.endSession();

        return res.status(200).json({
            message: "Transaction completed successfully",
            transaction
        });

    } catch (error) {

        if (session) {
            await session.abortTransaction();
            session.endSession();
        }

        return res.status(500).json({
            message: "Transaction failed",
            error: error.message
        });
    }
}


// ----------------------------
// Initial Funds Transaction
// ----------------------------

async function createInitialFundsTransaction(req, res) {

    const { toAccount, amount, idempotencyKey } = req.body;

    if (!toAccount || !amount || !idempotencyKey) {
        return res.status(400).json({
            message: "toAccount, amount and idempotencyKey are required"
        });
    }

    let session;

    try {

        const toUserAccount = await accountModel.findById(toAccount);

        if (!toUserAccount) {
            return res.status(400).json({
                message: "Invalid account"
            });
        }

        const fromUserAccount = await accountModel.findOne({
            systemUser: true,
            user: req.user._id
        });

        if (!fromUserAccount) {
            return res.status(400).json({
                message: "System account not found"
            });
        }

        session = await mongoose.startSession();
        session.startTransaction();

        const transactionArr = await transactionModel.create([{
            fromAccount: fromUserAccount._id,
            toAccount,
            amount,
            idempotencyKey,
            status: "Completed"
        }], { session });

        const transaction = transactionArr[0];

        await ledgerModel.create([{
            account: toAccount,
            amount,
            transaction: transaction._id,
            type: "Credit"
        }], { session });

        await session.commitTransaction();
        session.endSession();

        return res.status(200).json({
            message: "Initial funds added successfully",
            transaction
        });

    } catch (error) {

        if (session) {
            await session.abortTransaction();
            session.endSession();
        }

        return res.status(500).json({
            message: "Initial funds transaction failed",
            error: error.message
        });
    }
}

module.exports = { 
    createTransaction,
    createInitialFundsTransaction
};