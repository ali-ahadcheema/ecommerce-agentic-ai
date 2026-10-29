import User from "../mongo/user.mongo.js";
import jwt from "jsonwebtoken"
import dotenv from "dotenv"


dotenv.config()
export const admin = async (req, res, next) => {
    try {

        const token = req.cookies.token
        if (!token) {
            return res.json("token is not availble")
        }

        const decode = jwt.verify(token, process.env.secret)
        if (!decode) {
            return res.json("user is not authorize")
        }

        const user = decode.id
        const finduser = await User.findById(user)

        if (finduser.usertype === "localuser") {
            return res.json("user is not admin")
        }
        next()

    }
    catch (error) {
        return res.status(500).json(error.message)
    }
}

export default admin