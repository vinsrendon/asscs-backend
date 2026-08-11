const express = require("express")
const bcrypt = require("bcrypt")
const router = express.Router()
const jwt = require("jsonwebtoken")
const dotenv = require('dotenv')
// const {verifyToken} = require('./verify.js')

dotenv.config()

const  { getUsers} = require('../database.js')

router.get('/users', async (req,res) => {
    // const token = req.cookies.token;
    try {
        // const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const users = await getUsers()
        // const filteredUsers = users.filter(user => user.uid !== decoded.id);
        return res.status(200).json(users);
    } 
    catch (err) {      
        return res.status(500).json({ message: "Unexpected Error occurred",error:err });
    }    
})

module.exports = router