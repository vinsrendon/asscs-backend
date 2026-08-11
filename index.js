const express = require("express")
const cors = require("cors")
const cookieParser = require("cookie-parser")
const dotenv = require('dotenv')
const pool = require('./database'); 

const app = express();
app.use(express.json());

app.get("/", (req, res)=>{      
    res.json(
        {
            message: "Automated Shaded Sheet Checker System API"
        }
    );
});

const PORT = 8080
app.listen(PORT, ()=>{
    console.log(`SERVER IS RUNNING ON PORT ${PORT}`);
});

const userRouter = require("./routes/users.js")

app.use(userRouter)