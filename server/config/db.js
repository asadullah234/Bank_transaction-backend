const mongoose=require("mongoose")



function connectDB(){
    mongoose.connect(process.env.MONGO_URI)
    .then(()=>
    {
        console.log("server running on port")
    })
    .catch(err=>{
        console.log("error connecting db")
   process.exit(1)
    })
  }
  module.exports=connectDB()