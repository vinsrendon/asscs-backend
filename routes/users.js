const express = require("express")
const bcrypt = require("bcrypt")
const router = express.Router()
const jwt = require("jsonwebtoken")
const dotenv = require('dotenv')
// const {verifyToken} = require('./verify.js')

dotenv.config()

const  { getUsers, registerUser} = require('../database.js')

router.get('/users', async (req,res) => {
    // const token = req.cookies.token;
    try {
        // const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const users = await getUsers()
        // const filteredUsers = users.filter(user => user.uid !== decoded.id);
        if (users.length === 0) {
            return res.status(200).json("NO USERS FOUND");
        } else {
            return res.status(200).json(users);
        }        
    } 
    catch (err) {      
        return res.status(500).json({ message: "Unexpected Error occurred",error:err });
    }    
})

router.post("/register", async (req,res) => {
    const {firstname,middlename,lastname,course,role,phone,email,password} = req.body   
    // return res.status(200).json(res.body)
    
    if (!firstname || !lastname|| !role || !phone|| !email || !password) {
        return res.status(422).json({message: "Fill all necessary fields." })
    }       

    try {
        const hash = await bcrypt.hash(password,13) 

        await registerUser(firstname,middlename,lastname,course,role,phone,email,hash)
        
        return res.status(200).json({message: "REGISTERED SUCCESSFULLY"})
    } catch (error) {
        if(error.code === "ER_DUP_ENTRY") return res.status(409).json({message: "USERNAME ALREADY EXIST"})
        
        else return res.status(500).json({message: "ERROR", error})        
    }
})

module.exports = router