const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const {JWT_SECRET} = require('../Keys')
const requireLogin = require('../middleware/requireLogin')

const User = mongoose.model('User')

// Demo how middleware is working
// router.get('/protected', requireLogin, (req,res)=>{
//     res.send("hello user")
// })

//SignUp Route
router.post('/signup',(req,res)=>{
    const {name, email, password} = req.body
    if(!email || !password || !name){
        return res.status(422).json({error:"Please add all the fields"})
    }

    //Email Regex(Email Validity Checking)
    if(!/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(email)){
            return res.status(422).json({error:"INVALID EMAIL"})
    }
    
    User.findOne({email: email})
    .then((savedUser)=>{
        if(savedUser){
            return res.status(422).json({error:"User already exists with the email"})
        }

        bcrypt.hash(password, 12)
        .then(hashedPassword=>{
            const user = new User({
                email,
                password : hashedPassword,
                name
            })
    
            user.save()
            .then(user=>{
                res.json({message:"SignedUp Successfully"})
            })
            .catch(err=>{
                console.log(err)
            })
        })

    })
    .catch(err=>{
        console.log(err)
    })
})

//SignIn Route
router.post('/signin',(req,res)=>{
    const {email, password} = req.body
    if(!email || !password){
        return res.status(422).json({error:"Please Add email or password"})
    }

    //Email Regex(Email Validity Checking)
    if(!/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(email)){
        return res.status(422).json({error:"INVALID EMAIL"})
    }

    User.findOne({email:email})
    .then(savedUser=>{
        if(!savedUser){
            return res.status(422).json({error:"Invalid Email or password"})
        }
        bcrypt.compare(password, savedUser.password)
        .then(doMatch =>{
            if(doMatch){
                // res.json({message:"Successfully Signed In"})
                const token = jwt.sign({_id:savedUser.id}, JWT_SECRET)
                const {_id, name, email} = savedUser
                res.json({token, user:{_id, name, email}})
            }
            else{
                return res.status(422).json({error:"Invalid Email or password"})
            }
        })
        .catch(err=>{
            console.log(err)
        })
    })
})


module.exports = router