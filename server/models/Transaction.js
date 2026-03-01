const mongoose=require("mongoose")
const transactionSchema=new mongoose.Schema({
    fromAccount:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"account",
        required:[true,"need account"],
        index:true
    },
toAccount:{
     type:mongoose.Schema.Types.ObjectId,
        ref:"account",
        required:[true,"need account"],
        index:true
},
status:{
    type:String,
    enum:{
        values:["pending","completed","failed","reversed"],
        message:"status can either pending "
    },
    default:"pending"
},
amount:{
    type:Number,
    required:[true,
        "Amount is required"
    ]
    ,
    min:[0,"transaction cannot be negatie"]
},
idempotencyKey:{
    type:String,
    required:[true,"idem key is required"],
    index:true,
    unique:true
}
},
{
    timeStamps:true
})
const transactionModel=mongoose.model("transaction",transactionSchema)
module.exports=transactionModel