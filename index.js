const express = require("express")
const cors = require("cors")
const cookieParser = require("cookie-parser")
const dotenv = require('dotenv')
const pool = require('./database')
const fs = require('fs')
const https = require('https')

const allowedOrigins = process.env.ALLOW_ORIGINS? process.env.ALLOW_ORIGINS.split(',').map(origin => origin.trim()): []
const mode = process.env.MODE

const app = express()
app.use(express.json())
app.use(cookieParser())

app.use(
  cors({
    origin: function (origin, callback) {      
      if (mode === 'DEV' && (!origin || origin.match(/^https?:\/\/.*:5173$/) || origin.match(/^https?:\/\/.*:4173$/))) {
        callback(null, true)
      }
      else if(allowedOrigins.includes(origin)){
        callback(null, true)
      }
      else {
        console.log('Blocked CORS origin:', origin)
        callback(new Error("Not allowed by CORS"))
      }
    },
    credentials: true,
  })
)

app.get("/", (req, res)=>{      
    res.json(
        {
            message: "Automated Shaded Sheet Checker System API"
        }
    )
})

const userRouter = require("./routes/users.js")
const chatbotRouter = require("./routes/chatbot.js")

app.use(userRouter)
app.use(chatbotRouter)

const httpsOptions = {
  key: fs.readFileSync('./cert/192.168.254.108+2-key.pem'),
  cert: fs.readFileSync('./cert/192.168.254.108+2.pem')
}

const PORT = 8080

// app.listen(PORT, ()=>{
//     console.log(`SERVER IS RUNNING ON https://localhost:${PORT}`)
// })
https.createServer(
    httpsOptions,
    app
).listen(PORT, '0.0.0.0', () => {
    console.log(
      `HTTPS server running at https://192.168.254.108:${PORT}`
    )
})

