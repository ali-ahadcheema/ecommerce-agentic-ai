import nodemailer from "nodemailer"
import dotenv from "dotenv"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, "../.env") })

export const transporte = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: process.env.admin_gmail,
        pass: process.env.gmail_secret
    }
})


export const mailsender = async (req, res, next) => {
    try {
        const { orderid, toemail } = req.orderInfo

        const info = await transporte.sendMail({
            from: process.env.admin_gmail,
            to: toemail,
            subject: "your order has been shiipend",
            html: ` <p>Good news! Your order <b>${orderid}</b> has been shipped.</p>`
        })

        console.log("message send", info.messageId)
        next()
    }
    catch (error) {
        console.log("error message", error)
    }
}
