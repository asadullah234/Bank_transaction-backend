const accountModel=require("../models/Account")

async function createAccount(req,res){
    const userId=req.user
    const account=await accountModel.create({
        user:user._id
    })
    res.status(201).json({
        account
    })
}
async function getUserAccount(req,res){
    const accounts=await accountModel.find({user:req.user._id})
    res.status(200).json({
        accounts
    })

}
async function getAccountBalance(req,res){
    const {accountId}=req.params;
    const account=await accountModel.findOne({_id:accountId,user:req.user._id})
    if(!account){
        return res.status(400).json({
            message:"Account not found"
        })
    }
    const balance=await account.getAccountBalance();

}

module.exports={createAccount,getUserAccount}
