import express from "express"
import dotnev from "dotenv"
dotnev.config()


const app = express()

app.use(express.json())



app.get("/link/", (req, res) => {
    res.json("server2 is ok")
})

app.listen(process.env.PORT2, () => {
    console.log("server is start")
})