const express = require("express")
const bcrypt = require("bcrypt")
const router = express.Router()
const jwt = require("jsonwebtoken")
const dotenv = require('dotenv')
const {verifyToken} = require('./verify.js')


const  { createExam, getExams} = require('../database.js')

router.get('/exams', verifyToken, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1
        const limit = parseInt(req.query.limit) || 10
        const search = req.query.search || ''

        if (page < 1 || limit < 1 || limit > 100) {
        return res.status(400).json({ message: "Invalid page or limit" })
        }

        const result = await getExams({ page, limit, search })

        return res.status(200).json(result)
    } catch (err) {
        return res.status(500).json({ 
            message: "Unexpected Error occurred", 
            error: err.message 
        })
    }
})

router.post("/exam",verifyToken, async (req, res) => {
const token = req.cookies.token
const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

    try {
        const { subject, title, type, numberOfItems} = req.body
        console.log(req.body);
        
        const userId = decoded.id    

        if (!subject) {
        return res.status(400).json({ error: "Subject is required" })
        }

        const result = await createExam(subject, title, type, numberOfItems, userId)

        res.status(200).json({
        message: "Exam created successfully",
        exam: result.rows[0],
        });
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: "Failed to create exam" })
    }
})

module.exports = router