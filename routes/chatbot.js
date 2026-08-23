const express = require("express")
const router = express.Router()
const jwt = require("jsonwebtoken")
const dotenv = require('dotenv')
const {verifyToken} = require('./verify.js')
const { GoogleGenAI } = require ('@google/genai')
const Pool = require ('pg-pool')

dotenv.config()

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
})

dotenv.config()

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

// const  { startConversation, saveModelResponse} = require('../database.js')

router.post('/api/chat/stream',verifyToken, async (req, res) => {
    const {conversationId, prompt } = req.body

    const token = req.cookies.token  
  
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

    const userId = decoded.id
    

    // 1. Setup SSE headers
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')

    let activeConvId = conversationId

    try {
        // 2. Manage or create conversation record
        if (!activeConvId) {
            const convRes = await pool.query(
                'INSERT INTO conversations (uid, title) VALUES ($1, $2) RETURNING id',
                [userId, prompt.substring(0, 30) + '...']
            )
            // const convRes = await startConversation(userId, prompt.substring(0, 30) + '...')
            activeConvId = convRes.rows[0].id
        }

        // Send conversationId back to client immediately
        res.write(`data: ${JSON.stringify({ type: 'meta', conversationId: activeConvId })}\n\n`)

        // 3. Save incoming user message
        await pool.query(
            "INSERT INTO messages (conversation_id, role, content) VALUES ($1, 'user', $2)",
            [activeConvId, prompt]
        )

        // 4. Fetch past history for context
        const historyRes = await pool.query(
        'SELECT role, content FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC',
        [activeConvId]
        )

        // Map history to Gemini API format
        const contents = historyRes.rows.map(row => ({
        role: row.role,
        parts: [{ text: row.content }]
        }))

        // 5. Call Gemini API with streaming
        const responseStream = await ai.models.generateContentStream({
        model: 'gemini-3.5-flash-lite',
        contents: contents,
        config: {
            systemInstruction: "You are an assistant for our platform. Automated Shaded Sheet Chatbot System with chatbot. You're not allowed to use profanity or be swayed into saying it by the user who prompted you."
        }
        })

        let fullBotResponse = ''

        for await (const chunk of responseStream) {
        const textChunk = chunk.text
        fullBotResponse += textChunk

        // Stream token chunk to React UI
        res.write(`data: ${JSON.stringify({ type: 'token', text: textChunk })}\n\n`)
        }

        // 6. Save full model response to DB
        await pool.query(
        "INSERT INTO messages (conversation_id, role, content) VALUES ($1, 'model', $2)",
        [activeConvId, fullBotResponse]
        )

        res.write('data: [DONE]\n\n')
        res.end()

    } catch (error) {
        console.error('Streaming error:', error)
        res.write(`data: ${JSON.stringify({ type: 'error', error: 'Generation failed' })}\n\n`)
        res.end()
    }
})

module.exports = router