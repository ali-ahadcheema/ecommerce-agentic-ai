import "dotenv/config" // sab se upar, taake baaki imports se pehle env load ho
import express from "express"
import mongoose from "mongoose"
import route from "./routes/user.route.js"
import cors from "cors"
import cookieParser from "cookie-parser"
import { paymenthook } from "./fuctions/user.function.js"
import product from "./mongo/product.mongo.js"
import redis from "./redis.js"
import passport from "passport"
import { Strategy as GoogleStrategy } from "passport-google-oauth20"


const app = express()


app.post("/paynow", express.raw({ type: "application/json" }), paymenthook)

app.use(cookieParser())
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}))


app.use(passport.initialize())



passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK,
}, (accessToken, refreshToken, profile, done) => {
    return done(null, profile);
}))




app.use(express.json())

app.use("/link", route)

mongoose.connect(process.env.mongo, { maxPoolSize: 10 })
    .then(() => {
        console.log("mongo connected", process.pid)
        product.createIndexes()
        app.listen(process.env.PORT, () => {
            console.log("port", process.env.PORT)
            console.log("server start", process.pid)
        })

    })
    .catch((error) => console.log(error))
await redis

