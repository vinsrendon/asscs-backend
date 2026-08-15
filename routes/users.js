const express = require("express")
const bcrypt = require("bcrypt")
const router = express.Router()
const jwt = require("jsonwebtoken")
const dotenv = require('dotenv')
const {verifyToken} = require('./verify.js')

dotenv.config()

const  { getUsers, registerUser, loginUser, getUserById} = require('../database.js')

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
        if(error.code === "ER_DUP_ENTRY") return res.status(409).json({message: "email ALREADY EXIST"})
        
        else return res.status(500).json({message: "ERROR", error})        
    }
})

router.post("/login" , async (req,res) => {
    const {email,password} = req.body    

    if (!email || !password) {
        return res.status(400).json({ message: "email and password are required." });
    }

    try {
        const user = await loginUser(email)                 
        if (user[0]) {
            const userbyid = await getUserById(user[0].uid)
            console.log(userbyid);
            const isValid = await bcrypt.compare(password,user[0].password)

            if(user[0].status === 0) return res.status(404).json({message: "NO USER FOUND"})

            if(isValid){
                const fname = userbyid[0].fname;
                const lname = userbyid[0].lname;
                const name = lname.charAt(0).toUpperCase() + "." + fname.charAt(0).toUpperCase() + fname.slice(1).toLowerCase();
                const token = jwt.sign({ id: user[0].uid, user: user[0].email,name:name,role:user[0].role }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "12h" });

                const isDev = process.env.MODE === 'DEV'
                
                res.cookie("token", token, {
                httpOnly: true, 
                secure: !isDev,
                sameSite: isDev ? "lax" : "none",
                maxAge: 60 * 60 * 1000, //1 HOUR
                partitioned: !isDev,
                });
                console.log(email+" LOGGED IN");
                
                return res.status(200).json({message: "LOGGED IN", email:user[0].email,name:name, role:user[0].role})
            }
            else
                return res.status(403).json({message: "WRONG USER OR PASS"})
        } 
        else {
            return res.status(404).json({message: "NO USER FOUND"})
        }

    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Unexpected Error occurred",error:err });
    }
})

router.get('/userbyid', async (req,res) => {
    const {uid} = req.body

    try {        
        const user = await getUserById(uid)
        return res.status(200).json(user);
    } 
    catch (err) {   
        return res.status(500).json({ message: "Unexpected Error occurred",error:err });
    }    
})

module.exports = router