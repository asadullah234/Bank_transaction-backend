const userModel=require("../models/User")
const jwt=require("jsonwebtoken")



function userRegister(req,res){
    const {email,password,name}=req.body
    const isExists=await userModel.findOne({
        email:email

    })
    if(isExists){
        return res.status(422).json({
            message:"user already exist",
            status:"failed"
        })
    }
    const user=await userModel.create({email,password,name})
    const token=jwt.sign({userId:user._id},process.env.JWT_SECRET_KEY,{expiresIn:'1h'})
   res.cookies("token",token)
   res.status(201).json({user:{
    _id:user._id,
    email:user.email,
    name:user.name
   }})
   token
}
function userLogin(req,res)
{
    const{email,password}=req.body
    const user=await userModel.findOne({email}).select("+password")
    if (!user){
        return res.status(401).json({
            message:"email or password invalid"
        })

    }
    const isValidPassword=await user.comparePassword(password)
    if(!isValidPassword)
    {
        return res.status(401).json({
            message:"email or password invalid"
        })

    }
     const token=jwt.sign({userId:user._id},process.env.JWT_SECRET_KEY,{expiresIn:'1h'})
   res.cookies("token",token)
   res.status(201).json({user:{
    _id:user._id,
    email:user.email,
    name:user.name
   }})
   token
}
module.exports={userRegister,userLogin}