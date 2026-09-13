const express = require("express")
const bcrypt = require("bcrypt")
const router = express.Router()
const jwt = require("jsonwebtoken")
const dotenv = require('dotenv')
const {verifyToken} = require('./verify.js')


const  { createExam} = require('../database.js')

router.post("/exam",verifyToken, async (req, res) => {
const token = req.cookies.token
const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

    try {
        const { subject, title, type = "subject" } = req.body
        const userId = decoded.id    

        if (!subject) {
        return res.status(400).json({ error: "Subject is required" })
        }

        const result = await createExam(subject, title, type, userId)

        res.status(201).json({
        message: "Exam created successfully",
        exam: result.rows[0],
        });
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: "Failed to create exam" })
    }
});

module.exports = router